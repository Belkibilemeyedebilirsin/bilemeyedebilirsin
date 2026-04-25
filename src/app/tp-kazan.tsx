import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";

type BonusEntry = {
  id: string;
  title: string;
  description: string;
  tp: number;
  icon: string;
};

const BONUS_LIST: BonusEntry[] = [
  {
    id: "profileComplete",
    title: "Profil Tamamlama",
    description: "Kullanıcı adı ve biyografini doldur.",
    tp: GAME_CONFIG.bonusActions.profileComplete,
    icon: "person-circle-outline",
  },
  {
    id: "firstCoupon",
    title: "İlk Kupon",
    description: "İlk kuponunu oluştur veya paylaş.",
    tp: GAME_CONFIG.bonusActions.firstCoupon,
    icon: "ticket-outline",
  },
  {
    id: "firstWin",
    title: "İlk Kazanç",
    description: "İlk tekli tahminini veya kuponunu kazan.",
    tp: GAME_CONFIG.bonusActions.firstWin,
    icon: "ribbon-outline",
  },
  {
    id: "weeklyStreak",
    title: "Haftalık Streak",
    description: "7 gün üst üste uygulamaya giriş yap.",
    tp: GAME_CONFIG.bonusActions.weeklyStreak,
    icon: "flame-outline",
  },
  {
    id: "friendInvite",
    title: "Arkadaş Daveti",
    description: "Bir arkadaşını uygulamaya davet et.",
    tp: GAME_CONFIG.bonusActions.friendInvite,
    icon: "person-add-outline",
  },
];

export default function TpKazanPage() {
  const { claimedBonusIds, claimBonus, currentProfileAppearance } = useAppData();
  const { showFeedback } = useUIFeedback();

  const totalClaimable = BONUS_LIST.filter(
    (b) => !claimedBonusIds.includes(b.id)
  ).reduce((sum, b) => sum + b.tp, 0);

  const handleClaim = (bonusId: string) => {
    const result = claimBonus(bonusId);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: currentProfileAppearance.themeAppBgColor }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Header */}
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
          TP KAZAN
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 10,
          }}
        >
          Tek seferlik TP bonusları
        </Text>

        <Text style={{ color: "#ffffff", lineHeight: 22, marginBottom: 14 }}>
          Aşağıdaki aktiviteleri tamamlayarak ek TP kazan. Her bonus yalnızca bir kez toplanabilir.
        </Text>

        {totalClaimable > 0 ? (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
              Toplanabilecek
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {totalClaimable} TP
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "700" }}>
              Tüm bonuslar toplandı
            </Text>
          </View>
        )}
      </View>

      {/* Bonus list */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Ionicons name="gift-outline" size={18} color="#334155" />
        <Text style={{ color: "#334155", fontWeight: "700", fontSize: 16 }}>
          Aktivite Bonusları
        </Text>
      </View>

      {BONUS_LIST.map((bonus) => {
        const claimed = claimedBonusIds.includes(bonus.id);
        return (
          <View
            key={bonus.id}
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: claimed ? "#bbf7d0" : "#e5e7eb",
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: claimed ? "#d1fae5" : "#f0fdfa",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={bonus.icon as any}
                  size={22}
                  color={claimed ? "#16a34a" : "#0f766e"}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 17, fontWeight: "800", color: "#0f172a" }}>
                    {bonus.title}
                  </Text>
                  <View
                    style={{
                      backgroundColor: claimed ? "#d1fae5" : "#ccfbf1",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: claimed ? "#16a34a" : "#0f766e",
                        fontWeight: "800",
                        fontSize: 13,
                      }}
                    >
                      +{bonus.tp} TP
                    </Text>
                  </View>
                </View>
                <Text style={{ color: "#475569", lineHeight: 20 }}>
                  {bonus.description}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (!claimed) handleClaim(bonus.id);
              }}
              style={{
                backgroundColor: claimed ? "#cbd5e1" : currentProfileAppearance.themeColor,
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: claimed ? "#475569" : "#ffffff",
                  fontWeight: "800",
                }}
              >
                {claimed ? "Toplandı" : "Topla"}
              </Text>
            </Pressable>
          </View>
        );
      })}

      {/* Video section */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Ionicons name="play-circle-outline" size={18} color="#334155" />
        <Text style={{ color: "#334155", fontWeight: "700", fontSize: 16 }}>
          Video ile TP kazan
        </Text>
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
        }}
      >
        <Text style={{ color: "#64748b", lineHeight: 22, marginBottom: 14 }}>
          İsteğe bağlı kısa reklamı izleyerek ek TP kazan. Bu özellik henüz prototip aşamasındadır.
        </Text>

        <Pressable
          style={{
            backgroundColor: currentProfileAppearance.themeColor,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>
            Video İzle ve 25 TP Kazan
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
