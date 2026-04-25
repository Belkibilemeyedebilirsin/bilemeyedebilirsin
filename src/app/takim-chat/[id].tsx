import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTeam } from "../../context/TeamContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";
import { getUserById } from "../../data/mockUsers";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export default function TakimChatPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { teams, sendTeamMessage, getMyRole } = useTeam();
  const { showFeedback } = useUIFeedback();

  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState("");

  const team = teams.find((t) => t.id === id);
  const myRole = getMyRole(id ?? "");

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [team?.messages.length]);

  if (!team) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ color: "#64748b" }}>Takım bulunamadı.</Text>
      </View>
    );
  }

  if (!myRole) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ color: "#64748b" }}>Bu takıma üye değilsin.</Text>
      </View>
    );
  }

  const handleSend = () => {
    const result = sendTeamMessage(team.id, draft);
    if (!result.ok) {
      showFeedback({ type: result.type, title: result.title, message: result.message });
      return;
    }
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={88}
    >
      {/* ── Header bilgi şeridi ── */}
      <View
        style={{
          backgroundColor: "#6366f1",
          paddingHorizontal: 16,
          paddingVertical: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.25)",
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 12 }}>[{team.tag}]</Text>
        </View>
        <Text style={{ color: "#ffffff", fontWeight: "700", flex: 1 }}>{team.name}</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
          {team.members.length} üye
        </Text>
      </View>

      {/* ── Mesaj akışı ── */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, paddingBottom: 8 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {team.messages.length === 0 && (
          <Text style={{ color: "#94a3b8", textAlign: "center", marginTop: 40 }}>
            Henüz mesaj yok. İlk mesajı siz gönderin!
          </Text>
        )}

        {team.messages.map((msg) => {
          const isMine = msg.userId === "goktug";
          const user = getUserById(msg.userId);
          const avatar = user?.avatar ?? msg.userName[0].toUpperCase();

          return (
            <View
              key={msg.id}
              style={{
                flexDirection: isMine ? "row-reverse" : "row",
                alignItems: "flex-end",
                marginBottom: 10,
                gap: 8,
              }}
            >
              {/* Avatar */}
              {!isMine && (
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#e0e7ff",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#4338ca", fontWeight: "800", fontSize: 13 }}>{avatar}</Text>
                </View>
              )}

              {/* Balon */}
              <View style={{ maxWidth: "75%" }}>
                {!isMine && (
                  <Text style={{ color: "#64748b", fontSize: 11, marginBottom: 2, marginLeft: 4 }}>
                    {msg.userName}
                  </Text>
                )}
                <View
                  style={{
                    backgroundColor: isMine ? "#6366f1" : "#ffffff",
                    borderRadius: 16,
                    borderBottomRightRadius: isMine ? 4 : 16,
                    borderBottomLeftRadius: isMine ? 16 : 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: isMine ? 0 : 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text
                    style={{
                      color: isMine ? "#ffffff" : "#0f172a",
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {msg.text}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#94a3b8",
                    fontSize: 10,
                    marginTop: 2,
                    textAlign: isMine ? "right" : "left",
                    marginHorizontal: 4,
                  }}
                >
                  {formatTime(msg.createdAt)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Giriş alanı ── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: "#ffffff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          gap: 10,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Mesaj yaz..."
          placeholderTextColor="#94a3b8"
          multiline
          style={{
            flex: 1,
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            color: "#0f172a",
            maxHeight: 100,
            fontSize: 14,
          }}
        />

        <Pressable
          onPress={handleSend}
          disabled={draft.trim().length === 0}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: draft.trim().length > 0 ? "#6366f1" : "#e2e8f0",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "800" }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
