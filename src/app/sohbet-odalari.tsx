import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppData } from "../context/AppDataContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { chatVibeOptions } from "../data/mockChat";

export default function SohbetOdalarPage() {
  const router = useRouter();
  const { chatRooms, roomUnreadCounts, markRoomRead, createChatRoom, currentProfileAppearance } =
    useAppData();
  const { notificationsEnabled } = useAppSettings();
  const { showFeedback } = useUIFeedback();

  const [createOpen, setCreateOpen] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [selectedVibe, setSelectedVibe] = useState<string>("Temkinli");

  const rooms = useMemo(() => chatRooms, [chatRooms]);

  const handleCreateRoom = () => {
    const result = createChatRoom({
      name: roomName,
      desc: roomDesc,
      vibe: selectedVibe,
    });

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });

    if (result.ok) {
      setRoomName("");
      setRoomDesc("");
      setSelectedVibe("Temkinli");
      setCreateOpen(false);
    }
  };

  return (
    <>
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
            SOHBET ODALARI
          </Text>

          <Text
            style={{
              color: "#ffffff",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 10,
            }}
          >
            Toplulukla aynı odada ol
          </Text>

          <Text style={{ color: "#ffffff", lineHeight: 22, marginBottom: 14 }}>
            Oda oluşturmak 100 KP tutar. Farklı tahmin tarzlarına göre odalara gir, fikir paylaş, akışı takip et.
          </Text>

          <Pressable
            onPress={() => setCreateOpen(true)}
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#ffffff",
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#0f766e", fontWeight: "800" }}>
              100 KP ile Oda Oluştur
            </Text>
          </Pressable>
        </View>

        {rooms.map((room) => {
          const unread = roomUnreadCounts[room.id] ?? 0;

          return (
            <View
              key={room.id}
              style={{
                backgroundColor: "white",
                borderRadius: 22,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "800",
                      color: "#0f172a",
                      marginBottom: 6,
                    }}
                  >
                    {room.name}
                  </Text>

                  <Text style={{ color: "#475569", lineHeight: 22 }}>
                    {room.desc}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <View
                    style={{
                      backgroundColor: "#ecfeff",
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: 14,
                      marginBottom: notificationsEnabled && unread > 0 ? 8 : 0,
                    }}
                  >
                    <Text style={{ color: "#0f766e", fontWeight: "800" }}>
                      {room.online} online
                    </Text>
                  </View>

                  {notificationsEnabled && unread > 0 ? (
                    <View
                      style={{
                        backgroundColor: "#ef4444",
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 12 }}>
                        {unread} yeni
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Ionicons name="sparkles-outline" size={16} color="#64748b" />
                  <Text style={{ color: "#64748b", fontWeight: "700" }}>
                    {room.vibe}
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    markRoomRead(room.id);
                    router.push({
                      pathname: "/sohbet-odasi/[id]",
                      params: { id: room.id, roomName: room.name },
                    });
                  }}
                  style={{
                    backgroundColor: currentProfileAppearance.themeColor,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                    Odaya Gir
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.35)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 18,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 14,
              }}
            >
              Sohbet Odası Oluştur
            </Text>

            <TextInput
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Oda adı"
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

            <TextInput
              value={roomDesc}
              onChangeText={setRoomDesc}
              placeholder="Oda açıklaması"
              placeholderTextColor="#94a3b8"
              multiline
              style={{
                minHeight: 90,
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingTop: 12,
                color: "#0f172a",
                textAlignVertical: "top",
                marginBottom: 12,
              }}
            />

            <Text
              style={{
                color: "#334155",
                fontWeight: "800",
                marginBottom: 10,
              }}
            >
              Oda havası
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 16,
              }}
            >
              {chatVibeOptions.map((item) => {
                const active = item === selectedVibe;

                return (
                  <Pressable
                    key={item}
                    onPress={() => setSelectedVibe(item)}
                    style={{
                      backgroundColor: active ? currentProfileAppearance.themeColor : "#f8fafc",
                      borderWidth: 1,
                      borderColor: active ? currentProfileAppearance.themeColor : "#e5e7eb",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? "#ffffff" : "#334155",
                        fontWeight: "800",
                        fontSize: 12,
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setCreateOpen(false);
                  setRoomName("");
                  setRoomDesc("");
                  setSelectedVibe("Temkinli");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "800" }}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={handleCreateRoom}
                style={{
                  flex: 1,
                  backgroundColor: "#14b8a6",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                  100 KP ile Oluştur
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}