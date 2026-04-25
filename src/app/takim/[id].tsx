import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useTeam } from "../../context/TeamContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";
import { getUserById } from "../../data/mockUsers";
import { GAME_CONFIG } from "../../config/gameConfig";

const ROLE_LABEL: Record<string, string> = {
  kurucu: "Kurucu",
  yonetici: "Yönetici",
  uye: "Üye",
};

const ROLE_COLOR: Record<string, string> = {
  kurucu: "#7c3aed",
  yonetici: "#0369a1",
  uye: "#166534",
};

const ROLE_BG: Record<string, string> = {
  kurucu: "#ede9fe",
  yonetici: "#e0f2fe",
  uye: "#dcfce7",
};

export default function TakimProfilPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { teams, myTeamId, applyToTeam, cancelApplication, hasApplied, getMyRole } = useTeam();
  const { showFeedback } = useUIFeedback();

  const team = teams.find((t) => t.id === id);

  if (!team) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ color: "#64748b" }}>Takım bulunamadı.</Text>
      </View>
    );
  }

  const isMember = team.members.some((m) => m.userId === "goktug");
  const myRole = getMyRole(team.id);
  const applied = hasApplied(team.id);
  const isFull = team.members.length >= GAME_CONFIG.team.maxMembers;

  const handleApply = () => {
    const result = applyToTeam(team.id);
    showFeedback({ type: result.type, title: result.title, message: result.message });
  };

  const handleCancelApplication = () => {
    const result = cancelApplication(team.id);
    showFeedback({ type: result.type, title: result.title, message: result.message });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* ── Takım Kartı ── */}
      <View
        style={{
          backgroundColor: "#6366f1",
          borderRadius: 24,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 4,
              marginRight: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 14 }}>
              [{team.tag}]
            </Text>
          </View>
          {isMember && (
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>
                {ROLE_LABEL[myRole ?? "uye"]}
              </Text>
            </View>
          )}
        </View>

        <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "800", marginBottom: 8 }}>
          {team.name}
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.85)", lineHeight: 20, marginBottom: 12 }}>
          {team.desc}
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
          {team.members.length} / {GAME_CONFIG.team.maxMembers} üye
        </Text>
      </View>

      {/* ── Eylem Butonları ── */}
      {isMember ? (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <Pressable
            onPress={() => router.push({ pathname: "/takim-chat/[id]", params: { id: team.id } })}
            style={{
              flex: 1,
              backgroundColor: "#6366f1",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>Sohbet</Text>
          </Pressable>

          {(myRole === "kurucu" || myRole === "yonetici") && (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/takim-yonetim/[id]", params: { id: team.id } })
              }
              style={{
                flex: 1,
                backgroundColor: "#fef3c7",
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#92400e", fontWeight: "800" }}>Yönet</Text>
            </Pressable>
          )}
        </View>
      ) : myTeamId === null ? (
        applied ? (
          <Pressable
            onPress={handleCancelApplication}
            style={{
              backgroundColor: "#e2e8f0",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#334155", fontWeight: "800" }}>Başvuruyu İptal Et</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleApply}
            disabled={isFull}
            style={{
              backgroundColor: isFull ? "#e2e8f0" : "#6366f1",
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ color: isFull ? "#94a3b8" : "#ffffff", fontWeight: "800" }}>
              {isFull ? "Takım Dolu" : "Başvur"}
            </Text>
          </Pressable>
        )
      ) : (
        <View
          style={{
            backgroundColor: "#f1f5f9",
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#64748b", fontWeight: "700" }}>
            Başka bir takıma üyesin
          </Text>
        </View>
      )}

      {/* ── Üye Listesi ── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 18, fontWeight: "800", marginBottom: 14 }}>
          Üyeler
        </Text>

        {team.members.map((member) => {
          const user = getUserById(member.userId);
          const name = user?.name ?? member.userId;
          const avatar = user?.avatar ?? name[0].toUpperCase();

          return (
            <View
              key={member.userId}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#f1f5f9",
              }}
            >
              {/* Avatar */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#e0e7ff",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ color: "#4338ca", fontWeight: "800" }}>{avatar}</Text>
              </View>

              {/* İsim */}
              <Text style={{ color: "#0f172a", fontWeight: "700", flex: 1 }}>{name}</Text>

              {/* Rol etiketi */}
              <View
                style={{
                  backgroundColor: ROLE_BG[member.role],
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: ROLE_COLOR[member.role],
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  {ROLE_LABEL[member.role]}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
