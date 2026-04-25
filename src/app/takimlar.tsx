import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { useTeam } from "../context/TeamContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { getUserById } from "../data/mockUsers";

const ROLE_LABEL: Record<string, string> = {
  kurucu: "Kurucu",
  yonetici: "Yönetici",
  uye: "Üye",
};

export default function TakimlarPage() {
  const router = useRouter();
  const {
    teams,
    myTeamId,
    pendingInvites,
    createTeam,
    acceptInvite,
    declineInvite,
  } = useTeam();
  const { currentUser } = useAuth();
  const { showFeedback } = useUIFeedback();
  const { currentProfileAppearance } = useAppData();

  const [tab, setTab] = useState<"listele" | "kur">("listele");
  const [search, setSearch] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTag, setFormTag] = useState("");

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    const result = createTeam({ name: formName, desc: formDesc, tag: formTag });
    showFeedback({ type: result.type, title: result.title, message: result.message });
    if (result.ok) {
      setFormName("");
      setFormDesc("");
      setFormTag("");
      setTab("listele");
    }
  };

  const handleAccept = (inviteId: string) => {
    const result = acceptInvite(inviteId);
    showFeedback({ type: result.type, title: result.title, message: result.message });
  };

  const handleDecline = (inviteId: string) => {
    const result = declineInvite(inviteId);
    showFeedback({ type: result.type, title: result.title, message: result.message });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* ── Hero ── */}
      <View
        style={{
          backgroundColor: currentProfileAppearance.themeColor,
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "700", marginBottom: 8 }}>
          TAKIMLAR
        </Text>
        <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "800", marginBottom: 6 }}>
          Birlikte oyna, birlikte kazan
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)", lineHeight: 20 }}>
          Takım kur ya da mevcut takımlara başvur. Maksimum {GAME_CONFIG.team.maxMembers} üye.
        </Text>
      </View>

      {/* ── Bekleyen Davetler ── */}
      {pendingInvites.length > 0 && (
        <View
          style={{
            backgroundColor: "#fef3c7",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#fde68a",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#92400e", fontSize: 16, fontWeight: "800", marginBottom: 10 }}>
            Bekleyen Davetler ({pendingInvites.length})
          </Text>
          {pendingInvites.map((inv) => {
            const team = teams.find((t) => t.id === inv.teamId);
            const sender = getUserById(inv.fromUserId);
            if (!team) return null;
            return (
              <View
                key={inv.id}
                style={{
                  backgroundColor: "#fffbeb",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#0f172a", fontWeight: "800", marginBottom: 2 }}>
                  [{team.tag}] {team.name}
                </Text>
                <Text style={{ color: "#78716c", fontSize: 13, marginBottom: 10 }}>
                  {sender ? sender.name : inv.fromUserId} seni davet etti
                </Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={() => handleAccept(inv.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#6366f1",
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>Kabul Et</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDecline(inv.id)}
                    style={{
                      flex: 1,
                      backgroundColor: "#e2e8f0",
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#334155", fontWeight: "800" }}>Reddet</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Sekmeler ── */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#e0e7ff",
          borderRadius: 16,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {(["listele", "kur"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: tab === t ? currentProfileAppearance.themeColor : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: tab === t ? "#ffffff" : "#4338ca",
                fontWeight: "800",
                fontSize: 14,
              }}
            >
              {t === "listele" ? "Takım Listesi" : "Takım Kur"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Takım Listesi ── */}
      {tab === "listele" && (
        <>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Takım adı veya etiket ara..."
            placeholderTextColor="#94a3b8"
            style={{
              backgroundColor: "#ffffff",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 13,
              color: "#0f172a",
              marginBottom: 14,
            }}
          />

          {filteredTeams.length === 0 && (
            <Text style={{ color: "#64748b", textAlign: "center", marginTop: 24 }}>
              Takım bulunamadı.
            </Text>
          )}

          {filteredTeams.map((team) => {
            const isMember = team.members.some((m) => m.userId === (currentUser?.id ?? "user1"));
            const myRole = team.members.find((m) => m.userId === (currentUser?.id ?? "user1"))?.role;

            return (
              <View
                key={team.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                {/* Başlık */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <View
                    style={{
                      backgroundColor: "#e0e7ff",
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: "#4338ca", fontWeight: "800", fontSize: 12 }}>
                      {team.tag}
                    </Text>
                  </View>
                  <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 16, flex: 1 }}>
                    {team.name}
                  </Text>
                  {isMember && (
                    <View
                      style={{
                        backgroundColor: "#dcfce7",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                      }}
                    >
                      <Text style={{ color: "#166534", fontWeight: "700", fontSize: 11 }}>
                        {ROLE_LABEL[myRole ?? "uye"]}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 10, lineHeight: 18 }}>
                  {team.desc}
                </Text>

                <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
                  {team.members.length} / {GAME_CONFIG.team.maxMembers} üye
                </Text>

                {/* Butonlar */}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: "/takim/[id]", params: { id: team.id } })
                    }
                    style={{
                      flex: 1,
                      backgroundColor: currentProfileAppearance.themeColor,
                      borderRadius: 12,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>Profil</Text>
                  </Pressable>

                  {isMember && (
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: "/takim-chat/[id]", params: { id: team.id } })
                      }
                      style={{
                        flex: 1,
                        backgroundColor: "#eff6ff",
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#1d4ed8", fontWeight: "800" }}>Sohbet</Text>
                    </Pressable>
                  )}

                  {isMember &&
                    (myRole === "kurucu" || myRole === "yonetici") && (
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/takim-yonetim/[id]",
                            params: { id: team.id },
                          })
                        }
                        style={{
                          flex: 1,
                          backgroundColor: "#fef3c7",
                          borderRadius: 12,
                          paddingVertical: 12,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#92400e", fontWeight: "800" }}>Yönet</Text>
                      </Pressable>
                    )}
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* ── Takım Kur Formu ── */}
      {tab === "kur" && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 18,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 16 }}>
            Yeni Takım
          </Text>

          <Text style={{ color: "#475569", fontWeight: "700", marginBottom: 6 }}>Takım Adı</Text>
          <TextInput
            value={formName}
            onChangeText={setFormName}
            placeholder="Örn: Alpha Analistler"
            placeholderTextColor="#94a3b8"
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#0f172a",
              marginBottom: 14,
            }}
          />

          <Text style={{ color: "#475569", fontWeight: "700", marginBottom: 6 }}>
            Etiket (2-5 karakter)
          </Text>
          <TextInput
            value={formTag}
            onChangeText={(v) => setFormTag(v.toUpperCase())}
            placeholder="ALPH"
            placeholderTextColor="#94a3b8"
            maxLength={5}
            autoCapitalize="characters"
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#0f172a",
              marginBottom: 14,
            }}
          />

          <Text style={{ color: "#475569", fontWeight: "700", marginBottom: 6 }}>Açıklama</Text>
          <TextInput
            value={formDesc}
            onChangeText={setFormDesc}
            placeholder="Takımınızı kısaca tanıtın..."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#0f172a",
              marginBottom: 20,
              minHeight: 80,
              textAlignVertical: "top",
            }}
          />

          <Pressable
            onPress={handleCreate}
            style={{
              backgroundColor: "#6366f1",
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}>
              Takımı Kur
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
