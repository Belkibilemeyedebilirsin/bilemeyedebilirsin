import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { usePrediction } from "../context/PredictionContext";
import type { PredictionQuestion, UserStake } from "../types/prediction";

function ResolvedCard({
  q,
  stake,
  expanded,
  onToggle,
}: {
  q: PredictionQuestion;
  stake: UserStake | undefined;
  expanded: boolean;
  onToggle: () => void;
}) {
  const participated = !!stake;
  const won = participated && stake.side === q.outcome;

  const totalPool = q.yesPool + q.noPool;
  const winnerPool = q.outcome === "EVET" ? q.yesPool : q.noPool;
  const payout =
    won && stake
      ? Math.floor(stake.entries.reduce((sum, entry) => sum + entry.amount * entry.oddAtTime, 0))
      : 0;
  const kpReturn = participated && !won
    ? Math.floor(stake.totalAmount * GAME_CONFIG.prediction.predictionLossKpRate)
    : 0;

  const badgeBg = participated ? (won ? "#dcfce7" : "#fee2e2") : "#f1f5f9";
  const badgeColor = participated ? (won ? "#166534" : "#991b1b") : "#475569";
  const badgeLabel = participated ? (won ? "Kazandı" : "Kaybetti") : "Sonuçlandı";

  const resolvedDate = q.resolvedAt
    ? new Date(q.resolvedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })
    : "";

  return (
    <Pressable
      onPress={onToggle}
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 16,
        marginBottom: 14,
      }}
    >
      {/* Başlık satırı */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 }}>
            {q.title}
          </Text>
          <Text style={{ color: "#64748b", fontSize: 12 }}>
            {q.category}{resolvedDate ? ` • ${resolvedDate}` : ""}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: badgeBg,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ fontWeight: "700", color: badgeColor, fontSize: 12 }}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      {/* Sonuç satırı (her zaman görünür) */}
      <View
        style={{
          backgroundColor: q.outcome === "EVET" ? "#f0fdf4" : "#fef2f2",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: "600" }}>Sonuç:</Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: q.outcome === "EVET" ? "#166534" : "#991b1b",
          }}
        >
          {q.outcome}
        </Text>
      </View>

      {/* Kullanıcı katılım bilgisi (katıldıysa) */}
      {participated && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Seçimim</Text>
            <Text style={{ color: stake.side === "EVET" ? "#16a34a" : "#dc2626", fontWeight: "800", fontSize: 13 }}>
              {stake.side}
            </Text>
          </View>
          <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Yatırılan</Text>
            <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 13 }}>
              {stake.totalAmount} TP
            </Text>
          </View>
          {won ? (
            <View style={{ backgroundColor: "#f0fdf4", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Kazanç</Text>
              <Text style={{ color: "#166534", fontWeight: "800", fontSize: 13 }}>{payout} TP</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: "#fef2f2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>KP İadesi</Text>
              <Text style={{ color: "#991b1b", fontWeight: "800", fontSize: 13 }}>{kpReturn} KP</Text>
            </View>
          )}
        </View>
      )}

      {/* Havuz detayı (genişletilince) */}
      {expanded ? (
        <View style={{ borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12 }}>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <View style={{ backgroundColor: "#f0fdf4", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>EVET Havuzu</Text>
              <Text style={{ color: "#16a34a", fontWeight: "800", fontSize: 13 }}>
                {q.yesPool.toLocaleString("tr-TR")} TP
              </Text>
            </View>
            <View style={{ backgroundColor: "#fef2f2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>HAYIR Havuzu</Text>
              <Text style={{ color: "#dc2626", fontWeight: "800", fontSize: 13 }}>
                {q.noPool.toLocaleString("tr-TR")} TP
              </Text>
            </View>
            <View style={{ backgroundColor: "#f8fafc", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2 }}>Katılımcı</Text>
              <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 13 }}>{q.participantCount}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
            <Text style={{ color: "#64748b", fontWeight: "700", fontSize: 13 }}>Kapat</Text>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", alignItems: "center" }}>
          <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 13 }}>Havuz detayı</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function ZamanYolculuguPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { questions, userStakes } = usePrediction();
  const { currentProfileAppearance } = useAppData();

  const resolvedQuestions = questions
    .filter((q) => q.status === "resolved")
    .sort((a, b) => (b.resolvedAt ?? 0) - (a.resolvedAt ?? 0));

  const participatedWon = resolvedQuestions.filter(
    (q) => userStakes.has(q.id) && userStakes.get(q.id)?.side === q.outcome
  ).length;
  const participatedLost = resolvedQuestions.filter(
    (q) => userStakes.has(q.id) && userStakes.get(q.id)?.side !== q.outcome
  ).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View
        style={{
          backgroundColor: currentProfileAppearance.themeColor,
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          ZAMAN YOLCULUĞU
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 16,
          }}
        >
          Geçmiş tahminleri incele
        </Text>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
              Toplam Soru
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {resolvedQuestions.length}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
              Kazandığım
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {participatedWon}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
              Kaybettiğim
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {participatedLost}
            </Text>
          </View>
        </View>
      </View>

      {resolvedQuestions.length === 0 ? (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 15, fontWeight: "600" }}>
            Henüz sonuçlanmış tahmin yok.
          </Text>
        </View>
      ) : (
        resolvedQuestions.map((q) => (
          <ResolvedCard
            key={q.id}
            q={q}
            stake={userStakes.get(q.id)}
            expanded={expandedId === q.id}
            onToggle={() =>
              setExpandedId((prev) => (prev === q.id ? null : q.id))
            }
          />
        ))
      )}
    </ScrollView>
  );
}
