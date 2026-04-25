import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { GAME_CONFIG } from "../../config/gameConfig";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";
import { useCoupon } from "../../context/CouponContext";
import { useEconomy } from "../../context/EconomyContext";
import { usePrediction } from "../../context/PredictionContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";
import { type CommentNode } from "../../data/mockPredictions";
import { getUserByName } from "../../data/mockUsers";
import { supabase } from "../../lib/supabase";
import type { PredictionChoice } from "../../types";
import { formatTimeLeft } from "../../utils/relativeTime";

export default function TahminDetayPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { questions, getLiveOdds, placeStake, userStakes } = usePrediction();
  const { wallet } = useEconomy();
  const { showFeedback } = useUIFeedback();
  const { selections, upsertSelection, openCouponPanel } = useCoupon();
  const { kpBalance, unlockedPredictionIds, unlockPredictionAccess } = useAppData();
  const { currentUser } = useAuth();

  const q = questions.find((x) => x.id === id);
  const liveOdds = q ? (getLiveOdds(q.id) ?? { yesOdd: 1.0, noOdd: 1.0 }) : null;
  const existingStake = q ? userStakes.get(q.id) : undefined;
  const effectiveStatus =
    q
      ? q.status === "open" && Date.now() >= q.closesAt
        ? "closed"
        : q.status
      : null;

  const [pendingSide, setPendingSide] = useState<PredictionChoice | null>(null);
  const [amountText, setAmountText] = useState("");

  const [comments, setComments] = useState<CommentNode[]>([]);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (!q?.id) return;
    
    const fetchComments = async () => {
      const { data } = await (supabase as any).from('prediction_comments').select('*').eq('prediction_id', q.id).order('created_at', { ascending: true });
      if (data) {
        const map = new Map();
        const roots: CommentNode[] = [];
        data.forEach((r: any) => map.set(r.id, { id: r.id, user: r.user_name, text: r.text, replies: [] }));
        data.forEach((r: any) => {
          if (r.parent_id && map.has(r.parent_id)) {
            map.get(r.parent_id).replies.push(map.get(r.id));
          } else {
            roots.push(map.get(r.id));
          }
        });
        setComments(roots);
      }
    };
    
    fetchComments();

    const channel = supabase.channel(`comments:${q.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prediction_comments', filter: `prediction_id=eq.${q.id}` }, fetchComments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [q?.id]);

  if (!q || !liveOdds) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>
          Tahmin bulunamadı
        </Text>
      </View>
    );
  }

  // Erişim kapısı: open/closed sorularda katılım yoksa ve kilit açılmamışsa
  const isResolved = q.status === "resolved" || q.status === "cancelled";
  const hasExistingStake = userStakes.has(q.id);
  const isUnlocked = unlockedPredictionIds.includes(q.id);
  const needsAccessGate = false;

  if (needsAccessGate) {
    const cost = GAME_CONFIG.prediction.openAccessCostKp;
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 26,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              backgroundColor: q.status === "open" ? "#eff6ff" : "#fef9c3",
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: q.status === "open" ? "#1d4ed8" : "#a16207",
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {q.category} • {q.status === "open" ? "Açık" : "Kapandı"}
            </Text>
          </View>
          <Text
            style={{
              color: "#0f172a",
              fontSize: 22,
              fontWeight: "800",
              lineHeight: 30,
              marginBottom: 8,
            }}
          >
            {q.title}
          </Text>
          <Text style={{ color: "#64748b", lineHeight: 22 }}>
            {q.description}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 24,
            alignItems: "center",
          }}
        >
          <Ionicons name="lock-closed" size={40} color="#94a3b8" style={{ marginBottom: 14 }} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Bu tahmin kilitli
          </Text>
          <Text
            style={{
              color: "#64748b",
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            Sonuçlanmış tahminler herkese açıktır. Aktif tahminleri görüntülemek için{" "}
            <Text style={{ fontWeight: "800", color: "#0f172a" }}>{cost} KP</Text> gerekmektedir.
          </Text>

          <Text style={{ color: "#94a3b8", fontSize: 13, marginBottom: 20 }}>
            Bakiyen: {kpBalance} KP
          </Text>

          <Pressable
            onPress={() => {
              const result = unlockPredictionAccess(q.id);
              showFeedback({
                type: result.type,
                title: result.title,
                message: result.message,
                kpDelta: result.kpDelta,
              });
            }}
            style={{
              backgroundColor: kpBalance >= cost ? "#14b8a6" : "#cbd5e1",
              borderRadius: 16,
              paddingVertical: 16,
              paddingHorizontal: 32,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Text
              style={{
                color: kpBalance >= cost ? "#ffffff" : "#64748b",
                fontWeight: "800",
                fontSize: 16,
              }}
            >
              {kpBalance >= cost ? `${cost} KP ile Görüntüle` : "Yetersiz KP"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ── Havuz istatistikleri ─────────────────────────────────────

  const totalPool = q.yesPool + q.noPool;
  const yesPct = totalPool > 0 ? Math.round((q.yesPool / totalPool) * 100) : 50;
  const noPct = 100 - yesPct;

  // ── Kupon seçim durumu ───────────────────────────────────────

  const couponSelected = selections.find((x) => x.predictionId === q.id);
  const yesSelected = couponSelected?.choice === "EVET";
  const noSelected = couponSelected?.choice === "HAYIR";

  // ── Taraf kilit kuralı ───────────────────────────────────────

  const canSelectYes = !existingStake || existingStake.side === "EVET";
  const canSelectHayir = !existingStake || existingStake.side === "HAYIR";

  const isOpen = effectiveStatus === "open";

  // ── Taraf seç (kupon + direkt stake için) ────────────────────

  const handleSidePress = (choice: PredictionChoice) => {
    if (!isOpen) return;
    if (choice === "EVET" && !canSelectYes) return;
    if (choice === "HAYIR" && !canSelectHayir) return;

    setPendingSide((prev) => (prev === choice ? null : choice));

    // Aynı zamanda kupona da ekle
    upsertSelection({
      predictionId: q.id,
      title: q.title,
      category: q.category,
      choice,
      odd: choice === "EVET" ? liveOdds.yesOdd : liveOdds.noOdd,
    });
    openCouponPanel();
  };

  // ── Direkt TP yatır ──────────────────────────────────────────

  const handleStake = async () => {
    if (!pendingSide) return;
    const amount = parseInt(amountText.trim(), 10);

    if (isNaN(amount) || amount <= 0) {
      showFeedback({
        type: "error",
        title: "Geçersiz Miktar",
        message: "Geçerli bir TP miktarı gir.",
      });
      return;
    }

    const result = await placeStake(q.id, pendingSide, amount);

    showFeedback({
      type: result.ok ? "success" : "error",
      title: result.ok ? "Tahmin Girildi" : "İşlem Başarısız",
      message: result.message,
    });

    if (result.ok) {
      setPendingSide(null);
      setAmountText("");
    }
  };

  // ── Yorum ağacı yardımcıları ─────────────────────────────────

  const addReplyToTree = (
    nodes: CommentNode[],
    targetId: string,
    reply: CommentNode
  ): CommentNode[] =>
    nodes.map((node) => {
      if (node.id === targetId) {
        return { ...node, replies: [...(node.replies ?? []), reply] };
      }
      return {
        ...node,
        replies: node.replies
          ? addReplyToTree(node.replies, targetId, reply)
          : [],
      };
    });

  const submitTopLevelComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setCommentText("");
    if (currentUser && q) {
      (supabase as any).from('prediction_comments').insert({
         prediction_id: q.id,
         user_id: currentUser.id,
         user_name: currentUser.displayName || currentUser.username || "Oyuncu",
         text: trimmed,
         parent_id: null
      }).then();
    }
  };

  const submitReply = (targetId: string) => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setReplyText("");
    setReplyingToId(null);
    if (currentUser && q) {
      (supabase as any).from('prediction_comments').insert({
         prediction_id: q.id,
         user_id: currentUser.id,
         user_name: currentUser.displayName || currentUser.username || "Oyuncu",
         text: trimmed,
         parent_id: targetId
      }).then();
    }
  };

  const renderCommentNode = (node: CommentNode, depth = 0) => {
    const isReplying = replyingToId === node.id;
    const profile = getUserByName(node.user);

    return (
      <View
        key={node.id}
        style={{
          marginLeft: depth > 0 ? 18 : 0,
          paddingBottom: 14,
          marginBottom: 14,
          borderBottomWidth: depth === 0 ? 1 : 0,
          borderBottomColor: "#eef2f7",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <Pressable
            onPress={() => {
              if (profile) {
                router.push({
                  pathname: "/kullanici-menu/[id]",
                  params: { id: profile.id },
                });
              }
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: profile?.frameColor ?? "#cbd5e1",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 10,
            }}
          >
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#0f172a" }}>
                {profile?.avatar ?? node.user[0]}
              </Text>
            </View>
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              {node.user}
            </Text>
            <Text style={{ color: "#475569", lineHeight: 22, marginBottom: 10 }}>
              {node.text}
            </Text>
            <Pressable
              onPress={() => {
                if (isReplying) {
                  setReplyingToId(null);
                  setReplyText("");
                } else {
                  setReplyingToId(node.id);
                  setReplyText("");
                }
              }}
              style={{
                alignSelf: "flex-start",
                backgroundColor: "#eff6ff",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                marginBottom: node.replies?.length ? 10 : 0,
              }}
            >
              <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 12 }}>
                {isReplying ? "Vazgeç" : "Yanıtla"}
              </Text>
            </Pressable>

            {(node.replies ?? []).map((r) => renderCommentNode(r, depth + 1))}

            {isReplying && (
              <View
                style={{
                  marginTop: 12,
                  marginLeft: 18,
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <TextInput
                  value={replyText}
                  onChangeText={setReplyText}
                  placeholder="Yanıtını yaz..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  style={{
                    minHeight: 70,
                    color: "#0f172a",
                    textAlignVertical: "top",
                  }}
                />
                <Pressable
                  onPress={() => submitReply(node.id)}
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-end",
                    backgroundColor: "#2563eb",
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>
                    Yanıtı Gönder
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Badge metni ──────────────────────────────────────────────

  const statusBadgeText =
    effectiveStatus === "open"
      ? formatTimeLeft(q.closesAt)
      : effectiveStatus === "closed"
      ? "Kapandı"
      : effectiveStatus === "resolved"
      ? "Sonuçlandı"
      : "İptal";

  const statusBadgeBg =
    effectiveStatus === "open"
      ? "rgba(15,23,42,0.58)"
      : effectiveStatus === "resolved"
      ? "#16a34a"
      : "#dc2626";

  // ── Ortalama giriş oranı ─────────────────────────────────────

  const avgEntryOdd =
    existingStake && existingStake.entries.length > 0
      ? (
          existingStake.entries.reduce((s, e) => s + e.oddAtTime, 0) /
          existingStake.entries.length
        ).toFixed(2)
      : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#f8fafc" }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View
          style={{
            borderRadius: 26,
            overflow: "hidden",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
          }}
        >
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: q.image }}
              resizeMode="cover"
              style={{ width: "100%", height: 230, backgroundColor: "#e2e8f0" }}
            />

            <View
              style={{
                position: "absolute",
                top: 14,
                left: 14,
                backgroundColor: "rgba(255,255,255,0.94)",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 12 }}>
                {q.category}
              </Text>
            </View>

            <View
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                backgroundColor: statusBadgeBg,
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>
                {statusBadgeText}
              </Text>
            </View>
          </View>

          <View style={{ padding: 18 }}>
            <Text
              style={{
                color: "#0f172a",
                fontSize: 26,
                fontWeight: "800",
                lineHeight: 34,
                marginBottom: 10,
              }}
            >
              {q.title}
            </Text>
            <Text style={{ color: "#475569", lineHeight: 22, fontSize: 15 }}>
              {q.description}
            </Text>
          </View>
        </View>

        {/* ── Havuz Bilgisi ─────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
          }}
        >
          {/* Oran çubuğu */}
          <View
            style={{
              flexDirection: "row",
              borderRadius: 999,
              overflow: "hidden",
              marginBottom: 10,
              height: 10,
            }}
          >
            <View
              style={{ flex: yesPct, backgroundColor: "#16a34a" }}
            />
            <View
              style={{ flex: noPct, backgroundColor: "#dc2626" }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Text style={{ color: "#16a34a", fontWeight: "700" }}>
              EVET %{yesPct}
            </Text>
            <Text style={{ color: "#dc2626", fontWeight: "700" }}>
              %{noPct} HAYIR
            </Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="people-outline" size={15} color="#64748b" />
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {q.participantCount} katılımcı
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={15} color="#64748b" />
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {q.commentCount} yorum
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="wallet-outline" size={15} color="#64748b" />
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {totalPool.toLocaleString()} TP havuz
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tahmin / Durum Kartı ──────────────────────────────── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
          }}
        >
          {/* AÇIK: tahmin giriş formu */}
          {isOpen && (
            <>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                {existingStake ? "Pozisyonun" : "Tahmin Gir"}
              </Text>

              {/* Mevcut pozisyon */}
              {existingStake && (
                <View
                  style={{
                    backgroundColor:
                      existingStake.side === "EVET" ? "#f0fdf4" : "#fef2f2",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 14,
                    borderWidth: 1,
                    borderColor:
                      existingStake.side === "EVET" ? "#86efac" : "#fca5a5",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color:
                        existingStake.side === "EVET" ? "#166534" : "#991b1b",
                      marginBottom: 4,
                    }}
                  >
                    {existingStake.side} tarafındasın
                  </Text>
                  <Text style={{ color: "#475569" }}>
                    Toplam: {existingStake.totalAmount} TP •{" "}
                    {existingStake.entries.length} işlem
                  </Text>
                  {avgEntryOdd && (
                    <Text
                      style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}
                    >
                      Ort. giriş oranı: {avgEntryOdd}
                    </Text>
                  )}
                </View>
              )}

              {/* Bakiye */}
              <Text
                style={{ color: "#64748b", fontSize: 13, marginBottom: 14 }}
              >
                Bakiye:{" "}
                <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                  {wallet.tp} TP
                </Text>
              </Text>

              {/* EVET / HAYIR butonları */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
                <Pressable
                  onPress={() => handleSidePress("EVET")}
                  disabled={!canSelectYes}
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    borderRadius: 15,
                    backgroundColor:
                      pendingSide === "EVET"
                        ? "#16a34a"
                        : yesSelected
                        ? "#dcfce7"
                        : "#f0fdf4",
                    borderWidth: 1.5,
                    borderColor:
                      pendingSide === "EVET"
                        ? "#16a34a"
                        : yesSelected
                        ? "#4ade80"
                        : "#86efac",
                    alignItems: "center",
                    opacity: !canSelectYes ? 0.38 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        pendingSide === "EVET" ? "#ffffff" : "#166534",
                      marginBottom: 4,
                      fontWeight: "700",
                    }}
                  >
                    EVET
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color:
                        pendingSide === "EVET" ? "#ffffff" : "#166534",
                    }}
                  >
                    {liveOdds.yesOdd.toFixed(2)}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSidePress("HAYIR")}
                  disabled={!canSelectHayir}
                  style={{
                    flex: 1,
                    paddingVertical: 15,
                    borderRadius: 15,
                    backgroundColor:
                      pendingSide === "HAYIR"
                        ? "#dc2626"
                        : noSelected
                        ? "#fee2e2"
                        : "#fef2f2",
                    borderWidth: 1.5,
                    borderColor:
                      pendingSide === "HAYIR"
                        ? "#dc2626"
                        : noSelected
                        ? "#f87171"
                        : "#fca5a5",
                    alignItems: "center",
                    opacity: !canSelectHayir ? 0.38 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color:
                        pendingSide === "HAYIR" ? "#ffffff" : "#991b1b",
                      marginBottom: 4,
                      fontWeight: "700",
                    }}
                  >
                    HAYIR
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color:
                        pendingSide === "HAYIR" ? "#ffffff" : "#991b1b",
                    }}
                  >
                    {liveOdds.noOdd.toFixed(2)}
                  </Text>
                </Pressable>
              </View>

              {/* Miktar girişi (taraf seçilince açılır) */}
              {pendingSide && (
                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 16,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#0f172a",
                      marginBottom: 10,
                    }}
                  >
                    {existingStake ? "Ek Yatırım" : "Yatırım Miktarı"} —{" "}
                    <Text
                      style={{
                        color:
                          pendingSide === "EVET" ? "#166534" : "#991b1b",
                      }}
                    >
                      {pendingSide}
                    </Text>
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#ffffff",
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      paddingHorizontal: 14,
                      marginBottom: 6,
                    }}
                  >
                    <TextInput
                      value={amountText}
                      onChangeText={setAmountText}
                      placeholder="Miktar gir..."
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      style={{
                        flex: 1,
                        paddingVertical: 14,
                        color: "#0f172a",
                        fontSize: 18,
                        fontWeight: "700",
                      }}
                    />
                    <Text style={{ color: "#64748b", fontWeight: "700" }}>
                      TP
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: "#94a3b8",
                      fontSize: 12,
                      marginBottom: 14,
                    }}
                  >
                    Min: {GAME_CONFIG.prediction.minStakePerQuestion} TP
                  </Text>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <Pressable
                      onPress={() => {
                        setPendingSide(null);
                        setAmountText("");
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 13,
                        borderRadius: 13,
                        backgroundColor: "#f1f5f9",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#475569", fontWeight: "700" }}>
                        Vazgeç
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={handleStake}
                      style={{
                        flex: 2,
                        paddingVertical: 13,
                        borderRadius: 13,
                        backgroundColor:
                          pendingSide === "EVET" ? "#16a34a" : "#dc2626",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#ffffff",
                          fontWeight: "800",
                          fontSize: 15,
                        }}
                      >
                        {existingStake ? "Ekle" : "Yatır"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}

          {/* KAPALI: sonuç bekleniyor */}
          {effectiveStatus === "closed" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="time-outline" size={20} color="#f59e0b" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#0f172a",
                  }}
                >
                  Sonuç Bekleniyor
                </Text>
              </View>

              <Text style={{ color: "#64748b", marginBottom: existingStake ? 12 : 0 }}>
                Soru kapandı, sonuç açıklanmayı bekliyor.
              </Text>

              {existingStake && (
                <View
                  style={{
                    backgroundColor:
                      existingStake.side === "EVET" ? "#f0fdf4" : "#fef2f2",
                    borderRadius: 14,
                    padding: 12,
                    borderWidth: 1,
                    borderColor:
                      existingStake.side === "EVET" ? "#86efac" : "#fca5a5",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color:
                        existingStake.side === "EVET" ? "#166534" : "#991b1b",
                    }}
                  >
                    {existingStake.side} • {existingStake.totalAmount} TP
                    yatırdın
                  </Text>
                </View>
              )}
            </>
          )}

          {/* SONUÇLANDI */}
          {effectiveStatus === "resolved" && q.outcome && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#0f172a",
                  }}
                >
                  Sonuçlandı
                </Text>
              </View>

              <View
                style={{
                  backgroundColor:
                    q.outcome === "EVET" ? "#f0fdf4" : "#fef2f2",
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor:
                    q.outcome === "EVET" ? "#86efac" : "#fca5a5",
                  marginBottom: existingStake ? 12 : 0,
                }}
              >
                <Text
                  style={{
                    fontWeight: "800",
                    fontSize: 16,
                    color: q.outcome === "EVET" ? "#166534" : "#991b1b",
                  }}
                >
                  {q.outcome} kazandı
                </Text>
              </View>

              {existingStake && (
                <View
                  style={{
                    borderRadius: 14,
                    padding: 12,
                    backgroundColor:
                      existingStake.side === q.outcome ? "#f0fdf4" : "#fef2f2",
                    borderWidth: 1,
                    borderColor:
                      existingStake.side === q.outcome ? "#86efac" : "#fca5a5",
                  }}
                >
                  {existingStake.side === q.outcome ? (
                    <>
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "#166534",
                          marginBottom: 4,
                        }}
                      >
                        Kazandın!
                      </Text>
                      <Text style={{ color: "#475569" }}>
                        {existingStake.totalAmount} TP yatırdın. Kazancın TP
                        bakiyene eklendi.
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "#991b1b",
                          marginBottom: 4,
                        }}
                      >
                        Kaybettin
                      </Text>
                      <Text style={{ color: "#475569" }}>
                        {existingStake.totalAmount} TP → KP'ye dönüştürüldü.
                      </Text>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          {/* İPTAL */}
          {effectiveStatus === "cancelled" && (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Ionicons name="close-circle" size={22} color="#dc2626" />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "800",
                    color: "#0f172a",
                  }}
                >
                  İptal Edildi
                </Text>
              </View>
              <Text style={{ color: "#64748b" }}>
                Bu soru iptal edildi. Yatırdığın TP iade edildi.
              </Text>
            </>
          )}
        </View>

        {/* ── Uzun Açıklama ─────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 10,
            }}
          >
            Tahmin Özeti
          </Text>
          <Text style={{ fontSize: 15, lineHeight: 24, color: "#475569" }}>
            {q.longDescription}
          </Text>
        </View>

        {/* ── Yorumlar ──────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 22,
            padding: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 14,
            }}
          >
            Yorum Alanı
          </Text>

          <View
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 16,
              padding: 14,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ color: "#64748b", marginBottom: 8 }}>
              Yorumlara ve yorum cevaplarına yanıt verebilirsin.
            </Text>
            <Text style={{ color: "#94a3b8" }}>
              Avatarlara basınca küçük aksiyon balonu açılır.
            </Text>
          </View>

          {comments.map((comment) => renderCommentNode(comment))}

          {/* Yeni yorum girişi */}
          <View
            style={{
              marginTop: 8,
              backgroundColor: "#f8fafc",
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Yorumunu yaz..."
              placeholderTextColor="#94a3b8"
              multiline
              style={{
                minHeight: 70,
                color: "#0f172a",
                textAlignVertical: "top",
              }}
            />
            <Pressable
              onPress={submitTopLevelComment}
              style={{
                marginTop: 10,
                alignSelf: "flex-end",
                backgroundColor: "#14b8a6",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                Yorum Gönder
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
