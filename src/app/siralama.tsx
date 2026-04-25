import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import UserQuickBubble from "../components/chat/UserQuickBubble";
import { useAppData } from "../context/AppDataContext";
import { mockLeaderboard } from "../data/mockLeaderboard";
import { getUserByName } from "../data/mockUsers";

type RankingTab = "season" | "general";

export default function SiralamaPage() {
  const [activeTab, setActiveTab] = useState<RankingTab>("season");
  const [bubbleState, setBubbleState] = useState<{
    visible: boolean;
    userId: string | null;
    x: number;
    y: number;
  }>({
    visible: false,
    userId: null,
    x: 0,
    y: 0,
  });

  const { currentProfileAppearance } = useAppData();

  const seasonData = useMemo(() => {
    return [...mockLeaderboard]
      .map((item) => ({
        ...item,
        seasonScore: Math.round(item.tp * 0.34 + item.winRate * 23),
      }))
      .sort((a, b) => b.seasonScore - a.seasonScore)
      .map((item, index) => ({
        ...item,
        seasonRank: index + 1,
      }));
  }, []);

  const shownData = activeTab === "season" ? seasonData : mockLeaderboard;

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <ScrollView
        style={{ flex: 1 }}
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
            SIRALAMA
          </Text>

          <Text
            style={{
              color: "#ffffff",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            En iyi kullanıcılar
          </Text>

          <Text style={{ color: "#ffffff", lineHeight: 22 }}>
            Avatara basınca kullanıcı balonu açılır.
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#ffffff",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 6,
            marginBottom: 14,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("season")}
            style={{
              flex: 1,
              backgroundColor: activeTab === "season" ? currentProfileAppearance.themeColor : "transparent",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: activeTab === "season" ? "#ffffff" : "#334155",
                fontWeight: "800",
              }}
            >
              Sezonluk
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("general")}
            style={{
              flex: 1,
              backgroundColor: activeTab === "general" ? currentProfileAppearance.themeColor : "transparent",
              borderRadius: 14,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: activeTab === "general" ? "#ffffff" : "#334155",
                fontWeight: "800",
              }}
            >
              Genel
            </Text>
          </Pressable>
        </View>

        {shownData.map((item) => {
          const user = getUserByName(item.name);
          const rank = activeTab === "season" ? (item.seasonRank ?? item.rank) : item.rank;
          const subText =
            activeTab === "season"
              ? `${item.seasonScore ?? item.tp} sezon puanı • %${item.winRate} başarı`
              : `%${item.winRate} başarı • ${item.tp} TP`;

          return (
            <View
              key={`${activeTab}-${item.id}`}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  width: 38,
                  color: "#0f172a",
                  fontSize: 18,
                  fontWeight: "800",
                }}
              >
                {rank}
              </Text>

              <Pressable
                onPress={(event) => {
                  if (!user) return;
                  setBubbleState({
                    visible: true,
                    userId: user.id,
                    x: event.nativeEvent.pageX,
                    y: event.nativeEvent.pageY,
                  });
                }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: item.frameColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: "#ffffff",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: "800" }}>
                    {item.avatar}
                  </Text>
                </View>
              </Pressable>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#0f172a",
                    fontSize: 16,
                    fontWeight: "800",
                    marginBottom: 4,
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ color: "#64748b" }}>{subText}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <UserQuickBubble
        visible={bubbleState.visible}
        userId={bubbleState.userId}
        anchorX={bubbleState.x}
        anchorY={bubbleState.y}
        onClose={() =>
          setBubbleState({
            visible: false,
            userId: null,
            x: 0,
            y: 0,
          })
        }
      />
    </View>
  );
}