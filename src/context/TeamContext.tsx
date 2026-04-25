import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { supabase } from "../lib/supabase";
import type {
  Team,
  TeamApplication,
  TeamChatMessage,
  TeamInvite,
  TeamMember,
  TeamRole,
} from "../types/team";
import { useAuth } from "./AuthContext";

type ActionResult = {
  ok: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info";
};

type TeamContextType = {
  teams: Team[];
  myTeamId: string | null;
  pendingInvites: TeamInvite[];

  // Takım kurucu işlemleri
  createTeam: (args: { name: string; desc: string; tag: string }) => ActionResult;
  disbandTeam: (teamId: string) => ActionResult;

  // Davet işlemleri (yönetici/kurucu → kullanıcı)
  inviteToTeam: (teamId: string, userId: string) => ActionResult;
  cancelInvite: (inviteId: string) => ActionResult;

  // Başvuru işlemleri (kullanıcı → takım)
  applyToTeam: (teamId: string) => ActionResult;
  cancelApplication: (teamId: string) => ActionResult;

  // Davet yanıtları (kullanıcı)
  acceptInvite: (inviteId: string) => ActionResult;
  declineInvite: (inviteId: string) => ActionResult;

  // Başvuru kararları (yönetici/kurucu)
  acceptApplication: (appId: string) => ActionResult;
  declineApplication: (appId: string) => ActionResult;

  // Üye yönetimi
  kickMember: (teamId: string, userId: string) => ActionResult;
  leaveTeam: (teamId: string) => ActionResult;
  promoteToManager: (teamId: string, userId: string) => ActionResult;
  demoteToMember: (teamId: string, userId: string) => ActionResult;

  // Takım sohbeti
  sendTeamMessage: (teamId: string, text: string) => ActionResult;

  // Yardımcı
  getMyRole: (teamId: string) => TeamRole | null;
  hasApplied: (teamId: string) => boolean;
};

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.id ?? "user1";
  const currentUserName = currentUser?.displayName || currentUser?.username || "Oyuncu";

  const [teams, setTeams] = useState<Team[]>([]);

  // ── Veritabanından Takımları Çekme (Real-time) ─────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadTeams = async (retryCount = 0) => {
      const [tRes, mRes, cRes, rRes] = await Promise.all([
        (supabase as any).from("teams").select("*"),
        (supabase as any).from("team_members").select("*"),
        (supabase as any).from("team_chat_messages").select("*").order("created_at", { ascending: true }),
        (supabase as any).from("team_requests").select("*")
      ]);

      const hasLockError = [tRes, mRes, cRes, rRes].some(res => res.error && String(res.error.message).includes('Lock broken'));
      
      if (hasLockError && retryCount < 3) {
        setTimeout(() => loadTeams(retryCount + 1), 300);
        return;
      }

      if (tRes.data) {
        const builtTeams: Team[] = tRes.data.map((tRow: any) => {
          const members = mRes.data?.filter((m: any) => m.team_id === tRow.id).map((m: any) => ({
            userId: m.user_id,
            role: m.role === 'owner' ? 'kurucu' : m.role === 'admin' ? 'yonetici' : 'uye',
            joinedAt: new Date(m.joined_at).getTime()
          })) || [];

          const messages = cRes.data?.filter((c: any) => c.team_id === tRow.id).map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            userName: c.user_name,
            text: c.text,
            createdAt: new Date(c.created_at).getTime()
          })) || [];

          const invites = rRes.data?.filter((r: any) => r.team_id === tRow.id && r.type === 'invite').map((r: any) => ({
            id: r.id, teamId: r.team_id, fromUserId: tRow.owner_id, toUserId: r.user_id,
            status: r.status === 'pending' ? 'bekliyor' : r.status === 'accepted' ? 'kabul' : 'red',
            createdAt: new Date(r.created_at).getTime()
          })) || [];

          const applications = rRes.data?.filter((r: any) => r.team_id === tRow.id && r.type === 'application').map((r: any) => ({
            id: r.id, teamId: r.team_id, fromUserId: r.user_id,
            status: r.status === 'pending' ? 'bekliyor' : r.status === 'accepted' ? 'kabul' : 'red',
            createdAt: new Date(r.created_at).getTime()
          })) || [];

          return {
            id: tRow.id, name: tRow.name, desc: tRow.description, tag: tRow.logo_url || "TKM",
            members, messages, invites, applications, createdAt: new Date(tRow.created_at).getTime()
          };
        });
        setTeams(builtTeams);
      }
    };

    loadTeams();

    const channel = supabase.channel('public:teams_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => { loadTeams(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => { loadTeams(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_requests' }, () => { loadTeams(); })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_chat_messages' }, (payload: any) => {
        const c = payload.new;
        setTeams((prev) => prev.map((t) => {
          if (t.id === c.team_id) {
            // Optimistic UI olarak ben eklediysem çift eklemeyi engelle
            if (t.messages.some(m => m.text === c.text && m.userId === c.user_id && Date.now() - m.createdAt < 10000)) {
              return t;
            }
            const newMsg = { id: c.id, userId: c.user_id, userName: c.user_name, text: c.text, createdAt: new Date(c.created_at).getTime() };
            return { ...t, messages: [...t.messages, newMsg] };
          }
          return t;
        }));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  // ── Hesaplanan değerler ────────────────────────────────────────────────────

  const myTeamId = useMemo(() => {
    const found = teams.find((t) =>
      t.members.some((m) => m.userId === currentUserId)
    );
    return found?.id ?? null;
  }, [teams, currentUserId]);

  const pendingInvites = useMemo(() => {
    const invites: TeamInvite[] = [];
    for (const team of teams) {
      for (const inv of team.invites) {
        if (inv.toUserId === currentUserId && inv.status === "bekliyor") {
          invites.push(inv);
        }
      }
    }
    return invites;
  }, [teams, currentUserId]);

  // ── Yardımcı ──────────────────────────────────────────────────────────────

  const getMyRole = (teamId: string): TeamRole | null => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return null;
    return team.members.find((m) => m.userId === currentUserId)?.role ?? null;
  };

  const hasApplied = (teamId: string): boolean => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return false;
    return team.applications.some(
      (a) => a.fromUserId === currentUserId && a.status === "bekliyor"
    );
  };

  // ── Takım oluşturma ───────────────────────────────────────────────────────

  const createTeam = ({ name, desc, tag }: { name: string; desc: string; tag: string }): ActionResult => {
    const trimName = name.trim();
    const trimDesc = desc.trim();
    const trimTag = tag.trim().toUpperCase();

    if (!trimName || !trimDesc || !trimTag) {
      return { ok: false, title: "Takım Kur", message: "Ad, açıklama ve etiket zorunlu.", type: "error" };
    }
    if (trimTag.length < 2 || trimTag.length > 5) {
      return { ok: false, title: "Takım Kur", message: "Etiket 2-5 karakter olmalı.", type: "error" };
    }
    if (myTeamId !== null) {
      return { ok: false, title: "Takım Kur", message: "Zaten bir takımdayken yeni takım kuramazsın.", type: "error" };
    }
    if (teams.some((t) => t.tag === trimTag)) {
      return { ok: false, title: "Takım Kur", message: "Bu etiket zaten kullanılıyor.", type: "error" };
    }

    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: trimName,
      desc: trimDesc,
      tag: trimTag,
      members: [{ userId: currentUserId, role: "kurucu", joinedAt: Date.now() }],
      invites: [],
      applications: [],
      messages: [],
      createdAt: Date.now(),
    };

    setTeams((prev) => [newTeam, ...prev]);

    if (currentUser) {
      (supabase as any).from('teams').insert({
        name: trimName, description: trimDesc, logo_url: trimTag, owner_id: currentUserId, is_private: false
      }).select().single().then(({ data, error }: any) => {
        if (error) console.error("TAKIM KURMA HATASI:", error);
        if (data) {
          (supabase as any).from('team_members').insert({
            team_id: data.id, user_id: currentUserId, role: 'owner'
          }).then();
        }
      });
    }
    return { ok: true, title: "Takım Kuruldu", message: `${trimName} başarıyla oluşturuldu.`, type: "success" };
  };

  // ── Takım dağıtma ─────────────────────────────────────────────────────────

  const disbandTeam = (teamId: string): ActionResult => {
    const role = getMyRole(teamId);
    if (role !== "kurucu") {
      return { ok: false, title: "Takım", message: "Sadece kurucu takımı dağıtabilir.", type: "error" };
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));

    if (currentUser) {
      (supabase as any).from('teams').delete().eq('id', teamId).then();
    }
    return { ok: true, title: "Takım Dağıtıldı", message: "Takım silindi.", type: "success" };
  };

  // ── Davet gönderme ────────────────────────────────────────────────────────

  const inviteToTeam = (teamId: string, userId: string): ActionResult => {
    const role = getMyRole(teamId);
    if (role !== "kurucu" && role !== "yonetici") {
      return { ok: false, title: "Davet", message: "Davet için yönetici yetkisi gerekli.", type: "error" };
    }

    const team = teams.find((t) => t.id === teamId)!;

    if (team.members.length >= GAME_CONFIG.team.maxMembers) {
      return { ok: false, title: "Davet", message: `Takım dolu (max ${GAME_CONFIG.team.maxMembers} üye).`, type: "error" };
    }
    if (team.members.some((m) => m.userId === userId)) {
      return { ok: false, title: "Davet", message: "Bu kullanıcı zaten takımda.", type: "info" };
    }
    if (team.invites.filter((i) => i.status === "bekliyor").length >= GAME_CONFIG.team.maxActiveInvites) {
      return { ok: false, title: "Davet", message: `Aktif davet sınırına ulaşıldı (max ${GAME_CONFIG.team.maxActiveInvites}).`, type: "error" };
    }
    if (team.invites.some((i) => i.toUserId === userId && i.status === "bekliyor")) {
      return { ok: false, title: "Davet", message: "Bu kullanıcıya bekleyen davet zaten var.", type: "info" };
    }

    const newInvite: TeamInvite = {
      id: `inv-${Date.now()}`,
      teamId,
      toUserId: userId,
      fromUserId: currentUserId,
      status: "bekliyor",
      createdAt: Date.now(),
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, invites: [...t.invites, newInvite] } : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_requests').insert({
        team_id: teamId, user_id: userId, type: 'invite', status: 'pending'
      }).then();
    }
    return { ok: true, title: "Davet Gönderildi", message: "Kullanıcıya davet iletildi.", type: "success" };
  };

  const cancelInvite = (inviteId: string): ActionResult => {
    const t = teams.find(x => x.invites.some(i => i.id === inviteId));
    const inv = t?.invites.find(i => i.id === inviteId);

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        invites: t.invites.map((i) =>
          i.id === inviteId && i.fromUserId === currentUserId ? { ...i, status: "red" as const } : i
        ),
      }))
    );

    if (currentUser && t && inv) {
      (supabase as any).from('team_requests').update({ status: 'rejected' }).match({ team_id: t.id, user_id: inv.toUserId, type: 'invite' }).then();
    }
    return { ok: true, title: "Davet", message: "Davet iptal edildi.", type: "info" };
  };

  // ── Başvuru ───────────────────────────────────────────────────────────────

  const applyToTeam = (teamId: string): ActionResult => {
    if (myTeamId !== null) {
      return { ok: false, title: "Başvuru", message: "Zaten bir takımdayken başvuramazsın.", type: "error" };
    }

    const team = teams.find((t) => t.id === teamId);
    if (!team) return { ok: false, title: "Başvuru", message: "Takım bulunamadı.", type: "error" };

    if (team.members.length >= GAME_CONFIG.team.maxMembers) {
      return { ok: false, title: "Başvuru", message: "Takım dolu.", type: "error" };
    }
    if (hasApplied(teamId)) {
      return { ok: false, title: "Başvuru", message: "Zaten bekleyen bir başvurun var.", type: "info" };
    }

    const newApp: TeamApplication = {
      id: `app-${Date.now()}`,
      teamId,
      fromUserId: currentUserId,
      status: "bekliyor",
      createdAt: Date.now(),
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, applications: [...t.applications, newApp] } : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_requests').insert({
        team_id: teamId, user_id: currentUserId, type: 'application', status: 'pending'
      }).then();
    }
    return { ok: true, title: "Başvuru Gönderildi", message: "Takım yöneticisi onaylayınca katılacaksın.", type: "success" };
  };

  const cancelApplication = (teamId: string): ActionResult => {
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              applications: t.applications.map((a) =>
            a.fromUserId === currentUserId && a.status === "bekliyor"
                  ? { ...a, status: "red" as const }
                  : a
              ),
            }
          : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_requests').update({ status: 'rejected' }).match({ team_id: teamId, user_id: currentUserId, type: 'application' }).then();
    }
    return { ok: true, title: "Başvuru", message: "Başvurun iptal edildi.", type: "info" };
  };

  // ── Davet yanıtlama (kullanıcı) ───────────────────────────────────────────

  const acceptInvite = (inviteId: string): ActionResult => {
    if (myTeamId !== null) {
      return { ok: false, title: "Davet", message: "Zaten bir takımdayken daveti kabul edemezsin.", type: "error" };
    }

    let targetTeamId: string | null = null;
    let targetInvite: TeamInvite | null = null;

    const updated = teams.map((t) => {
      const inv = t.invites.find((i) => i.id === inviteId && i.toUserId === currentUserId && i.status === "bekliyor");
      if (!inv) return t;

      if (t.members.length >= GAME_CONFIG.team.maxMembers) return t;

      targetTeamId = t.id;
      targetInvite = inv;
      const newMember: TeamMember = { userId: currentUserId, role: "uye", joinedAt: Date.now() };
      return {
        ...t,
        members: [...t.members, newMember],
        invites: t.invites.map((i) =>
          i.id === inviteId ? { ...i, status: "kabul" as const } : i
        ),
      };
    });

    if (!targetTeamId) {
      return { ok: false, title: "Davet", message: "Davet bulunamadı veya takım dolu.", type: "error" };
    }

    setTeams(updated);

    if (currentUser && targetTeamId && targetInvite) {
      (supabase as any).from('team_requests').update({ status: 'accepted' }).match({ team_id: targetTeamId, user_id: currentUserId, type: 'invite' }).then();
      (supabase as any).from('team_members').insert({ team_id: targetTeamId, user_id: currentUserId, role: 'member' }).then();
    }
    return { ok: true, title: "Takıma Katıldın", message: "Daveti kabul ettin ve takıma dahil oldun.", type: "success" };
  };

  const declineInvite = (inviteId: string): ActionResult => {
    const t = teams.find(x => x.invites.some(i => i.id === inviteId));

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        invites: t.invites.map((i) =>
          i.id === inviteId && i.toUserId === currentUserId ? { ...i, status: "red" as const } : i
        ),
      }))
    );

    if (currentUser && t) {
      (supabase as any).from('team_requests').update({ status: 'rejected' }).match({ team_id: t.id, user_id: currentUserId, type: 'invite' }).then();
    }
    return { ok: true, title: "Davet", message: "Davet reddedildi.", type: "info" };
  };

  // ── Başvuru kararı (yönetici/kurucu) ──────────────────────────────────────

  const acceptApplication = (appId: string): ActionResult => {
    let accepted = false;
    let targetApp: TeamApplication | null = null;

    const updated = teams.map((t) => {
      const app = t.applications.find((a) => a.id === appId && a.status === "bekliyor");
      if (!app) return t;

      const role = t.members.find((m) => m.userId === currentUserId)?.role;
      if (role !== "kurucu" && role !== "yonetici") return t;
      if (t.members.length >= GAME_CONFIG.team.maxMembers) return t;

      accepted = true;
      targetApp = app;
      const newMember: TeamMember = { userId: app.fromUserId, role: "uye", joinedAt: Date.now() };
      return {
        ...t,
        members: [...t.members, newMember],
        applications: t.applications.map((a) =>
          a.id === appId ? { ...a, status: "kabul" as const } : a
        ),
      };
    });

    if (!accepted) {
      return { ok: false, title: "Başvuru", message: "Başvuru bulunamadı veya yetkin yok.", type: "error" };
    }

    setTeams(updated);

    if (currentUser && targetApp) {
      (supabase as any).from('team_requests').update({ status: 'accepted' }).match({ team_id: (targetApp as any).teamId, user_id: (targetApp as any).fromUserId, type: 'application' }).then();
      (supabase as any).from('team_members').insert({ team_id: (targetApp as any).teamId, user_id: (targetApp as any).fromUserId, role: 'member' }).then();
    }
    return { ok: true, title: "Başvuru Kabul", message: "Kullanıcı takıma eklendi.", type: "success" };
  };

  const declineApplication = (appId: string): ActionResult => {
    const t = teams.find(x => x.applications.some(a => a.id === appId));
    const app = t?.applications.find(a => a.id === appId);

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        applications: t.applications.map((a) =>
          a.id === appId ? { ...a, status: "red" as const } : a
        ),
      }))
    );

    if (currentUser && t && app) {
      (supabase as any).from('team_requests').update({ status: 'rejected' }).match({ team_id: t.id, user_id: app.fromUserId, type: 'application' }).then();
    }
    return { ok: true, title: "Başvuru", message: "Başvuru reddedildi.", type: "info" };
  };

  // ── Üye yönetimi ──────────────────────────────────────────────────────────

  const kickMember = (teamId: string, userId: string): ActionResult => {
    const role = getMyRole(teamId);
    if (role !== "kurucu" && role !== "yonetici") {
      return { ok: false, title: "Üye At", message: "Yetkin yok.", type: "error" };
    }

    const team = teams.find((t) => t.id === teamId);
    if (!team) return { ok: false, title: "Üye At", message: "Takım bulunamadı.", type: "error" };

    const target = team.members.find((m) => m.userId === userId);
    if (!target) return { ok: false, title: "Üye At", message: "Üye bulunamadı.", type: "error" };
    if (target.role === "kurucu") {
      return { ok: false, title: "Üye At", message: "Kurucuyu atamazsın.", type: "error" };
    }
    if (role === "yonetici" && target.role === "yonetici") {
      return { ok: false, title: "Üye At", message: "Yönetici başka yöneticiyi atamaz.", type: "error" };
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
          : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_members').delete().match({ team_id: teamId, user_id: userId }).then();
    }
    return { ok: true, title: "Üye Atıldı", message: "Kullanıcı takımdan çıkarıldı.", type: "success" };
  };

  const leaveTeam = (teamId: string): ActionResult => {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return { ok: false, title: "Ayrıl", message: "Takım bulunamadı.", type: "error" };

    const myMember = team.members.find((m) => m.userId === currentUserId);
    if (!myMember) return { ok: false, title: "Ayrıl", message: "Bu takımda değilsin.", type: "error" };
    if (myMember.role === "kurucu") {
      return { ok: false, title: "Ayrıl", message: "Kurucu ayrılamaz. Önce takımı dağıt.", type: "error" };
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? { ...t, members: t.members.filter((m) => m.userId !== currentUserId) }
          : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_members').delete().match({ team_id: teamId, user_id: currentUserId }).then();
    }
    return { ok: true, title: "Takımdan Ayrıldın", message: "Takımdan başarıyla ayrıldın.", type: "success" };
  };

  const promoteToManager = (teamId: string, userId: string): ActionResult => {
    const role = getMyRole(teamId);
    if (role !== "kurucu") {
      return { ok: false, title: "Yükselt", message: "Sadece kurucu yönetici atayabilir.", type: "error" };
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.userId === userId && m.role === "uye" ? { ...m, role: "yonetici" as TeamRole } : m
              ),
            }
          : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_members').update({ role: 'admin' }).match({ team_id: teamId, user_id: userId }).then();
    }
    return { ok: true, title: "Yönetici Atandı", message: "Kullanıcı yönetici yapıldı.", type: "success" };
  };

  const demoteToMember = (teamId: string, userId: string): ActionResult => {
    const role = getMyRole(teamId);
    if (role !== "kurucu") {
      return { ok: false, title: "Düşür", message: "Sadece kurucu yönetici rütbesini düşürebilir.", type: "error" };
    }

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId
          ? {
              ...t,
              members: t.members.map((m) =>
                m.userId === userId && m.role === "yonetici" ? { ...m, role: "uye" as TeamRole } : m
              ),
            }
          : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_members').update({ role: 'member' }).match({ team_id: teamId, user_id: userId }).then();
    }
    return { ok: true, title: "Rütbe Düşürüldü", message: "Kullanıcı üyeye döndürüldü.", type: "success" };
  };

  // ── Takım sohbeti ──────────────────────────────────────────────────────────

  const sendTeamMessage = (teamId: string, text: string): ActionResult => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, title: "Mesaj", message: "Boş mesaj gönderilemez.", type: "error" };
    }

    const role = getMyRole(teamId);
    if (!role) {
      return { ok: false, title: "Mesaj", message: "Bu takıma üye değilsin.", type: "error" };
    }

    const msg: TeamChatMessage = {
      id: `tm-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      text: trimmed,
      createdAt: Date.now(),
    };

    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, messages: [...t.messages, msg] } : t
      )
    );

    if (currentUser) {
      (supabase as any).from('team_chat_messages').insert({
        team_id: teamId, user_id: currentUserId, user_name: currentUserName, text: trimmed
      }).then();
    }
    return { ok: true, title: "", message: "", type: "success" };
  };

  // ── Context value ──────────────────────────────────────────────────────────

  const value: TeamContextType = useMemo(() => ({
    teams,
    myTeamId,
    pendingInvites,
    createTeam,
    disbandTeam,
    inviteToTeam,
    cancelInvite,
    applyToTeam,
    cancelApplication,
    acceptInvite,
    declineInvite,
    acceptApplication,
    declineApplication,
    kickMember,
    leaveTeam,
    promoteToManager,
    demoteToMember,
    sendTeamMessage,
    getMyRole,
    hasApplied,
  }), [teams, myTeamId, pendingInvites, currentUserId, currentUser]);

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error("useTeam must be used inside TeamProvider");
  return ctx;
}
