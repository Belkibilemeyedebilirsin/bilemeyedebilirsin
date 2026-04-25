import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useTeam } from "../../context/TeamContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";
import { getUserById } from "../../data/mockUsers";
import { GAME_CONFIG } from "../../config/gameConfig";

const ROLE_LABEL: Record<string, string> = {
  kurucu: "Kurucu",
  yonetici: "Yönetici",
  uye: "Üye",
};

type ManagementTab = "uyeler" | "basvurular" | "davet" | "davetler";

export default function TakimYonetimPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    teams,
    getMyRole,
    kickMember,
    promoteToManager,
    demoteToMember,
    acceptApplication,
    declineApplication,
    inviteToTeam,
    cancelInvite,
    leaveTeam,
    disbandTeam,
  } = useTeam();
  const { showFeedback } = useUIFeedback();

  const [tab, setTab] = useState<ManagementTab>("uyeler");
  const [inviteTarget, setInviteTarget] = useState("");

  const team = teams.find((t) => t.id === id);
  const myRole = getMyRole(id ?? "");

  if (!team || (myRole !== "kurucu" && myRole !== "yonetici")) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <Text style={{ color: "#64748b" }}>Bu sayfaya erişim yetkin yok.</Text>
      </View>
    );
  }

  const pendingApplications = team.applications.filter((a) => a.status === "bekliyor");
  const activeInvites = team.invites.filter((i) => i.status === "bekliyor");

  const action = (result: { ok: boolean; title: string; message: string; type: "success" | "error" | "info" }) => {
    showFeedback({ type: result.type, title: result.title, message: result.message });
  };

  const handleInvite = () => {
    const userId = inviteTarget.trim().toLowerCase();
    if (!userId) return;
    const result = inviteToTeam(team.id, userId);
    action(result);
    if (result.ok) setInviteTarget("");
  };

  const handleDisband = () => {
    const result = disbandTeam(team.id);
    action(result);
    if (result.ok) router.replace("/takimlar");
  };

  const handleLeave = () => {
    const result = leaveTeam(team.id);
    action(result);
    if (result.ok) router.replace("/takimlar");
  };

  const TABS: { key: ManagementTab; label: string; badge?: number }[] = [
    { key: "uyeler", label: "Üyeler" },
    { key: "basvurular", label: "Başvurular", badge: pendingApplications.length },
    { key: "davet", label: "Davet Gönder" },
    { key: "davetler", label: "Davetler", badge: activeInvites.length },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* ── Başlık ── */}
      <View
        style={{
          backgroundColor: "#f59e0b",
          borderRadius: 24,
          padding: 18,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "rgba(255,255,255,0.78)", fontWeight: "700", marginBottom: 6 }}>
          YÖNETİM PANELİ
        </Text>
        <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "800", marginBottom: 4 }}>
          [{team.tag}] {team.name}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.85)" }}>
          {team.members.length} / {GAME_CONFIG.team.maxMembers} üye · Rolün: {ROLE_LABEL[myRole]}
        </Text>
      </View>

      {/* ── Sekmeler ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 16 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor: tab === t.key ? "#f59e0b" : "#ffffff",
              borderWidth: 1,
              borderColor: tab === t.key ? "#f59e0b" : "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Text
              style={{
                color: tab === t.key ? "#ffffff" : "#334155",
                fontWeight: "700",
                fontSize: 13,
              }}
            >
              {t.label}
            </Text>
            {t.badge !== undefined && t.badge > 0 && (
              <View
                style={{
                  backgroundColor: tab === t.key ? "rgba(255,255,255,0.3)" : "#f59e0b",
                  borderRadius: 10,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                }}
              >
                <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "800" }}>
                  {t.badge}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Üyeler ── */}
      {tab === "uyeler" && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800", marginBottom: 12 }}>
            Üye Yönetimi
          </Text>

          {team.members.map((member) => {
            const user = getUserById(member.userId);
            const name = user?.name ?? member.userId;
            const isSelf = member.userId === "goktug";
            const isFounder = member.role === "kurucu";

            return (
              <View
                key={member.userId}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#f1f5f9",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "#fef3c7",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ color: "#92400e", fontWeight: "800" }}>
                      {(user?.avatar ?? name[0]).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={{ color: "#0f172a", fontWeight: "700", flex: 1 }}>{name}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 13 }}>{ROLE_LABEL[member.role]}</Text>
                </View>

                {!isSelf && !isFounder && (
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {/* Yükselt / Düşür — sadece kurucu */}
                    {myRole === "kurucu" && member.role === "uye" && (
                      <Pressable
                        onPress={() => action(promoteToManager(team.id, member.userId))}
                        style={{
                          backgroundColor: "#eff6ff",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#1d4ed8", fontWeight: "700", fontSize: 12 }}>
                          Yönetici Yap
                        </Text>
                      </Pressable>
                    )}
                    {myRole === "kurucu" && member.role === "yonetici" && (
                      <Pressable
                        onPress={() => action(demoteToMember(team.id, member.userId))}
                        style={{
                          backgroundColor: "#fef9c3",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#ca8a04", fontWeight: "700", fontSize: 12 }}>
                          Üyeye Düşür
                        </Text>
                      </Pressable>
                    )}

                    {/* At */}
                    {!(myRole === "yonetici" && member.role === "yonetici") && (
                      <Pressable
                        onPress={() => action(kickMember(team.id, member.userId))}
                        style={{
                          backgroundColor: "#fee2e2",
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}>
                          Takımdan At
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Başvurular ── */}
      {tab === "basvurular" && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800", marginBottom: 12 }}>
            Gelen Başvurular
          </Text>

          {pendingApplications.length === 0 ? (
            <Text style={{ color: "#64748b" }}>Bekleyen başvuru yok.</Text>
          ) : (
            pendingApplications.map((app) => {
              const user = getUserById(app.fromUserId);
              const name = user?.name ?? app.fromUserId;

              return (
                <View
                  key={app.id}
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 14,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: "800", marginBottom: 4 }}>{name}</Text>
                  <Text style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
                    {app.fromUserId}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => action(acceptApplication(app.id))}
                      style={{
                        flex: 1,
                        backgroundColor: "#6366f1",
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#ffffff", fontWeight: "800" }}>Kabul Et</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => action(declineApplication(app.id))}
                      style={{
                        flex: 1,
                        backgroundColor: "#e2e8f0",
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#334155", fontWeight: "800" }}>Reddet</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ── Davet Gönder ── */}
      {tab === "davet" && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800", marginBottom: 6 }}>
            Kullanıcı Davet Et
          </Text>
          <Text style={{ color: "#64748b", fontSize: 13, marginBottom: 14 }}>
            Kullanıcı ID'sini girerek davet gönder (örn: mert1905, courtvision).
          </Text>

          <TextInput
            value={inviteTarget}
            onChangeText={setInviteTarget}
            placeholder="Kullanıcı ID"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            style={{
              backgroundColor: "#f8fafc",
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#0f172a",
              marginBottom: 12,
            }}
          />

          <Pressable
            onPress={handleInvite}
            style={{
              backgroundColor: "#f59e0b",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>Davet Gönder</Text>
          </Pressable>
        </View>
      )}

      {/* ── Aktif Davetler ── */}
      {tab === "davetler" && (
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#0f172a", fontSize: 17, fontWeight: "800", marginBottom: 12 }}>
            Aktif Davetler
          </Text>

          {activeInvites.length === 0 ? (
            <Text style={{ color: "#64748b" }}>Bekleyen davet yok.</Text>
          ) : (
            activeInvites.map((inv) => {
              const user = getUserById(inv.toUserId);
              const name = user?.name ?? inv.toUserId;

              return (
                <View
                  key={inv.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: "#f1f5f9",
                  }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: "700", flex: 1 }}>{name}</Text>
                  <Pressable
                    onPress={() => action(cancelInvite(inv.id))}
                    style={{
                      backgroundColor: "#fee2e2",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ color: "#b91c1c", fontWeight: "700", fontSize: 12 }}>İptal Et</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ── Tehlikeli Bölge ── */}
      <View
        style={{
          backgroundColor: "#fff1f2",
          borderRadius: 20,
          borderWidth: 1,
          borderColor: "#fecdd3",
          padding: 16,
        }}
      >
        <Text style={{ color: "#be123c", fontSize: 15, fontWeight: "800", marginBottom: 12 }}>
          Tehlikeli Bölge
        </Text>

        {myRole !== "kurucu" && (
          <Pressable
            onPress={handleLeave}
            style={{
              backgroundColor: "#fee2e2",
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "#b91c1c", fontWeight: "800" }}>Takımdan Ayrıl</Text>
          </Pressable>
        )}

        {myRole === "kurucu" && (
          <Pressable
            onPress={handleDisband}
            style={{
              backgroundColor: "#b91c1c",
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>Takımı Dağıt</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
