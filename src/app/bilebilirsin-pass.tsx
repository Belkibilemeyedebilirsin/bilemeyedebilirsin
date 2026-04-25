import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAppData } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";

export default function BilebilirsinPassPage() {
  const {
    passDays,
    streakCount,
    hasPass,
    claimedPassDays,
    claimPassDay,
    purchasePass,
    currentProfileAppearance,
  } = useAppData();
  const { showFeedback } = useUIFeedback();

  const handleClaim = (day: number) => {
    const result = claimPassDay(day);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });
  };

  const handlePurchasePass = () => {
    const result = purchasePass();
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
    });
  };

  const totalFreeKp = passDays.reduce((sum, d) => sum + d.freeKp, 0);
  const totalPremiumKp = passDays.reduce((sum, d) => sum + d.premiumKp, 0);
  const claimedCount = claimedPassDays.length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Header */}
      <View
        style={{
          backgroundColor: hasPass ? "#1d4ed8" : currentProfileAppearance.themeColor,
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "700" }}>
            BİLEBİLİRSİN PASS
          </Text>
          {hasPass && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.22)",
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 11 }}>
                PREMİUM AKTİF
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 10,
          }}
        >
          {hasPass ? "Premium pass aktif!" : "14 günlük sezon akışı"}
        </Text>

        <Text style={{ color: "#ffffff", lineHeight: 22, marginBottom: 14 }}>
          Sol taraf ücretsiz, sağ taraf premium. Premium alanlar iki tarafı birden toplar.
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
              Ücretsiz toplam
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>{totalFreeKp} KP</Text>
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
              Premium toplam
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>+{totalPremiumKp} KP</Text>
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
              Toplanan
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {claimedCount} / {passDays.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Purchase / Status card */}
      {!hasPass ? (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: "#0f172a",
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            Bilebilirsin Pass Satın Al
          </Text>

          <Text style={{ color: "#64748b", lineHeight: 22, marginBottom: 4 }}>
            Premium geçişi aktifleştirir. Her gün hem ücretsiz hem premium ödülü toplarsın.
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 16,
            }}
          >
            <Ionicons name="gift-outline" size={16} color="#0f766e" />
            <Text style={{ color: "#0f766e", fontWeight: "700" }}>
              Aktivasyon sonrası 200 TP bonus eklenir
            </Text>
          </View>

          <Pressable
            onPress={handlePurchasePass}
            style={{
              backgroundColor: "#1d4ed8",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              ₺129,99 ile Pass Satın Al
            </Text>
          </Pressable>
        </View>
      ) : (
        <View
          style={{
            backgroundColor: "#eff6ff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#bfdbfe",
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Ionicons name="checkmark-circle" size={28} color="#2563eb" />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#1e40af", fontWeight: "800", fontSize: 16, marginBottom: 4 }}>
              Premium pass aktif
            </Text>
            <Text style={{ color: "#3b82f6", lineHeight: 20 }}>
              Tüm günlerin ücretsiz ve premium ödüllerini toplayabilirsin.
            </Text>
          </View>
        </View>
      )}

      {/* Day list */}
      {passDays.map((dayItem) => {
        const unlocked = dayItem.day <= streakCount;
        const claimed = claimedPassDays.includes(dayItem.day);
        const totalKp = hasPass ? dayItem.freeKp + dayItem.premiumKp : dayItem.freeKp;

        return (
          <View
            key={dayItem.day}
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: claimed ? "#bbf7d0" : "#e5e7eb",
              padding: 14,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
                Gün {dayItem.day}
              </Text>
              <View
                style={{
                  backgroundColor: "#fef9c3",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#854d0e", fontWeight: "800", fontSize: 13 }}>
                  {totalKp} KP
                </Text>
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: "#f8fafc",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flex: 1,
                  padding: 14,
                  borderRightWidth: 1,
                  borderRightColor: "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    color: "#16a34a",
                    fontWeight: "800",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  ÜCRETSİZ
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "700" }}>
                  {dayItem.freeReward}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  padding: 14,
                  opacity: hasPass ? 1 : 0.45,
                }}
              >
                <Text
                  style={{
                    color: "#2563eb",
                    fontWeight: "800",
                    fontSize: 12,
                    marginBottom: 6,
                  }}
                >
                  PREMIUM
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "700" }}>
                  {dayItem.premiumReward}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (!claimed && unlocked) handleClaim(dayItem.day);
              }}
              style={{
                backgroundColor: claimed
                  ? "#cbd5e1"
                  : unlocked
                  ? "#14b8a6"
                  : "#e2e8f0",
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: claimed ? "#475569" : unlocked ? "#ffffff" : "#64748b",
                  fontWeight: "800",
                }}
              >
                {claimed
                  ? "Toplandı"
                  : unlocked
                  ? "Bugünün Ödülünü Topla"
                  : "Kilidi Açılmadı"}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
