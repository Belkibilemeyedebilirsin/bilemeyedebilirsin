import { Modal, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { getUserById } from "../../data/mockUsers";
import { useAppData } from "../../context/AppDataContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";

type Props = {
  visible: boolean;
  userId: string | null;
  anchorX: number;
  anchorY: number;
  onClose: () => void;
};

export default function UserQuickBubble({
  visible,
  userId,
  anchorX,
  anchorY,
  onClose,
}: Props) {
  const router = useRouter();
  const {
    chatRooms,
    acceptedFriendIds,
    friendRequests,
    sendFriendRequest,
  } = useAppData();
  const { showFeedback } = useUIFeedback();

  if (!visible || !userId) return null;

  const user = getUserById(userId);
  if (!user) return null;

  const ownedRoom = chatRooms.find((room) => room.ownerUserId === user.id);
  const isFriend = acceptedFriendIds.includes(user.id);
  const hasPending = friendRequests.some((item) => item.userId === user.id);

  const left = Math.max(12, Math.min(anchorX - 30, 320));
  const top = Math.max(100, anchorY - 8);

  const handleFriendAdd = () => {
    const result = sendFriendRequest(user.id);

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });

    if (result.ok) onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        <View
          style={{
            position: "absolute",
            top,
            left,
            width: 270,
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: "#ffffff",
              transform: [{ rotate: "45deg" }],
              marginLeft: 22,
              marginBottom: -9,
              zIndex: 2,
            }}
          />

          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 16,
              shadowColor: "#0f172a",
              shadowOpacity: 0.16,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <Text
              style={{
                color: "#0f172a",
                fontSize: 17,
                fontWeight: "800",
                marginBottom: 4,
              }}
            >
              {user.name}
            </Text>

            <Text
              style={{
                color: "#64748b",
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {user.title}
            </Text>

            <Pressable
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/kullanici/[id]",
                  params: { id: user.id },
                });
              }}
              style={{
                backgroundColor: "#14b8a6",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                Profile Bak
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!ownedRoom) return;
                onClose();
                router.push({
                  pathname: "/sohbet-odasi/[id]",
                  params: { id: ownedRoom.id, roomName: ownedRoom.name },
                });
              }}
              style={{
                backgroundColor: ownedRoom ? "#0ea5a4" : "#cbd5e1",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: ownedRoom ? "#ffffff" : "#475569",
                  fontWeight: "800",
                }}
              >
                {ownedRoom ? "Odaya Davet Et" : "Kendi Odası Yok"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                onClose();
                router.push({
                  pathname: "/genel-sohbet",
                  params: { tab: "ozel", userId: user.id },
                });
              }}
              style={{
                backgroundColor: "#1d4ed8",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                Özel Mesaj
              </Text>
            </Pressable>

            <Pressable
              onPress={handleFriendAdd}
              style={{
                backgroundColor: isFriend || hasPending ? "#cbd5e1" : "#f8fafc",
                borderRadius: 14,
                paddingVertical: 12,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: isFriend || hasPending ? "#475569" : "#0f172a",
                  fontWeight: "800",
                }}
              >
                {isFriend ? "Arkadaşsınız" : hasPending ? "İstek Gönderildi" : "Arkadaş Ekle"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}