import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import ChatModerationWarning from "../components/chat/ChatModerationWarning";
import UserQuickBubble from "../components/chat/UserQuickBubble";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { type ChatMessage } from "../data/mockChat";
import { getUserById, getUserByName } from "../data/mockUsers";
import { formatRelativeTime } from "../utils/relativeTime";
import { useModerationGuard } from "./useModerationGuard";

type ChatTab = "genel" | "ozel" | "arkadas";

function getMessageTimestamp(message: ChatMessage, nowTs: number) {
  if (typeof message.createdAt === "number") {
    return message.createdAt;
  }

  const ago = message.agoMinutes ?? 0;
  return nowTs - ago * 60_000;
}

export default function GenelSohbetPage() {
  const params = useLocalSearchParams<{ tab?: string; userId?: string }>();
  const {
    markGeneralChatRead,
    dmThreads,
    sendDirectMessage,
    acceptedFriendIds,
    globalMessages,
    lastGlobalMessageAt,
    sendGlobalMessage,
    sendGlobalAnnouncement,
  } = useAppData();
  const { showFeedback } = useUIFeedback();

  const scrollRef = useRef<ScrollView>(null);

  const [activeTab, setActiveTab] = useState<ChatTab>(
    params.tab === "ozel" ? "ozel" : params.tab === "arkadas" ? "arkadas" : "genel"
  );
  const [selectedDmUserId, setSelectedDmUserId] = useState<string | null>(
    params.userId ?? (dmThreads[0]?.userId ?? null)
  );
  const [draft, setDraft] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  const [announcementModal, setAnnouncementModal] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState("");

  const cooldownMs = GAME_CONFIG.chat.globalCooldownSeconds * 1000;
  const globalCooldownRemaining = Math.max(
    0,
    Math.ceil((cooldownMs - (nowTick - lastGlobalMessageAt)) / 1000)
  );
  const globalOnCooldown = globalCooldownRemaining > 0;

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

  const { canSendMessage, warningMessage, isRestricted } = useModerationGuard("genel_sohbet");

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (params.tab === "ozel") setActiveTab("ozel");
    if (params.tab === "arkadas") setActiveTab("arkadas");
    if (params.userId) setSelectedDmUserId(params.userId);
  }, [params.tab, params.userId]);

  useEffect(() => {
    if (activeTab === "genel") {
      markGeneralChatRead();
    }
  }, [activeTab, markGeneralChatRead]);

  const allDmUserIds = useMemo(() => {
    const ids = dmThreads.map((item) => item.userId);
    if (selectedDmUserId && !ids.includes(selectedDmUserId)) {
      return [selectedDmUserId, ...ids];
    }
    return ids;
  }, [dmThreads, selectedDmUserId]);

  const friendDmUserIds = useMemo(
    () => allDmUserIds.filter((id) => acceptedFriendIds.includes(id)),
    [allDmUserIds, acceptedFriendIds]
  );

  const effectiveSelectedUserId =
    activeTab === "arkadas"
      ? friendDmUserIds.includes(selectedDmUserId ?? "")
        ? selectedDmUserId
        : friendDmUserIds[0] ?? null
      : selectedDmUserId;

  const selectedDmThread = dmThreads.find(
    (item) => item.userId === effectiveSelectedUserId
  );

  const selectedDmMessages = selectedDmThread?.messages ?? [];
  const selectedDmUser = effectiveSelectedUserId
    ? getUserById(effectiveSelectedUserId)
    : undefined;

  const activeMessages = useMemo(() => {
    const base =
      activeTab === "genel"
        ? globalMessages
        : selectedDmMessages;

    return [...base].sort(
      (a, b) => getMessageTimestamp(a, nowTick) - getMessageTimestamp(b, nowTick)
    );
  }, [activeTab, globalMessages, selectedDmMessages, nowTick]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [activeMessages.length, activeTab, effectiveSelectedUserId]);

  const sendMessage = () => {
    if (!canSendMessage()) return;
    const text = draft.trim();
    if (!text) return;

    if (activeTab === "genel") {
      const result = sendGlobalMessage(text);
      if (result.ok) {
        setDraft("");
      } else {
        showFeedback({ type: result.type, title: result.title, message: result.message });
      }
      return;
    }

    if (!effectiveSelectedUserId) return;

    sendDirectMessage(effectiveSelectedUserId, text);
    setDraft("");
  };

  const handleSendAnnouncement = () => {
    if (!canSendMessage()) return;
    const text = announcementDraft.trim();
    if (!text) return;

    const result = sendGlobalAnnouncement(text);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      kpDelta: result.kpDelta,
    });

    if (result.ok) {
      setAnnouncementDraft("");
      setAnnouncementModal(false);
    }
  };

  const renderChips = (ids: string[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10 }}
    >
      {ids.map((userId) => {
        const user = getUserById(userId);
        if (!user) return null;

        const active = userId === effectiveSelectedUserId;

        return (
          <Pressable
            key={userId}
            onPress={() => setSelectedDmUserId(userId)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              height: 34,
              backgroundColor: active ? "#14b8a6" : "#ffffff",
              borderWidth: 1,
              borderColor: active ? "#14b8a6" : "#e5e7eb",
              borderRadius: 999,
              paddingHorizontal: 10,
              marginRight: 8,
            }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: active ? "#ffffff" : user.frameColor,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 6,
              }}
            >
              <Text
                style={{
                  color: active ? "#0f172a" : "#ffffff",
                  fontWeight: "800",
                  fontSize: 10,
                }}
              >
                {user.avatar}
              </Text>
            </View>

            <Text
              style={{
                color: active ? "#ffffff" : "#334155",
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {user.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#f8fafc" }}>
      <View style={{ padding: 16, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#ffffff",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 6,
          }}
        >
          {(["genel", "ozel", "arkadas"] as ChatTab[]).map((tab) => {
            const label =
              tab === "genel" ? "Genel Sohbet" : tab === "ozel" ? "Özel Mesaj" : "Arkadaşlar";
            const active = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  backgroundColor: active ? "#14b8a6" : "transparent",
                  borderRadius: 14,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: active ? "#ffffff" : "#334155",
                    fontWeight: "800",
                    fontSize: 12,
                  }}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {activeTab === "ozel" ? renderChips(allDmUserIds) : null}
      {activeTab === "arkadas" ? renderChips(friendDmUserIds) : null}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 6, paddingBottom: 18 }}
      >
        {activeTab !== "genel" && selectedDmUser ? (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "#0f172a", fontWeight: "800", marginBottom: 2 }}>
              Konuşma: {selectedDmUser.name}
            </Text>
            <Text style={{ color: "#64748b", fontSize: 12 }}>
              {activeTab === "arkadas" ? "Arkadaş sohbeti" : "Özel mesaj"}
            </Text>
          </View>
        ) : null}

        {activeMessages.map((message) => {
          const user = getUserByName(message.user);

          if (message.isAnnouncement) {
            return (
              <View
                key={message.id}
                style={{
                  marginBottom: 12,
                  backgroundColor: "#fffbeb",
                  borderWidth: 1.5,
                  borderColor: "#fbbf24",
                  borderRadius: 16,
                  padding: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }}>
                  <Ionicons name="megaphone" size={15} color="#d97706" />
                  <Text style={{ color: "#d97706", fontWeight: "800", fontSize: 12 }}>
                    DUYURU
                  </Text>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: user?.frameColor ?? "#cbd5e1",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: 4,
                    }}
                  >
                    <Text style={{ fontWeight: "800", color: "#ffffff", fontSize: 10 }}>
                      {user?.avatar ?? message.user[0]}
                    </Text>
                  </View>
                  <Text style={{ color: "#92400e", fontWeight: "700", fontSize: 12 }}>
                    {message.user}
                  </Text>
                </View>
                <Text style={{ color: "#78350f", lineHeight: 21, fontWeight: "600" }}>
                  {message.text}
                </Text>
                <Text style={{ marginTop: 6, fontSize: 11, color: "#a16207" }}>
                  {formatRelativeTime(message, nowTick)}
                </Text>
              </View>
            );
          }

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

      {activeTab === "genel" && globalOnCooldown && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            backgroundColor: "#fffbeb",
            paddingHorizontal: 16,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Ionicons name="time-outline" size={14} color="#a16207" />
          <Text style={{ color: "#a16207", fontSize: 13, fontWeight: "700" }}>
            {globalCooldownRemaining}s sonra mesaj gönderebilirsin
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
        {activeTab === "genel" && (
          <Pressable
            onPress={() => setAnnouncementModal(true)}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "#fef3c7",
              borderWidth: 1.5,
              borderColor: "#fbbf24",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="megaphone" size={20} color="#d97706" />
          </Pressable>
        )}

        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={
            isRestricted
              ? "Sohbet erişiminiz kısıtlandı."
              : activeTab === "genel"
              ? globalOnCooldown
                ? "Bekleme süresi devam ediyor..."
                : "Genel sohbete mesaj yaz..."
              : activeTab === "arkadas"
              ? "Arkadaşına mesaj yaz..."
              : "Özel mesaj yaz..."
          }
          placeholderTextColor="#94a3b8"
          multiline
          editable={(!isRestricted) && (activeTab !== "genel" || !globalOnCooldown)}
          style={{
            flex: 1,
            minHeight: 48,
            maxHeight: 110,
            backgroundColor: (activeTab === "genel" && globalOnCooldown) || isRestricted ? "#f1f5f9" : "#f8fafc",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 18,
            paddingHorizontal: 14,
            paddingTop: 12,
            color: "#0f172a",
            textAlignVertical: "top",
            opacity: (activeTab === "genel" && globalOnCooldown) || isRestricted ? 0.6 : 1,
          }}
        />

        <Pressable
          onPress={sendMessage}
          disabled={isRestricted || (activeTab === "genel" && globalOnCooldown)}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: isRestricted || (activeTab === "genel" && globalOnCooldown) ? "#cbd5e1" : "#14b8a6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={18} color="#ffffff" />
        </Pressable>
      </View>

      <Modal
        visible={announcementModal}
        animationType="fade"
        onRequestClose={() => setAnnouncementModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setAnnouncementModal(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Ionicons name="megaphone" size={20} color="#d97706" />
              <Text style={{ fontWeight: "800", fontSize: 16, color: "#0f172a" }}>
                Duyuru Yap
              </Text>
            </View>
            <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              Duyurun herkese vurgulanmış olarak görünür.{" "}
              <Text style={{ fontWeight: "800", color: "#d97706" }}>
                {GAME_CONFIG.chat.announcementCostKp} KP
              </Text>{" "}
              harcanır.
            </Text>

            <TextInput
              value={announcementDraft}
              onChangeText={setAnnouncementDraft}
              placeholder="Duyuru metnini yaz..."
              placeholderTextColor="#94a3b8"
              multiline
              style={{
                minHeight: 80,
                maxHeight: 140,
                backgroundColor: "#fffbeb",
                borderWidth: 1.5,
                borderColor: "#fbbf24",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingTop: 12,
                color: "#0f172a",
                textAlignVertical: "top",
                marginBottom: 16,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => setAnnouncementModal(false)}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#64748b", fontWeight: "700" }}>İptal</Text>
              </Pressable>

              <Pressable
                onPress={handleSendAnnouncement}
                style={{
                  flex: 2,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: "#d97706",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 6,
                }}
              >
                <Ionicons name="megaphone" size={16} color="#ffffff" />
                <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                  Yayınla ({GAME_CONFIG.chat.announcementCostKp} KP)
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
