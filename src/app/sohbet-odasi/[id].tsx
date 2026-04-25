import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import ChatModerationWarning from "../../components/chat/ChatModerationWarning";
import UserQuickBubble from "../../components/chat/UserQuickBubble";
import { GAME_CONFIG } from "../../config/gameConfig";
import { useAppData } from "../../context/AppDataContext";
import { type ChatMessage } from "../../data/mockChat";
import { getUserByName } from "../../data/mockUsers";
import { formatRelativeTime } from "../../utils/relativeTime";
import { useModerationGuard } from "../useModerationGuard";

function getMessageTimestamp(message: ChatMessage, nowTs: number) {
  if (typeof message.createdAt === "number") {
    return message.createdAt;
  }

  const ago = message.agoMinutes ?? 0;
  return nowTs - ago * 60_000;
}

export default function SohbetOdasiPage() {
  const params = useLocalSearchParams<{ id: string; roomName?: string }>();
  const { chatRooms, markRoomRead, sendRoomMessage, lastRoomMessageAt } = useAppData();

  const scrollRef = useRef<ScrollView>(null);

  const room = chatRooms.find((roomItem) => roomItem.id === params.id);
  const [draft, setDraft] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

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

  const { canSendMessage, warningMessage, isRestricted } = useModerationGuard("sohbet_odasi", params.id);

  const cooldownMs = GAME_CONFIG.chat.categoryCooldownSeconds * 1000;
  const lastSent = params.id ? (lastRoomMessageAt[params.id] ?? 0) : 0;
  const cooldownRemaining = Math.max(0, Math.ceil((cooldownMs - (nowTick - lastSent)) / 1000));
  const onCooldown = cooldownRemaining > 0;

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (params.id) {
      markRoomRead(params.id);
    }
  }, [params.id, markRoomRead]);

  const title = room?.name ?? params.roomName ?? "Sohbet Odası";

  const messages = useMemo(() => {
    const raw = room?.messages ?? [];

    return [...raw].sort(
      (a, b) => getMessageTimestamp(a, nowTick) - getMessageTimestamp(b, nowTick)
    );
  }, [room, nowTick]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [messages.length]);

  const sendMessage = () => {
    if (!canSendMessage()) return;
    const text = draft.trim();
    if (!text || !params.id) return;

    const result = sendRoomMessage(params.id, text);
    if (result.ok) setDraft("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ padding: 16, paddingBottom: 12 }}>
        <View
          style={{
            backgroundColor: "#14b8a6",
            borderRadius: 22,
            padding: 16,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            SOHBET ODASI
          </Text>

          <Text
            style={{
              color: "#ffffff",
              fontSize: 22,
              fontWeight: "800",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          <Text style={{ color: "#ffffff", lineHeight: 22 }}>
            Mesajlar aşağıda akarken balon menü sohbetin üstünde açılır.
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 18 }}
      >
        {messages.map((message) => {
          const user = getUserByName(message.user);

          return (
            <View
              key={message.id}
              style={{
                alignItems: message.mine ? "flex-end" : "flex-start",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: message.mine ? "row-reverse" : "row",
                  alignItems: "flex-end",
                  maxWidth: "92%",
                }}
              >
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
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: user?.frameColor ?? "#cbd5e1",
                    alignItems: "center",
                    justifyContent: "center",
                    marginHorizontal: 8,
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
                      {user?.avatar ?? message.user[0]}
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={{
                    backgroundColor: message.mine ? "#14b8a6" : "#ffffff",
                    borderRadius: 18,
                    borderWidth: message.mine ? 0 : 1,
                    borderColor: "#e5e7eb",
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "800",
                      color: message.mine ? "#ffffff" : "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    {message.user}
                  </Text>
                  <Text
                    style={{
                      color: message.mine ? "#ffffff" : "#334155",
                      lineHeight: 21,
                    }}
                  >
                    {message.text}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: message.mine ? "rgba(255,255,255,0.82)" : "#94a3b8",
                    }}
                  >
                    {formatRelativeTime(message, nowTick)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {onCooldown && (
        <View
          style={{
            backgroundColor: "#fef9c3",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: "#fde68a",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="time-outline" size={16} color="#a16207" />
          <Text style={{ color: "#a16207", fontSize: 13, fontWeight: "700" }}>
            Sonraki mesaj: {cooldownRemaining}s
          </Text>
        </View>
      )}

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          backgroundColor: "#ffffff",
          padding: 12,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 10,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={isRestricted ? "Bu odaya erişiminiz engellendi." : "Mesaj yaz..."}
          placeholderTextColor="#94a3b8"
          multiline
          editable={!isRestricted && !onCooldown}
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 110,
            backgroundColor: onCooldown || isRestricted ? "#f1f5f9" : "#f8fafc",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingTop: 12,
            color: "#0f172a",
            textAlignVertical: "top",
            opacity: onCooldown || isRestricted ? 0.6 : 1,
          }}
        />

        <Pressable
          onPress={sendMessage}
          disabled={isRestricted || onCooldown}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: onCooldown || isRestricted ? "#cbd5e1" : "#14b8a6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={18} color="#ffffff" />
        </Pressable>
      </View>

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

      <ChatModerationWarning message={warningMessage} />
    </View>
  );
}