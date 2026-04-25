import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { useCoupon } from "../context/CouponContext";
import { useEconomy } from "../context/EconomyContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { getUserByName } from "../data/mockUsers";

const ARENA_UNLOCK_COST = GAME_CONFIG.prediction.openAccessCostKp;

export default function ArenaPage() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [unlockedPostIds, setUnlockedPostIds] = useState<string[]>([]);
  const { upsertSelection, openCouponPanel } = useCoupon();
  const { wallet, spendKp } = useEconomy();
  const { showFeedback } = useUIFeedback();
  const { arenaPosts } = useAppData();

  const handleUnlockPost = (postId: string) => {
    if (wallet.kp < ARENA_UNLOCK_COST) {
      showFeedback({
        type: "error",
        title: "Yetersiz KP",
        message: `İçeriği görmek için ${ARENA_UNLOCK_COST} KP gerekiyor. Bakiyen: ${wallet.kp} KP.`,
      });
      return;
    }
    spendKp(ARENA_UNLOCK_COST, "prediction_access", `Arena kupon içeriği: ${ARENA_UNLOCK_COST} KP`);
    setUnlockedPostIds((prev) => [...prev, postId]);
    showFeedback({
      type: "success",
      title: "İçerik Açıldı",
      message: `${ARENA_UNLOCK_COST} KP harcandı, kupon detayları görüntülenebilir.`,
      kpDelta: -ARENA_UNLOCK_COST,
    });
  };

  const playSharedCoupon = (postId: string) => {
    const post = arenaPosts.find((item) => item.id === postId);
    if (!post) return;

    post.selections.forEach((selection) => {
      upsertSelection({
        predictionId: selection.predictionId,
        title: selection.title,
        category: selection.category,
        choice: selection.choice,
        odd: selection.odd,
      });
    });

    openCouponPanel();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: 16,
        }}
      >
        Arena
      </Text>

      {arenaPosts.map((post) => {
        const expanded = expandedId === post.id;
        const profile = getUserByName(post.user);

        return (
          <Pressable
            key={post.id}
            onPress={() =>
              setExpandedId((prev) => (prev === post.id ? null : post.id))
            }
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Pressable
                onPress={() => {
                  if (profile) router.push({
                    pathname: "/kullanici-menu/[id]",
                    params: { id: profile.id },
                  });
                }}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: profile?.frameColor ?? "#dbeafe",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#1d4ed8", fontWeight: "800", fontSize: 16 }}>
                    {post.avatar}
                  </Text>
                </View>
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: "#0f172a",
                    marginBottom: 3,
                  }}
                >
                  {post.user}
                </Text>
                <Text style={{ color: "#64748b" }}>{post.time}</Text>
              </View>

              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color="#64748b"
              />
            </View>

            <Text
              style={{
                color: "#334155",
                lineHeight: 22,
                marginBottom: 14,
              }}
            >
              {post.note}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
                  Tahmin adedi
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>
                  {post.selectionCount}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
                  Kupon tutarı
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>
                  {post.stake.toFixed(2)} TP
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
                  Toplam oran
                </Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>
                  {post.totalOdds.toFixed(2)}
                </Text>
              </View>
            </View>

            {expanded ? (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#e5e7eb",
                  paddingTop: 14,
                }}
              >
                {!unlockedPostIds.includes(post.id) ? (
                  <View
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      padding: 20,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: "#eff6ff",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Ionicons name="lock-closed-outline" size={24} color="#2563eb" />
                    </View>

                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#0f172a",
                        marginBottom: 6,
                        textAlign: "center",
                      }}
                    >
                      Kupon içeriği kilitli
                    </Text>

                    <Text
                      style={{
                        color: "#64748b",
                        textAlign: "center",
                        lineHeight: 20,
                        marginBottom: 16,
                      }}
                    >
                      {post.selectionCount} tahmin seçimini görmek için {ARENA_UNLOCK_COST} KP harca.
                    </Text>

                    <Pressable
                      onPress={() => handleUnlockPost(post.id)}
                      style={{
                        backgroundColor: "#2563eb",
                        borderRadius: 14,
                        paddingVertical: 12,
                        paddingHorizontal: 28,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Ionicons name="lock-open-outline" size={16} color="#ffffff" />
                      <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                        {ARENA_UNLOCK_COST} KP ile Aç
                      </Text>
                    </Pressable>

                    <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 10 }}>
                      Bakiye: {wallet.kp} KP
                    </Text>
                  </View>
                ) : null}

                {unlockedPostIds.includes(post.id) ? (
                  <>
                    {post.selections.map((selection) => (
                      <View
                        key={selection.id}
                        style={{
                          backgroundColor: "#f8fafc",
                          borderRadius: 16,
                          padding: 14,
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#0f172a",
                            marginBottom: 6,
                          }}
                        >
                          {selection.title}
                        </Text>

                        <Text style={{ color: "#64748b", marginBottom: 8 }}>
                          {selection.category}
                        </Text>

                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <View
                            style={{
                              backgroundColor:
                                selection.choice === "EVET" ? "#dcfce7" : "#fee2e2",
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 999,
                            }}
                          >
                            <Text
                              style={{
                                fontWeight: "700",
                                color:
                                  selection.choice === "EVET" ? "#166534" : "#991b1b",
                              }}
                            >
                              {selection.choice}
                            </Text>
                          </View>

                          <Text
                            style={{
                              color: "#0f172a",
                              fontSize: 16,
                              fontWeight: "800",
                            }}
                          >
                            {selection.odd.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View
                      style={{
                        backgroundColor: "#ecfeff",
                        borderRadius: 16,
                        padding: 14,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ color: "#0f766e", marginBottom: 4 }}>
                        Maksimum Kazanç
                      </Text>
                      <Text
                        style={{
                          color: "#0f766e",
                          fontSize: 22,
                          fontWeight: "800",
                        }}
                      >
                        {post.maxWin.toFixed(2)} TP
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => playSharedCoupon(post.id)}
                      style={{
                        backgroundColor: "#14b8a6",
                        borderRadius: 14,
                        paddingVertical: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}>
                        Bas sende rahatla
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}