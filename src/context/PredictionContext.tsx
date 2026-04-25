/**
 * Tahmin Sistemi Context'i.
 *
 * Sorumluluklar:
 * - Parimutuel havuz yönetimi (EVET/HAYIR pool)
 * - Canlı oran hesaplama (havuz oranlarından)
 * - Kullanıcı stake yönetimi (tek tarafa kilit, ekleme desteği)
 * - Soru kapanış saati kontrolü
 * - Sonuçlandırma (resolve), iptal (cancel), iade (refund)
 * - Oran geçmişi snapshot'ları
 * - Temel istatistik kaydı
 *
 * Mock fazında: in-memory state.
 * Backend fazında: Supabase RPC'ye taşınacak.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { supabase } from "../lib/supabase";
import type {
  OddsSnapshot,
  PredictionChoice,
  PredictionQuestion,
  PredictionStats,
  PredictionStatus,
  StakeEntry,
  UserStake
} from "../types";
import { checkUserRestriction } from "../utils/moderation";
import { useAuth } from "./AuthContext";
import { useEconomy } from "./EconomyContext";

// ─────────────────────────────────────────────────────────────
// Yardımcı: Parimutuel oran hesaplama
// ─────────────────────────────────────────────────────────────

/**
 * Parimutuel oran hesapla.
 * Oran = toplamHavuz / tarafHavuz (sistem kesintisi sonrası).
 */
function calculateOdd(effectiveTotal: number, effectiveSide: number): number {
  const cfg = GAME_CONFIG.prediction;
  const netPool = effectiveTotal * (1 - cfg.parimutuelSystemCut);
  const raw = netPool / effectiveSide;
  return Math.min(Math.max(raw, cfg.minDisplayOdd), cfg.maxDisplayOdd);
}

/** Canlı oranları havuzdan hesapla. */
function computeLiveOdds(q: PredictionQuestion): { yesOdd: number; noOdd: number } {
  const cfg = GAME_CONFIG.prediction;
  const effectiveYes = q.yesPool + cfg.baseLiquidity;
  const effectiveNo = q.noPool + cfg.baseLiquidity;
  const effectiveTotal = effectiveYes + effectiveNo;

  return {
    yesOdd: calculateOdd(effectiveTotal, effectiveYes),
    noOdd: calculateOdd(effectiveTotal, effectiveNo),
  };
}

// ─────────────────────────────────────────────────────────────
// Context Tipleri
// ─────────────────────────────────────────────────────────────

type StakeResult = {
  ok: boolean;
  message: string;
  /** Yatırım sonrası güncel oran (başarılıysa). */
  newOdd?: number;
};

/** Yeni soru oluşturmak için gerekli alanlar. */
export type CreateQuestionInput = {
  category: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  accent: string;
  tags: string[];
  /** Kapanışa kadar süre (saat). */
  durationHours: number;
};

/** Soru düzenlemek için güncellenebilir alanlar. */
export type EditQuestionInput = Partial<
  Pick<PredictionQuestion, "title" | "description" | "longDescription" | "image" | "accent" | "tags" | "category">
> & {
  /** Kapanış süresini uzat (saat). */
  extendHours?: number;
};

type PredictionContextType = {
  /** Tüm sorular. */
  questions: PredictionQuestion[];

  /** Kullanıcının aktif stake'leri (questionId → UserStake). */
  userStakes: Map<string, UserStake>;

  /** Kullanıcı istatistikleri. */
  stats: PredictionStats;

  /** Bir sorunun canlı oranlarını al. */
  getLiveOdds: (questionId: string) => { yesOdd: number; noOdd: number } | null;

  /** Bir soruya TP yatır. Aynı soruda zaten karşı taraftaysa reddeder. */
  placeStake: (questionId: string, side: PredictionChoice, amount: number) => Promise<StakeResult>;

  /** Bir sorunun oran geçmişini al. */
  getOddsHistory: (questionId: string) => OddsSnapshot[];

  /** Sorunun mevcut durumunu al. */
  getQuestionStatus: (questionId: string) => PredictionStatus | null;

  /** Kupon hacmini havuza enjekte et (Sadece oranları değiştirmek için) */
  injectVolume: (questionId: string, side: PredictionChoice, amount: number) => void;

  /** Anasayfa pull-to-refresh için soruları baştan çeker */
  refreshQuestions: () => Promise<void>;
};

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function PredictionProvider({ children }: { children: React.ReactNode }) {
  const { wallet, spendTp, addTp, convertLostPredictionTp } = useEconomy();
  const { currentUser } = useAuth();

  const [questions, setQuestions] = useState<PredictionQuestion[]>([]);
  const [userStakes, setUserStakes] = useState<Map<string, UserStake>>(new Map());
  const [stats, setStats] = useState<PredictionStats>({
    totalQuestions: 0,
    totalStaked: 0,
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    profitLoss: 0,
  });

  const refreshQuestions = useCallback(async () => {
    let retries = 3;
    while (retries >= 0) {
      const { data, error } = await (supabase as any)
        .from('prediction_questions')
        .select('*')
        .in('status', ['open', 'closed', 'resolved']) // Sadece ilgili durumları çek
        .order('created_at', { ascending: false });
      if (error && String(error.message).includes('Lock broken') && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
        retries--;
        continue;
      }
      if (data) {
        const mapped: PredictionQuestion[] = data.map((r: any) => ({
          id: r.id,
          category: r.category,
          title: r.title,
          description: r.description,
          longDescription: r.long_description,
          image: r.image_url,
          accent: r.accent_color,
          tags: r.tags || [],
          status: r.status,
          closesAt: new Date(r.closes_at).getTime(),
          resolvedAt: r.resolved_at ? new Date(r.resolved_at).getTime() : null,
          outcome: r.outcome,
          yesPool: r.yes_pool,
          noPool: r.no_pool,
          participantCount: r.participant_count,
          commentCount: r.comment_count,
          oddsHistory: [],
        }));
        setQuestions(prevQuestions => {
          const questionMap = new Map(prevQuestions.map(q => [q.id, q]));
          mapped.forEach(newQ => {
            const oldQ = questionMap.get(newQ.id);
            if (oldQ) {
              newQ.oddsHistory = oldQ.oddsHistory;
            }
          });
          return mapped;
        });
      }
      break;
    }
  }, []);

  // ── Soruları ve Havuzları Çekme (Real-time) ───────────
  useEffect(() => {
    refreshQuestions();

    const channel = (supabase as any).channel('public:prediction_questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prediction_questions' }, (payload: any) => {
        refreshQuestions();
      })
      .subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [refreshQuestions]);

  // ── Kullanıcı Bahislerini Çekme (Real-time) ───────────
  useEffect(() => {
    if (!currentUser?.id) return;
    
    const fetchStakes = async (retryCount = 0) => {
      const { data, error } = await (supabase as any).from('prediction_stakes').select('*').eq('user_id', currentUser.id);
      if (error && String(error.message).includes('Lock broken') && retryCount < 3) {
        setTimeout(() => fetchStakes(retryCount + 1), 300);
        return;
      }
      if (error) {
        console.error("BAHİSLERİ ÇEKME HATASI:", error);
      }
      if (data) {
        const newMap = new Map<string, UserStake>();
        data.forEach((r: any) => {
          const entry: StakeEntry = { timestamp: new Date(r.created_at).getTime(), amount: r.amount, oddAtTime: parseFloat(r.odd_at_time) };
          const key = `${r.question_id}_${r.side}`;
          if (newMap.has(key)) {
            const existing = newMap.get(key)!;
            existing.totalAmount += r.amount;
            existing.entries.push(entry);
          } else {
            newMap.set(key, { questionId: r.question_id, side: r.side, totalAmount: r.amount, entries: [entry] });
          }
        });
        setUserStakes(newMap);
      }
    };

    fetchStakes();

    const stakesChannel = (supabase as any).channel(`public:prediction_stakes_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prediction_stakes', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchStakes();
      }).subscribe();
    return () => { (supabase as any).removeChannel(stakesChannel); };
  }, [currentUser?.id]);

  // ── Oran snapshot kaydet ───────────────────────────────

  const recordOddsSnapshot = useCallback((questionId: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;

        const { yesOdd, noOdd } = computeLiveOdds(q);
        const total = q.yesPool + q.noPool;
        const lastSnapshot = q.oddsHistory[q.oddsHistory.length - 1];

        // Minimum aralık kontrolü
        if (
          lastSnapshot &&
          Date.now() - lastSnapshot.timestamp < GAME_CONFIG.prediction.oddsSnapshotIntervalMs
        ) {
          return q;
        }

        const snapshot: OddsSnapshot = {
          timestamp: Date.now(),
          yesOdd,
          noOdd,
          totalPool: total,
        };

        const history = [...q.oddsHistory, snapshot];
        if (history.length > GAME_CONFIG.prediction.maxOddsSnapshots) {
          history.shift();
        }

        return { ...q, oddsHistory: history };
      }),
    );
  }, []);

  // ── Canlı oran al ──────────────────────────────────────

  const getLiveOdds = useCallback(
    (questionId: string): { yesOdd: number; noOdd: number } | null => {
      const q = questions.find((x) => x.id === questionId);
      if (!q) return null;
      return computeLiveOdds(q);
    },
    [questions],
  );

  // ── Stake yatır ────────────────────────────────────────

  const placeStake = useCallback(
    async (questionId: string, side: PredictionChoice, amount: number): Promise<StakeResult> => {
      if (!currentUser) return { ok: false, message: "Oturum bulunamadı. Lütfen giriş yapın." };

      // Moderasyon Kontrolü: Kullanıcı banlı mı?
      const restriction = await checkUserRestriction(currentUser.id, "ban");
      if (restriction.restricted) {
        return { ok: false, message: `Hesabınız kısıtlanmıştır: ${restriction.reason}` };
      }

      const q = questions.find((x) => x.id === questionId);
      if (!q) {
        return { ok: false, message: "Soru bulunamadı." };
      }

      // Durum kontrolü
      if (q.status !== "open") {
        return { ok: false, message: "Bu soru artık tahmine açık değil." };
      }

      // Kapanış saati kontrolü
      if (Date.now() >= q.closesAt) {
        return { ok: false, message: "Soru kapanış saati geçti, yeni yatırım yapılamaz." };
      }

      // Minimum stake kontrolü
      const minStake: number = GAME_CONFIG.prediction.minStakePerQuestion;
      if (amount < minStake) {
        return { ok: false, message: `Minimum ${minStake} TP yatırmalısın.` };
      }

      // Bakiye kontrolü
      const currentTp = wallet?.tp ?? 0;
      if (currentTp < amount) {
        return { ok: false, message: "Yeterli TP bakiyen yok." };
      }

      // %75 sınırı kontrolü (toplam bakiyeye göre)
      const maxAllowed =
        currentTp >= GAME_CONFIG.prediction.lowBalanceThreshold
          ? Math.floor(currentTp * GAME_CONFIG.prediction.maxStakeRatio)
          : currentTp;

      if (amount > maxAllowed) {
        return {
          ok: false,
          message: `Tek bir soruya en fazla ${maxAllowed} TP yatırabilirsin (%${Math.round(GAME_CONFIG.prediction.maxStakeRatio * 100)} kuralı).`,
        };
      }

      const hasAnyStakeInQuestion = Array.from(userStakes.values()).some(s => s.questionId === questionId);

      let rpcResult: any = { message: "Tahmin başarıyla yatırıldı." };

      const currentOdds = computeLiveOdds(q);
      rpcResult.newOdd = side === "EVET" ? currentOdds.yesOdd : currentOdds.noOdd;

      // Yeni güvenli RPC çağrısı: Hem bahsi kaydeder hem havuzu atomik olarak günceller
      (supabase as any).rpc("place_prediction_stake", {
        p_user_id: currentUser.id,
        p_question_id: questionId,
        p_side: side,
        p_amount: amount,
        p_odd_at_time: rpcResult.newOdd
      }).then(({ error }: any) => {
        if (error) console.error("Supabase RPC hatası (place_prediction_stake):", error.message);
      });

      // Yerel TP Düşümü (UI anında güncellensin diye, DB'den zaten düştüğü için RPC atla)
      spendTp(amount, "prediction_stake", `Tahmin yatırımı`);

      // ── Optimiztik (Anında) UI Güncellemesi ──
      setQuestions((prev) =>
        prev.map((x) => {
          if (x.id !== questionId) return x;
          const poolField = side === "EVET" ? "yesPool" : "noPool";
          const isNewParticipant = !hasAnyStakeInQuestion;
          return {
            ...x,
            [poolField]: x[poolField] + amount,
            participantCount: isNewParticipant ? x.participantCount + 1 : x.participantCount,
          };
        })
      );

      setUserStakes((prev) => {
        const next = new Map(prev);
        const stakeKey = `${questionId}_${side}`;
        const existing = next.get(stakeKey);
        const entry: StakeEntry = {
          timestamp: Date.now(),
          amount,
          oddAtTime: rpcResult.newOdd,
        };
        if (existing) {
          next.set(stakeKey, {
            ...existing,
            totalAmount: existing.totalAmount + amount,
            entries: [...existing.entries, entry],
          });
        } else {
          next.set(stakeKey, { questionId, side, totalAmount: amount, entries: [entry] });
        }
        return next;
      });

      recordOddsSnapshot(questionId);

      // İstatistik güncelle
      setStats((prev) => ({
        ...prev,
        totalQuestions: !hasAnyStakeInQuestion ? prev.totalQuestions + 1 : prev.totalQuestions,
        totalStaked: prev.totalStaked + amount,
      }));

      return {
        ok: true,
        message: rpcResult.message,
        newOdd: rpcResult.newOdd,
      };
    },
    [questions, userStakes, wallet?.tp, spendTp, currentUser],
  );

  // ── Oran geçmişi ──────────────────────────────────────

  const getOddsHistory = useCallback(
    (questionId: string): OddsSnapshot[] => {
      const q = questions.find((x) => x.id === questionId);
      return q?.oddsHistory ?? [];
    },
    [questions],
  );

  // ── Soru durumu ────────────────────────────────────────

  const getQuestionStatus = useCallback(
    (questionId: string): PredictionStatus | null => {
      const q = questions.find((x) => x.id === questionId);
      if (!q) return null;

      // Otomatik kapanış: zamanı geçmişse status'u güncelle
      if (q.status === "open" && Date.now() >= q.closesAt) {
        return "closed";
      }

      return q.status;
    },
    [questions],
  );

  // ── Hacim Enjekte Et (Kuponlar İçin) ─────────────────────

  const injectVolume = useCallback(
    (questionId: string, side: PredictionChoice, amount: number) => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          const poolField = side === "EVET" ? "yesPool" : "noPool";
          return { ...q, [poolField]: q[poolField] + amount };
        })
      );
      recordOddsSnapshot(questionId);

      // Kupon yatırımlarını DB tarafında havuza atomik olarak ekle
      (supabase as any).rpc("inject_prediction_volume", {
        p_question_id: questionId,
        p_side: side,
        p_amount: amount
      }).then(({ error }: any) => {
        if (error) console.error("Supabase RPC hatası (inject_prediction_volume):", error.message);
      });
    },
    [recordOddsSnapshot]
  );

  // ── Context Value ──────────────────────────────────────

  const value = useMemo(
    () => ({
      questions,
      userStakes,
      stats,
      getLiveOdds,
      placeStake,
      getOddsHistory,
      getQuestionStatus,
      injectVolume,
      refreshQuestions,
    }),
    [
      questions,
      userStakes,
      stats,
      getLiveOdds,
      placeStake,
      getOddsHistory,
      getQuestionStatus,
      injectVolume,
      refreshQuestions,
    ],
  );

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);

  if (!context) {
    throw new Error("usePrediction must be used inside PredictionProvider");
  }

  return context;
}
