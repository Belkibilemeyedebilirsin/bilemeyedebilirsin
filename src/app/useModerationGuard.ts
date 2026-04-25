// Moderasyon kısıtlamalarını (ban/mute) kontrol eden hook
// - moderation_records üzerinde realtime dinleme
// - Ban > mute önceliği, scope eşleşmesinde genel_sohbet > scoped
// - canSendMessage çağrısında expires_at tazelik kontrolü
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export type ModerationScope = "genel_sohbet" | "takim_sohbeti" | "sohbet_odasi";

type ModerationRecord = {
  action_type: "ban" | "mute";
  scope_type: ModerationScope;
  scope_id: string | null;
  reason: string | null;
  expires_at: string | null;
};

const WARNING_DISPLAY_MS = 7000;

function isRecordActive(record: ModerationRecord, nowMs: number): boolean {
  if (!record.expires_at) return true;
  return new Date(record.expires_at).getTime() > nowMs;
}

function recordPriority(record: ModerationRecord): number {
  // Ban > mute, kalıcı > geçici, genel_sohbet > scoped
  let score = 0;
  if (record.action_type === "ban") score += 100;
  if (record.expires_at === null) score += 50;
  if (record.scope_type === "genel_sohbet") score += 10;
  return score;
}

function pickActiveRestriction(
  records: ModerationRecord[],
  scopeType: ModerationScope,
  scopeId: string | null,
  nowMs: number
): ModerationRecord | null {
  const candidates = records.filter((r) => {
    if (!isRecordActive(r, nowMs)) return false;
    // genel_sohbet kısıtlaması her chat'i kapsar
    if (r.scope_type === "genel_sohbet") return true;
    if (r.scope_type !== scopeType) return false;
    return r.scope_id === scopeId || r.scope_id === null;
  });

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => recordPriority(b) - recordPriority(a))[0];
}

function buildWarningMessage(record: ModerationRecord, nowMs: number): string {
  const actionText = record.action_type === "ban" ? "banlandınız" : "susturuldunuz";
  const scopeText =
    record.scope_type === "genel_sohbet"
      ? "Genel sohbet ve tüm iletişim kanallarında"
      : record.scope_type === "takim_sohbeti"
      ? "Bu takım sohbetinde"
      : "Bu sohbet odasında";

  if (record.expires_at === null) {
    return `${scopeText} kalıcı olarak ${actionText}.${record.reason ? ` Sebep: ${record.reason}` : ""}`;
  }

  const diffMs = new Date(record.expires_at).getTime() - nowMs;
  if (diffMs <= 0) return "";

  const days = Math.floor(diffMs / 86_400_000);
  const hours = Math.floor((diffMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

  let timeStr = "";
  if (days > 0) timeStr += `${days} gün `;
  if (hours > 0) timeStr += `${hours} saat `;
  if (days === 0) timeStr += `${minutes} dakika`;

  return `${scopeText} geçici olarak ${actionText}. Kalan süre: ${timeStr.trim()}.${record.reason ? ` Sebep: ${record.reason}` : ""}`;
}

export function useModerationGuard(scopeType: ModerationScope, scopeId: string | null = null) {
  const { currentUser } = useAuth();

  const [records, setRecords] = useState<ModerationRecord[]>([]);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tüm aktif kayıtları çek + realtime aboneliği aç
  useEffect(() => {
    if (!currentUser) {
      setRecords([]);
      return;
    }

    let cancelled = false;

    const fetchRecords = async () => {
      const { data, error } = await supabase
        .from("moderation_records")
        .select("action_type, scope_type, scope_id, reason, expires_at")
        .eq("user_id", currentUser.id)
        .eq("is_active", true);

      if (cancelled) return;
      if (error || !data) {
        setRecords([]);
        return;
      }
      setRecords(data as ModerationRecord[]);
    };

    fetchRecords();

    // Admin tarafından ban/mute eklendiğinde veya kaldırıldığında anında güncelle
    const channel = supabase
      .channel(`mod-${currentUser.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "moderation_records",
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Süre dolumlarını yakalamak için her 30sn'de zamanı tazele
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const activeRestriction = useMemo(
    () => pickActiveRestriction(records, scopeType, scopeId, nowMs),
    [records, scopeType, scopeId, nowMs]
  );

  const canSendMessage = useCallback((): boolean => {
    if (!currentUser) return false;

    // Anlık tazelik için Date.now() kullan; state nowMs eski olabilir
    const now = Date.now();
    const restriction = pickActiveRestriction(records, scopeType, scopeId, now);

    if (!restriction) {
      setWarningMessage(null);
      return true;
    }

    const msg = buildWarningMessage(restriction, now);
    if (!msg) return true; // Tam o anda süresi dolduysa geçir

    setWarningMessage(msg);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    warningTimerRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, WARNING_DISPLAY_MS);

    return false;
  }, [currentUser, records, scopeType, scopeId]);

  // Yeni bir kısıtlama aktifleşirse otomatik olarak input'u kilitle ve uyarıyı göster
  useEffect(() => {
    if (!activeRestriction) {
      setWarningMessage(null);
      return;
    }
    const msg = buildWarningMessage(activeRestriction, Date.now());
    if (msg) setWarningMessage(msg);
  }, [activeRestriction]);

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  return {
    canSendMessage,
    warningMessage,
    isRestricted: !!activeRestriction,
    restriction: activeRestriction,
    dismissWarning: () => setWarningMessage(null),
  };
}
