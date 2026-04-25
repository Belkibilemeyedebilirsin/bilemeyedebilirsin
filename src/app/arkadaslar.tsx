import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAppData } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { getUserById } from "../data/mockUsers";

export default function ArkadaslarPage() {
  const router = useRouter();
  const {
    ownInternalId,
    acceptedFriendIds,
    friendRequests,
    sendFriendRequestByInternalId,
    acceptFriendRequest,
    declineFriendRequest,
    currentProfileAppearance,
  } = useAppData();
  const { showFeedback } = useUIFeedback();

  const [targetId, setTargetId] = useState("");

  const handleSend = async () => {
    const result = await sendFriendRequestByInternalId(targetId.trim());

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });

    if (result.ok) setTargetId("");
  };

  const incoming = friendRequests.filter((item) => item.direction === "incoming");
  const outgoing = friendRequests.filter((item) => item.direction === "outgoing");

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
          ARKADAŞLAR
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Arkadaş listesi ve istekler
        </Text>

        <Text style={{ color: "#ffffff", lineHeight: 22, marginBottom: 10 }}>
          Kendi ID’n: {ownInternalId}
        </Text>
      </View>

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
            marginBottom: 12,
          }}
        >
          ID ile arkadaş ekle
        </Text>

        <TextInput
          value={targetId}
          onChangeText={setTargetId}
          placeholder="Arkadaş ID"
          placeholderTextColor="#94a3b8"
          style={{
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 13,
            color: "#0f172a",
            marginBottom: 12,
          }}
        />

        <Pressable
          onPress={handleSend}
          style={{
            backgroundColor: currentProfileAppearance.themeColor,
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800" }}>
            İstek Gönder
          </Text>
        </Pressable>
      </View>

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
            marginBottom: 12,
          }}
        >
          Gelen İstekler
        </Text>

        {incoming.length === 0 ? (
          <Text style={{ color: "#64748b" }}>Gelen istek yok.</Text>
        ) : (
          incoming.map((request) => {
            const user = getUserById(request.userId);
            if (!user) return null;

            return (
              <View
                key={request.userId}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#0f172a",
                    fontWeight: "800",
                    marginBottom: 10,
                  }}
                >
                  {user.name}
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => acceptFriendRequest(user.id)}
                    style={{
                      flex: 1,
                      backgroundColor: currentProfileAppearance.themeColor,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                      Kabul Et
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => declineFriendRequest(user.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#334155", fontWeight: "800" }}>
                      Reddet
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>

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
            marginBottom: 12,
          }}
        >
          Gönderilen İstekler
        </Text>

        {outgoing.length === 0 ? (
          <Text style={{ color: "#64748b" }}>Gönderilen istek yok.</Text>
        ) : (
          outgoing.map((request) => {
            const user = getUserById(request.userId);
            if (!user) return null;

            return (
              <View
                key={request.userId}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>
                  {user.name}
                </Text>
                <Text style={{ color: "#64748b", marginTop: 4 }}>
                  İstek gönderildi
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          Arkadaş Listesi
        </Text>

        {acceptedFriendIds.length === 0 ? (
          <Text style={{ color: "#64748b" }}>Henüz arkadaş eklenmedi.</Text>
        ) : (
          acceptedFriendIds.map((friendId) => {
            const user = getUserById(friendId);
            if (!user) return null;

            return (
              <View
                key={friendId}
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 16,
                  padding: 14,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: "#0f172a",
                    fontWeight: "800",
                    marginBottom: 10,
                  }}
                >
                  {user.name}
                </Text>

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/genel-sohbet",
                        params: { tab: "arkadas", userId: user.id },
                      })
                    }
                    style={{
                      flex: 1,
                      backgroundColor: currentProfileAppearance.themeColor,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                      Mesaj Aç
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/kullanici/[id]",
                        params: { id: user.id },
                      })
                    }
                    style={{
                      flex: 1,
                      backgroundColor: "#eff6ff",
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#1d4ed8", fontWeight: "800" }}>
                      Profile Git
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}