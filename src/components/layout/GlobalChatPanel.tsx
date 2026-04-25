import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "../../context/AppDataContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";
import { getUserById } from "../../data/mockUsers";

type ChatTab = "genel" | "ozel" | "arkadas";

export default function GlobalChatPanel() {
  const {
    isGlobalChatPanelOpen,
    closeGlobalChatPanel,
    globalMessages,
    sendGlobalMessage,
    markGeneralChatRead,
    currentProfileAppearance,
    dmThreads,
    acceptedFriendIds,
    sendDirectMessage,
    unreadGeneralCount,
    unreadDmCounts,
    markDmRead,
  } = useAppData();
  const { showFeedback } = useUIFeedback();
  const { getMotionDuration } = useAppSettings();
  const insets = useSafeAreaInsets();

  const [mounted, setMounted] = useState(false);
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<ChatTab>("genel");
  const [selectedDmUserId, setSelectedDmUserId] = useState<string | null>(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateY = useRef(new Animated.Value(800)).current;
  const scrollViewRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (!isGlobalChatPanelOpen) return;
    if (activeTab === "genel") {
      markGeneralChatRead();
    } else if (effectiveSelectedUserId) {
      markDmRead(effectiveSelectedUserId);
    }
  }, [isGlobalChatPanelOpen, activeTab, effectiveSelectedUserId, dmThreads, markGeneralChatRead, markDmRead]);

  useEffect(() => {
    if (isGlobalChatPanelOpen) {
      setMounted(true);
      markGeneralChatRead();
      overlayOpacity.setValue(0);
      panelTranslateY.setValue(800);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: getMotionDuration(220),
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslateY, {
            toValue: 0,
            duration: getMotionDuration(280),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: getMotionDuration(180),
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateY, {
          toValue: 800,
          duration: getMotionDuration(240),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [isGlobalChatPanelOpen, mounted, overlayOpacity, panelTranslateY, getMotionDuration, markGeneralChatRead]);

  if (!mounted && !isGlobalChatPanelOpen) {
    return null;
  }

  const selectedDmThread = dmThreads.find(
    (item) => item.userId === effectiveSelectedUserId
  );
  const activeMessages = activeTab === "genel" ? globalMessages : selectedDmThread?.messages ?? [];

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (activeTab === "genel") {
      const res = sendGlobalMessage(inputText);
      if (res.ok) {
        setInputText("");
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        showFeedback({ type: "error", title: res.title, message: res.message });
      }
    } else {
      if (!effectiveSelectedUserId) return;
      sendDirectMessage(effectiveSelectedUserId, inputText);
      setInputText("");
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const totalUnreadOzel = allDmUserIds.reduce((sum, id) => sum + (unreadDmCounts[id] || 0), 0);
  const totalUnreadArkadas = friendDmUserIds.reduce((sum, id) => sum + (unreadDmCounts[id] || 0), 0);

  return (
    <Modal
      visible={mounted || isGlobalChatPanelOpen}
      transparent
      animationType="none"
      onRequestClose={closeGlobalChatPanel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15,23,42,0.4)",
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeGlobalChatPanel} />
        </Animated.View>

        <Animated.View
          style={{
            height: "85%",
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: Math.max(insets.bottom, 12),
            transform: [{ translateY: panelTranslateY }],
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#e2e8f0",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f172a" }}>
              Sohbet
            </Text>
            <Pressable
              onPress={closeGlobalChatPanel}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#0f172a" />
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingTop: 6, borderBottomWidth: 1, borderBottomColor: "#e2e8f0" }}>
            {(["genel", "ozel", "arkadas"] as ChatTab[]).map(tab => {
              let badgeCount = 0;
              if (tab === "genel") badgeCount = unreadGeneralCount;
              if (tab === "ozel") badgeCount = totalUnreadOzel;
              if (tab === "arkadas") badgeCount = totalUnreadArkadas;

              return (
                <Pressable 
                  key={tab} 
                  onPress={() => setActiveTab(tab)} 
                  style={{ flex: 1, alignItems: "center", paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: activeTab === tab ? currentProfileAppearance.themeColor : "transparent" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontWeight: activeTab === tab ? "800" : "600", color: activeTab === tab ? currentProfileAppearance.themeColor : "#64748b" }}>
                      {tab === "genel" ? "Genel" : tab === "ozel" ? "Özel" : "Arkadaşlar"}
                    </Text>
                    {badgeCount > 0 && (
                      <View style={{ backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 }}>
                        <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>{badgeCount > 99 ? "99+" : badgeCount}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* User Chips (for Ozel and Arkadas tabs) */}
          {activeTab !== "genel" && (
            <View style={{ paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {(activeTab === "ozel" ? allDmUserIds : friendDmUserIds).map(userId => {
                     const user = getUserById(userId);
                     if (!user) return null;
                     const active = userId === effectiveSelectedUserId;
                     const unread = unreadDmCounts[userId] || 0;
                     return (
                       <Pressable 
                          key={userId} 
                          onPress={() => setSelectedDmUserId(userId)} 
                          style={{ flexDirection: "row", alignItems: "center", backgroundColor: active ? currentProfileAppearance.themeColor : "#e2e8f0", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 }}
                       >
                          <Text style={{ color: active ? "#fff" : "#334155", fontWeight: "700", fontSize: 13 }}>{user.name}</Text>
                          {unread > 0 && !active && (
                            <View style={{ backgroundColor: "#ef4444", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, marginLeft: 6 }}>
                              <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>{unread}</Text>
                            </View>
                          )}
                       </Pressable>
                     );
                  })}
                  {(activeTab === "ozel" ? allDmUserIds : friendDmUserIds).length === 0 && (
                    <Text style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic", marginVertical: 4 }}>
                      {activeTab === "arkadas" ? "Arkadaşınız bulunmuyor." : "Henüz bir özel mesajınız yok."}
                    </Text>
                  )}
               </ScrollView>
            </View>
          )}

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {activeMessages.length === 0 && (
              <Text style={{ color: "#94a3b8", textAlign: "center", marginTop: 20 }}>
                Mesaj bulunmuyor. Hadi sohbeti başlat!
              </Text>
            )}
            {activeMessages.map((msg, idx) => {
              const isMe = msg.mine;
              if (msg.isAnnouncement) {
                 return (
                   <View key={msg.id || idx} style={{ alignSelf: "center", backgroundColor: "#fffbeb", borderColor: "#fcd34d", borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, marginBottom: 12, maxWidth: "90%" }}>
                     <Text style={{ color: "#b45309", fontWeight: "800", fontSize: 12, marginBottom: 4, textAlign: "center" }}>Duyuru • {msg.user}</Text>
                     <Text style={{ color: "#92400e", textAlign: "center", fontSize: 14 }}>{msg.text}</Text>
                   </View>
                 );
              }
              return (
                <View key={msg.id || idx} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%", marginBottom: 12 }}>
                  {!isMe && <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748b", marginBottom: 4, marginLeft: 4 }}>{msg.user}</Text>}
                  <View style={{ backgroundColor: isMe ? currentProfileAppearance.themeColor : "#f1f5f9", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4 }}>
                    <Text style={{ color: isMe ? "#ffffff" : "#0f172a", fontSize: 15, lineHeight: 20 }}>{msg.text}</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, alignSelf: isMe ? "flex-end" : "flex-start", marginHorizontal: 4 }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </ScrollView>

          {/* Input Area */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e8f0" }}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={
                activeTab === "genel"
                  ? "Genel sohbete mesaj yaz..."
                  : activeTab === "arkadas"
                  ? "Arkadaşına mesaj yaz..."
                  : "Özel mesaj yaz..."
              }
              placeholderTextColor="#94a3b8"
              style={{ flex: 1, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 24, paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 12 : 10, fontSize: 15, color: "#0f172a", maxHeight: 100 }}
              multiline
            />
            <Pressable
              onPress={handleSend}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: inputText.trim() ? currentProfileAppearance.themeColor : "#e2e8f0", alignItems: "center", justifyContent: "center", marginLeft: 12 }}
            >
              <Ionicons name="send" size={18} color={inputText.trim() ? "#ffffff" : "#94a3b8"} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}