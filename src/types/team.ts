/**
 * Takım sistemi tipleri.
 */

/** Takım içi kullanıcı rolü. */
export type TeamRole = "kurucu" | "yonetici" | "uye";

/** Davet durumu. */
export type TeamInviteStatus = "bekliyor" | "kabul" | "red";

/** Başvuru durumu. */
export type TeamApplicationStatus = "bekliyor" | "kabul" | "red";

/** Takım üyesi. */
export type TeamMember = {
  userId: string;
  role: TeamRole;
  joinedAt: number;
};

/** Takım daveti (yönetici → kullanıcı). */
export type TeamInvite = {
  id: string;
  teamId: string;
  toUserId: string;
  fromUserId: string;
  status: TeamInviteStatus;
  createdAt: number;
};

/** Takıma başvuru (kullanıcı → takım). */
export type TeamApplication = {
  id: string;
  teamId: string;
  fromUserId: string;
  status: TeamApplicationStatus;
  createdAt: number;
};

/** Takım içi sohbet mesajı. */
export type TeamChatMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
};

/** Takım. */
export type Team = {
  id: string;
  name: string;
  desc: string;
  tag: string;
  members: TeamMember[];
  invites: TeamInvite[];
  applications: TeamApplication[];
  messages: TeamChatMessage[];
  createdAt: number;
};
