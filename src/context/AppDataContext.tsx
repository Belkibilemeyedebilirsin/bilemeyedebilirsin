import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, Text, View } from "react-native";
// @ts-ignore
import ConfettiCannon from "react-native-confetti-cannon";
import { GAME_CONFIG } from "../config/gameConfig";
import { supabase } from "../lib/supabase";
import type {
  AppFeature,
  ArenaPost,
  ChatMessage,
  ChatRoom,
  CouponRecord,
  CouponSelectionRecord,
  DirectMessageThread,
  FraudFlag,
  FriendRequestDirection,
  KpPackageId,
  KpPurchaseRecord,
  NotificationType,
  PaymentLog,
  PredictionChoice,
  StoreCategoryCode,
} from "../types";
import { useAuth } from "./AuthContext";
import { useEconomy } from "./EconomyContext";
import { usePrediction } from "./PredictionContext";
import { useUIFeedback } from "./UIFeedbackContext";

type CurrentCouponSelection = {
  predictionId: string;
  title: string;
  category: string;
  choice: PredictionChoice;
  odd: number;
};

export type TaskItem = {
  id: string;
  period: "daily" | "weekly" | "seasonal";
  title: string;
  description: string;
  target: number;
  current: number;
  rewardTp: number;
  rewardKp?: number;
  isPremium?: boolean;
};

/**
 * Geriye dönük uyumluluk için re-export.
 * magaza.tsx ve profil.tsx bu ismi import etmeye devam edebilir.
 */
export type StoreCategory = StoreCategoryCode;

export type StoreItem = {
  id: string;
  name: string;
  category: StoreCategoryCode;
  priceKp: number;
  previewText?: string;
  color?: string;
  appBgColor?: string; // Uygulamanın genel arka plan rengini değiştirmek için eklendi
};

export type LiveTaskItem = TaskItem & {
  claimed: boolean;
};

export type LevelInfo = {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  progress: number;
  totalXp: number;
  title: string;
};

export type PassDayReward = {
  day: number;
  freeReward: string;
  premiumReward: string;
  freeKp: number;
  premiumKp: number;
};

export type FriendRequestItem = {
  userId: string;
  direction: FriendRequestDirection;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: number;
  isRead: boolean;
  target:
    | { screen: "zaman-yolculugu"; focusId?: string }
    | { screen: "genel-sohbet"; tab?: string; userId?: string }
    | { screen: "tahmin"; predictionId: string }
    | { screen: "acik-artirma" }
    | { screen: "arkadaslar" }
    | { screen: "takimlar" }
    | { screen: "gorevler" }
    | { screen: "none" };
};

type ActionResult = {
  ok: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  tpDelta?: number;
  kpDelta?: number;
  xpDelta?: number;
};

type AppDataContextType = {
  tpBalance: number;
  kpBalance: number;
  ownInternalId: string;
  levelInfo: LevelInfo;
  currentLevel: number;
  activeCouponRecords: CouponRecord[];
  arenaPosts: ArenaPost[];
  tasks: LiveTaskItem[];
  unreadGeneralCount: number;
  roomUnreadCounts: Record<string, number>;
  unreadDmCounts: Record<string, number>;
  processedWinIds: string[];
  streakCount: number;
  hasPass: boolean;
  passDays: PassDayReward[];
  claimedPassDays: number[];
  chatRooms: ChatRoom[];
  dmThreads: DirectMessageThread[];
  acceptedFriendIds: string[];
  friendRequests: FriendRequestItem[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  storeCatalog: StoreItem[];
  ownedStoreItemIds: string[];
  equippedStoreItems: {
    titleId: string;
    avatarId: string;
    frameId: string;
    backgroundId: string;
    badgeId: string;
    entryEffectId: string;
    themeId: string;
    messageStyleId: string;
    bannerId: string;
  };
  currentProfileAppearance: {
    avatar: string;
    title: string;
    frameColor: string;
    backgroundName: string;
    badgeText: string;
    entryEffectName: string;
    themeName: string;
    themeColor: string;
    themeAppBgColor: string;
    messageStyleName: string;
    bannerColor: string | null;
  };
  careerStats: {
    totalSeasons: number;
    allTimeQuestions: number;
    allTimeStaked: number;
    allTimeWon: number;
    bestWinRate: number;
    bestSeasonKp: number;
  };
  kpPurchaseRecords: KpPurchaseRecord[];
  paymentLogs: PaymentLog[];
  purchaseKpPackage: (packageId: KpPackageId) => ActionResult;
  requestKpRefund: (recordId: string) => ActionResult;
  unlockedPredictionIds: string[];
  unlockPredictionAccess: (questionId: string) => ActionResult;
  setCurrentProfileTitle: (value: string) => void;
  setCurrentProfileAvatar: (value: string) => void;
  setCurrentProfileFrameColor: (value: string) => void;
  purchaseStoreItem: (itemId: string) => ActionResult;
  equipStoreItem: (itemId: string) => ActionResult;
  placeCoupon: (args: {
    selections: CurrentCouponSelection[];
    stake: number;
    totalOdds: number;
  }) => Promise<ActionResult>;
  shareCouponToArena: (args: {
    selections: CurrentCouponSelection[];
    stake: number;
    totalOdds: number;
    note?: string;
  }) => ActionResult;
  claimedBonusIds: string[];
  claimTask: (taskId: string) => ActionResult;
  claimWinXp: (recordId: string) => ActionResult;
  claimPassDay: (day: number) => ActionResult;
  purchasePass: () => ActionResult;
  claimBonus: (bonusId: string) => ActionResult;
  createChatRoom: (args: {
    name: string;
    desc: string;
    vibe: string;
  }) => ActionResult;
  followingIds: string[];
  followUser: (userId: string) => ActionResult;
  unfollowUser: (userId: string) => void;
  globalMessages: ChatMessage[];
  lastRoomMessageAt: Record<string, number>;
  lastGlobalMessageAt: number;
  sendGlobalMessage: (text: string) => ActionResult;
  sendGlobalAnnouncement: (text: string) => ActionResult;
  sendRoomMessage: (roomId: string, text: string) => ActionResult;
  sendDirectMessage: (userId: string, text: string) => void;
  sendFriendRequest: (userId: string) => ActionResult;
  sendFriendRequestByInternalId: (internalId: string) => Promise<ActionResult>;
  acceptFriendRequest: (userId: string) => void;
  declineFriendRequest: (userId: string) => void;
  markGeneralChatRead: () => void;
  markRoomRead: (roomId: string) => void;
  markDmRead: (userId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notif: Omit<AppNotification, "id" | "createdAt" | "isRead">) => void;
  isGlobalChatPanelOpen: boolean;
  openGlobalChatPanel: () => void;
  closeGlobalChatPanel: () => void;
  incrementTaskProgress: (taskIds: string[]) => void;
  
  isFeatureUnlocked: (feature: AppFeature) => boolean;
  unlockedFeatures: AppFeature[];
};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const LEVEL_TITLES = [
  "Tahmin Çırağı",
  "Oran Takipçisi",
  "Kupon Ustası",
  "Yükselen Analist",
  "Veri Avcısı",
  "Arena Komutanı",
  "Elit Tahminci",
];

const passDaysSeed: PassDayReward[] = [
  { day: 1, freeReward: "30 KP", premiumReward: "Okyanus Çerçeve", freeKp: 30, premiumKp: 20 },
  { day: 2, freeReward: "25 KP", premiumReward: "Keskin Ünvan", freeKp: 25, premiumKp: 20 },
  { day: 3, freeReward: "40 KP", premiumReward: "Avatar Paketi", freeKp: 40, premiumKp: 25 },
  { day: 4, freeReward: "30 KP", premiumReward: "Neon Çerçeve", freeKp: 30, premiumKp: 20 },
  { day: 5, freeReward: "35 KP", premiumReward: "Operatör Modeli", freeKp: 35, premiumKp: 25 },
  { day: 6, freeReward: "40 KP", premiumReward: "Mavi Alev Rozeti", freeKp: 40, premiumKp: 20 },
  { day: 7, freeReward: "50 KP", premiumReward: "Epic Ünvan", freeKp: 50, premiumKp: 30 },
  { day: 8, freeReward: "30 KP", premiumReward: "Altın Avatar", freeKp: 30, premiumKp: 20 },
  { day: 9, freeReward: "35 KP", premiumReward: "Kraliyet Çerçeve", freeKp: 35, premiumKp: 25 },
  { day: 10, freeReward: "40 KP", premiumReward: "Gölgeli Ünvan", freeKp: 40, premiumKp: 20 },
  { day: 11, freeReward: "30 KP", premiumReward: "İkili Avatar", freeKp: 30, premiumKp: 20 },
  { day: 12, freeReward: "45 KP", premiumReward: "Canlı Model", freeKp: 45, premiumKp: 25 },
  { day: 13, freeReward: "35 KP", premiumReward: "Efsane Çerçeve", freeKp: 35, premiumKp: 25 },
  { day: 14, freeReward: "60 KP", premiumReward: "Final Ünvanı", freeKp: 60, premiumKp: 40 },
];

const SEED_TASKS: TaskItem[] = [
  // ── GÜNLÜK GÖREVLER ──
  { id: "d1", period: "daily", title: "Günlük Yoklama", description: "Uygulamaya giriş yap", target: 1, current: 1, rewardTp: 50 },
  { id: "d2", period: "daily", title: "Keskin Tahmin", description: "1 tahmin tuttur", target: 1, current: 0, rewardTp: 100 },
  { id: "d3", period: "daily", title: "Arena Katılımı", description: "Arenada 1 tahmin paylaş", target: 1, current: 0, rewardTp: 100 },
  { id: "d4", period: "daily", title: "Sohbetçi Ruh", description: "Genel sohbette 5 mesaj at", target: 5, current: 0, rewardTp: 50 },
  { id: "d5", period: "daily", title: "Yorum Bırak", description: "Tahmine yorum yap", target: 1, current: 0, rewardTp: 50 },
  { id: "d6", period: "daily", title: "Profil Avcısı", description: "Birinin profilini incele", target: 1, current: 0, rewardTp: 50 },
  { id: "d7", period: "daily", title: "Tahmin Keşfi", description: "En az 1 tahmin incele", target: 1, current: 0, rewardTp: 50 },
  { id: "d8", period: "daily", title: "Geri Döndün", description: "Gün içinde tekrar giriş yap", target: 1, current: 0, rewardTp: 50 },
  { id: "d9", period: "daily", title: "Detaylı İnceleme", description: "4 farklı tahmin incele", target: 4, current: 0, rewardTp: 100 },
  { id: "dp1", period: "daily", title: "Premium: Çifte Kazanç", description: "Pass sahiplerine anında günlük hediye", target: 1, current: 0, rewardTp: 250, rewardKp: 10, isPremium: true },
  { id: "dp2", period: "daily", title: "Premium: VIP Tahminci", description: "Premium ekstra günlük ödül", target: 1, current: 0, rewardTp: 200, rewardKp: 5, isPremium: true },
  { id: "dp3", period: "daily", title: "Premium: Elit Sosyal", description: "Özel premium günlük hediye", target: 1, current: 0, rewardTp: 150, rewardKp: 15, isPremium: true },

  // ── HAFTALIK GÖREVLER ──
  { id: "w1", period: "weekly", title: "Haftaya Başla", description: "Hafta içinde 3 gün uygulamaya giriş yap", target: 3, current: 0, rewardTp: 150 },
  { id: "w2", period: "weekly", title: "İsabet Ustası", description: "Toplam 3 tahmin tuttur", target: 3, current: 0, rewardTp: 250 },
  { id: "w3", period: "weekly", title: "Arena Oyuncusu", description: "Arenada toplam 3 tahmin paylaş", target: 3, current: 0, rewardTp: 200 },
  { id: "w4", period: "weekly", title: "Sohbetin Müdavimi", description: "Genel sohbette toplam 20 mesaj at", target: 20, current: 0, rewardTp: 150 },
  { id: "w5", period: "weekly", title: "Yorumcu", description: "Tahminlere toplam 5 yorum yap", target: 5, current: 0, rewardTp: 150 },
  { id: "w6", period: "weekly", title: "Profil Gezgini", description: "Toplam 5 farklı profil incele", target: 5, current: 0, rewardTp: 100 },
  { id: "w7", period: "weekly", title: "Tahmin Avcısı", description: "En az 10 farklı tahmin incele", target: 10, current: 0, rewardTp: 150 },
  { id: "w8", period: "weekly", title: "Geri Gelmeye Devam Et", description: "Hafta içinde 5 farklı gün giriş yap", target: 5, current: 0, rewardTp: 250 },
  { id: "w9", period: "weekly", title: "Haftalık Görev Avı", description: "Haftalık görevlerden herhangi 5 tanesini tamamla", target: 5, current: 0, rewardTp: 500, rewardKp: 20 },
  { id: "wp1", period: "weekly", title: "Premium: Büyük Vurgun", description: "Haftalık Premium TP Hediyesi", target: 1, current: 0, rewardTp: 1000, rewardKp: 50, isPremium: true },
  { id: "wp2", period: "weekly", title: "Premium: Açık Artırma", description: "Haftalık Premium KP Hediyesi", target: 1, current: 0, rewardTp: 500, rewardKp: 40, isPremium: true },
  { id: "wp3", period: "weekly", title: "Premium: Kâhin", description: "Haftalık VIP Bonus", target: 1, current: 0, rewardTp: 1500, rewardKp: 75, isPremium: true },

  // ── SEZONLUK GÖREVLER ──
  { id: "s1", period: "seasonal", title: "Sezonun Yıldızı", description: "Sezon boyunca 50 kupon yap", target: 50, current: 0, rewardTp: 2000, rewardKp: 50 },
  { id: "s4", period: "seasonal", title: "Arena Efsanesi", description: "Arenada 20 paylaşım yap", target: 20, current: 0, rewardTp: 1500, rewardKp: 40 },
  { id: "sp1", period: "seasonal", title: "Premium: Sezon Şampiyonu", description: "Sezonluk Premium Mega Ödül", target: 1, current: 0, rewardTp: 10000, rewardKp: 300, isPremium: true },
  { id: "sp2", period: "seasonal", title: "Premium: Koleksiyoner", description: "Sezonluk VIP Kozmetik Ödülü", target: 1, current: 0, rewardTp: 5000, rewardKp: 200, isPremium: true },
  { id: "sp3", period: "seasonal", title: "Premium: Efsanevi", description: "Sezonluk Elite Bonus", target: 1, current: 0, rewardTp: 8000, rewardKp: 250, isPremium: true },
];

const internalIdMap: Record<string, string> = {}; // Örnek kullanıcılar temizlendi

const storeCatalogSeed: StoreItem[] = [
  {
    id: "title-rising-analyst",
    name: "Yükselen Analist",
    category: "title",
    priceKp: 0,
  },
  {
    id: "title-tempo-master",
    name: "Tempo Ustası",
    category: "title",
    priceKp: 90,
  },
  {
    id: "title-arena-commander",
    name: "Arena Komutanı",
    category: "title",
    priceKp: 140,
  },
  {
    id: "title-shadow-reader",
    name: "Gölge Okuyucu",
    category: "title",
    priceKp: 160,
  },
  {
    id: "avatar-g",
    name: "Klasik G",
    category: "avatar",
    priceKp: 0,
    previewText: "G",
  },
  {
    id: "avatar-lightning",
    name: "Şimşek Avatar",
    category: "avatar",
    priceKp: 80,
    previewText: "⚡",
  },
  {
    id: "avatar-crown",
    name: "Taç Avatar",
    category: "avatar",
    priceKp: 110,
    previewText: "👑",
  },
  {
    id: "avatar-target",
    name: "Hedef Avatar",
    category: "avatar",
    priceKp: 95,
    previewText: "🎯",
  },
  {
    id: "frame-teal",
    name: "Turkuaz Çerçeve",
    category: "frame",
    priceKp: 0,
    color: "#14b8a6",
  },
  {
    id: "frame-blue",
    name: "Mavi Çerçeve",
    category: "frame",
    priceKp: 100,
    color: "#2563eb",
  },
  {
    id: "frame-purple",
    name: "Mor Çerçeve",
    category: "frame",
    priceKp: 120,
    color: "#8b5cf6",
  },
  {
    id: "frame-gold",
    name: "Altın Çerçeve",
    category: "frame",
    priceKp: 170,
    color: "#f59e0b",
  },
  {
    id: "model-operator",
    name: "Operatör Modeli",
    category: "model",
    priceKp: 180,
    previewText: "3D",
  },
  {
    id: "costume-ocean",
    name: "Okyanus Kostümü",
    category: "costume",
    priceKp: 220,
    previewText: "SKIN",
  },
  // ── Arka Plan ──────────────────────────────────────────────
  {
    id: "bg-default",
    name: "Varsayılan",
    category: "background",
    priceKp: 0,
    color: "#f8fafc",
    previewText: "BG",
  },
  {
    id: "bg-neon",
    name: "Neon Zemin",
    category: "background",
    priceKp: 130,
    color: "#0f172a",
    previewText: "NEO",
  },
  {
    id: "bg-ocean",
    name: "Okyanus Arka Planı",
    category: "background",
    priceKp: 160,
    color: "#0ea5e9",
    previewText: "OCN",
  },
  // ── Rozet ──────────────────────────────────────────────────
  {
    id: "badge-none",
    name: "Rozetsiz",
    category: "badge",
    priceKp: 0,
    previewText: "—",
  },
  {
    id: "badge-blue",
    name: "Mavi Rozet",
    category: "badge",
    priceKp: 80,
    color: "#2563eb",
    previewText: "🔵",
  },
  {
    id: "badge-gold",
    name: "Altın Yıldız",
    category: "badge",
    priceKp: 200,
    color: "#f59e0b",
    previewText: "⭐",
  },
  // ── Giriş Efekti ───────────────────────────────────────────
  {
    id: "entry-none",
    name: "Efektsiz",
    category: "entry_effect",
    priceKp: 0,
    previewText: "—",
  },
  {
    id: "entry-neon",
    name: "Neon Giriş",
    category: "entry_effect",
    priceKp: 150,
    color: "#8b5cf6",
    previewText: "✨",
  },
  {
    id: "entry-fire",
    name: "Ateşli Giriş",
    category: "entry_effect",
    priceKp: 250,
    color: "#ef4444",
    previewText: "🔥",
  },
  // ── Tema ───────────────────────────────────────────────────
  {
    id: "theme-default",
    name: "Varsayılan Tema",
    category: "theme",
    priceKp: 0,
    color: "#14b8a6",
    appBgColor: "#f8fafc",
    previewText: "T",
  },
  {
    id: "theme-dark",
    name: "Koyu Tema",
    category: "theme",
    priceKp: 120,
    color: "#1e293b",
    appBgColor: "#0f172a",
    previewText: "T",
  },
  {
    id: "theme-purple",
    name: "Mor Tema",
    category: "theme",
    priceKp: 180,
    color: "#7c3aed",
    appBgColor: "#f3e8ff",
    previewText: "T",
  },
  {
    id: "theme-ocean",
    name: "Okyanus Teması",
    category: "theme",
    priceKp: 160,
    color: "#0ea5e9",
    appBgColor: "#e0f2fe",
    previewText: "T",
  },
  {
    id: "theme-forest",
    name: "Doğa Teması",
    category: "theme",
    priceKp: 160,
    color: "#16a34a",
    appBgColor: "#dcfce7",
    previewText: "T",
  },
  // ── Mesaj Stili ────────────────────────────────────────────
  {
    id: "msg-classic",
    name: "Klasik",
    category: "message_style",
    priceKp: 0,
    previewText: "Aa",
  },
  {
    id: "msg-bubble",
    name: "Balon Stili",
    category: "message_style",
    priceKp: 70,
    color: "#2563eb",
    previewText: "💬",
  },
  {
    id: "msg-neon",
    name: "Neon Mesaj",
    category: "message_style",
    priceKp: 140,
    color: "#8b5cf6",
    previewText: "⚡",
  },
  // ── Banner ─────────────────────────────────────────────────
  {
    id: "banner-none",
    name: "Bannersız",
    category: "banner",
    priceKp: 0,
    previewText: "—",
  },
  {
    id: "banner-teal",
    name: "Turkuaz Banner",
    category: "banner",
    priceKp: 80,
    color: "#0d9488",
    previewText: "BNR",
  },
  {
    id: "banner-blue",
    name: "Gece Mavisi Banner",
    category: "banner",
    priceKp: 100,
    color: "#1d4ed8",
    previewText: "BNR",
  },
  {
    id: "banner-purple",
    name: "Mor Banner",
    category: "banner",
    priceKp: 120,
    color: "#6d28d9",
    previewText: "BNR",
  },
  {
    id: "banner-dark",
    name: "Koyu Banner",
    category: "banner",
    priceKp: 100,
    color: "#1e293b",
    previewText: "BNR",
  },
  {
    id: "banner-gold",
    name: "Altın Banner",
    category: "banner",
    priceKp: 200,
    color: "#92400e",
    previewText: "BNR",
  },
  {
    id: "banner-crimson",
    name: "Kızıl Banner",
    category: "banner",
    priceKp: 160,
    color: "#9f1239",
    previewText: "BNR",
  },
];

function getNowLabel() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `Bugün • ${hh}:${mm}`;
}

function getStoreItem(itemId: string) {
  return storeCatalogSeed.find((item) => item.id === itemId);
}

// ── GÖREV PERİYOT ANAHTARI (DİNAMİK SIFIRLAMA) ─────────────
// ── GÖREV PERİYOT ANAHTARI (DİNAMİK SIFIRLAMA) ──────────────────────────
export const getTaskPeriodKey = (period: "daily" | "weekly" | "seasonal", seasonId: number = 1) => {
  const now = new Date();
  if (period === "daily") {
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  // Haftalık ve 2-Haftalık (Sezonluk) için ortak hafta hesaplama mantığı
  if (period === "weekly" || period === "seasonal") {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    if (period === "weekly") {
      return `${d.getUTCFullYear()}-W${weekNo}`;
    }
    // Sezonluk görevler için 2 haftalık periyot anahtarı
    const biWeeklyNo = Math.ceil(weekNo / 2);
    return `${d.getUTCFullYear()}-BW${biWeeklyNo}`;
  }
  return `S${seasonId}`;
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { wallet, spendTp, addTp, spendKp, addKp, dailyLoginState } = useEconomy();
  const streakCount = dailyLoginState.streakDays;
  const { placeStake, injectVolume, questions } = usePrediction();
  const { currentUser } = useAuth();
  const tpBalance = wallet?.tp ?? 0;
  const kpBalance = wallet?.kp ?? 0;
  const [xpBalance, setXpBalance] = useState(0);

  const [ownedStoreItemIds, setOwnedStoreItemIds] = useState<string[]>([
    "title-rising-analyst",
    "avatar-g",
    "frame-teal",
    "bg-default",
    "badge-none",
    "entry-none",
    "theme-default",
    "msg-classic",
    "banner-none",
  ]);

  const [equippedStoreItems, setEquippedStoreItems] = useState({
    titleId: "title-rising-analyst",
    avatarId: "avatar-g",
    frameId: "frame-teal",
    backgroundId: "bg-default",
    badgeId: "badge-none",
    entryEffectId: "entry-none",
    themeId: "theme-default",
    messageStyleId: "msg-classic",
    bannerId: "banner-none",
  });

  const [activeCouponRecords, setActiveCouponRecords] = useState<CouponRecord[]>([]);
  const [arenaPosts, setArenaPosts] = useState<ArenaPost[]>([]);
  const [tasks, setTasks] = useState<LiveTaskItem[]>(
    SEED_TASKS.map((task) => ({ ...task, claimed: false }))
  );
  const [unreadGeneralCount, setUnreadGeneralCount] = useState(0);
  const [roomUnreadCounts, setRoomUnreadCounts] = useState<Record<string, number>>({});
  const [unreadDmCounts, setUnreadDmCounts] = useState<Record<string, number>>({});
  const [processedWinIds, setProcessedWinIds] = useState<string[]>([]);
  const [claimedPassDays, setClaimedPassDays] = useState<number[]>([]);
  const [hasPass, setHasPass] = useState(false);
  const [claimedBonusIds, setClaimedBonusIds] = useState<string[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [dmThreads, setDmThreads] = useState<DirectMessageThread[]>([]);
  const [acceptedFriendIds, setAcceptedFriendIds] = useState<string[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestItem[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
  const [isGlobalChatPanelOpen, setIsGlobalChatPanelOpen] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number; featureName: string; featureDesc: string; } | null>(null);
  const [lastGlobalMessageAt, setLastGlobalMessageAt] = useState(0);
  const [lastRoomMessageAt, setLastRoomMessageAt] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [kpPurchaseRecords, setKpPurchaseRecords] = useState<KpPurchaseRecord[]>([]);
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [unlockedPredictionIds, setUnlockedPredictionIds] = useState<string[]>([]);

  // ── Görev İlerlemelerini Veritabanına Eşitle ──
  const syncTasksToDb = useCallback((newTasks: LiveTaskItem[]) => {
    if (!currentUser) return;
    const seasonId = wallet?.currentSeasonId || 1;
    // Sadece aktif gün/haftanın/sezonun anahtarlarını JSON olarak kaydederiz.
    // Bu sayede eski günlerin çöplüğü otomatik temizlenmiş olur (Garbage Collection).
    const progressObj = newTasks.reduce((acc, t) => {
      const uId = `${t.id}_${getTaskPeriodKey(t.period, seasonId)}`;
      return { ...acc, [uId]: t.current };
    }, {});
    (supabase as any).from("profiles").update({ task_progress: progressObj }).eq("id", currentUser.id).then();
  }, [currentUser, wallet?.currentSeasonId]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const currentSeasonId = wallet?.currentSeasonId || 1;

    const fetchWithRetry = async (queryFn: () => Promise<any>, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        const res = await queryFn();
        if (res.error && String(res.error.message).includes("Lock broken")) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        return res;
      }
      return await queryFn();
    };

    fetchWithRetry(() => (supabase as any)
      .from("profiles")
      .select("owned_store_items, equipped_store_items, xp_balance, has_pass, claimed_pass_days, claimed_bonus_ids, unlocked_prediction_ids, task_progress, processed_win_ids, claimed_task_ids")
      .eq("id", currentUser.id)
      .single()).then(({ data, error }: any) => {
        if (error) console.error("SUPABASE OKUMA HATASI (Sütunlar eksik olabilir):", error);
        const d = data as any;
        if (d && d.owned_store_items) {
          setOwnedStoreItemIds(d.owned_store_items);
        }
        if (d && d.equipped_store_items) {
          setEquippedStoreItems(d.equipped_store_items);
        }
        if (d && d.xp_balance !== undefined) {
          setXpBalance(d.xp_balance);
        }
        if (d && d.has_pass !== undefined) {
          setHasPass(d.has_pass);
        }
        if (d && d.claimed_pass_days) {
          setClaimedPassDays(d.claimed_pass_days);
        }
        if (d && d.claimed_bonus_ids) {
          setClaimedBonusIds(d.claimed_bonus_ids);
        }
        if (d && d.unlocked_prediction_ids) {
          setUnlockedPredictionIds(d.unlocked_prediction_ids);
        }
        if (d && d.task_progress) {
          setTasks((prev) =>
            prev.map((t) => {
              const uId = `${t.id}_${getTaskPeriodKey(t.period, currentSeasonId)}`;
              return {
                ...t,
                current: (t.isPremium && d.has_pass) ? t.target : (d.task_progress[uId] ?? t.current),
              };
            })
          );
        } else if (d && d.has_pass) {
          setTasks((prev) => prev.map((t) => ({
            ...t, current: t.isPremium ? t.target : t.current
          })));
        }
        if (d && d.processed_win_ids) {
          setProcessedWinIds(d.processed_win_ids);
        }
        if (d && d.claimed_task_ids) {
          setTasks((prev) => prev.map(t => {
             const uId = `${t.id}_${getTaskPeriodKey(t.period, currentSeasonId)}`;
             return d.claimed_task_ids.includes(uId) ? { ...t, claimed: true } : t;
          }));
        }
      });

    // Kupon Geçmişi
    fetchWithRetry(() => (supabase as any).from('coupons').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false })).then(({ data }: any) => {
      if (data) {
        const mapped: CouponRecord[] = data.map((c: any) => ({
          id: c.id, type: c.type, status: c.status, playedAt: c.played_at,
          totalOdds: parseFloat(c.total_odds), stake: c.stake, maxWin: parseFloat(c.max_win), selections: c.selections
        }));
        setActiveCouponRecords(mapped);
      }
    });

    // Kupon durumu değişikliklerini dinle
    const couponChannel = (supabase as any).channel(`public:coupons_${currentUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'coupons', filter: `user_id=eq.${currentUser.id}` }, (payload: any) => {
        const oldRecord = payload.old;
        const newRecord = payload.new;

        if (oldRecord.status === 'Aktif' && newRecord.status === 'Kazandı') {
          (supabase as any).from("notifications").insert({
            user_id: currentUser.id,
            title: "Kupon Kazandı!",
            message: `Tebrikler, ${newRecord.max_win.toFixed(2)} TP kazandınız.`,
            type: "settlement",
            target: { screen: "aktif-kuponlar" }
          }).then();
        } else if (oldRecord.status === 'Aktif' && newRecord.status === 'Kaybetti') {
          (supabase as any).from("notifications").insert({
            user_id: currentUser.id,
            title: "Kupon Kaybetti",
            message: "Bir sonraki kuponda bol şans!",
            type: "settlement",
            target: { screen: "aktif-kuponlar" }
          }).then();
        }
      })
      .subscribe();

    // ── Özel Mesajları (DM) Çek ──
    fetchWithRetry(() => (supabase as any).from("direct_messages").select("*").or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`).order("created_at", { ascending: true })).then(({ data }: any) => {
      if (data) {
        const threads = new Map<string, ChatMessage[]>();
        data.forEach((m: any) => {
          const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
          const msg: ChatMessage = { id: m.id, user: m.sender_name, text: m.text, time: "Şimdi", createdAt: new Date(m.created_at).getTime(), mine: m.sender_id === currentUser.id };
          if (!threads.has(otherId)) threads.set(otherId, []);
          threads.get(otherId)!.push(msg);
        });
        setDmThreads(Array.from(threads.entries()).map(([userId, messages]) => ({ userId, messages })));
      }
    });

    // ── Bildirimleri Çek ──
    fetchWithRetry(() => (supabase as any).from("notifications").select("*").eq("user_id", currentUser.id).order("created_at", { ascending: false }).limit(30)).then(({ data }: any) => {
      if (data) {
        setNotifications(data.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.is_read,
          target: n.target,
          createdAt: new Date(n.created_at).getTime()
        })));
      }
    });

    // Arena Paylaşımları
    fetchWithRetry(() => (supabase as any).from("arena_posts").select("*").order("created_at", { ascending: false }).limit(50)).then(({ data }: any) => {
      if (data) {
        const mapped: ArenaPost[] = data.map((p: any) => ({
          id: p.id, user: p.user_name, avatar: p.avatar, time: "Şimdi", note: p.note,
          selectionCount: p.selection_count, stake: p.stake, totalOdds: parseFloat(p.total_odds), maxWin: parseFloat(p.max_win), selections: p.selections
        }));
        setArenaPosts(mapped);
      }
    });

    // ── Arkadaşlıkları Çek (Real-time) ──
    const fetchFriends = () => {
      fetchWithRetry(() => (supabase as any).from("relationships").select("*").or(`user_id.eq.${currentUser.id},target_user_id.eq.${currentUser.id}`)).then(({ data }: any) => {
        if (data) {
          const accepted: string[] = [];
          const requests: FriendRequestItem[] = [];
          data.forEach((r: any) => {
            if (r.status === 'friends') {
              accepted.push(r.user_id === currentUser.id ? r.target_user_id : r.user_id);
            } else if (r.status === 'pending') {
              if (r.target_user_id === currentUser.id) requests.push({ userId: r.user_id, direction: 'incoming' });
              if (r.user_id === currentUser.id) requests.push({ userId: r.target_user_id, direction: 'outgoing' });
            }
          });
          setAcceptedFriendIds(accepted);
          setFriendRequests(requests);
        }
      });
    };
    fetchFriends();

    return () => { (supabase as any).removeChannel(couponChannel); };
  }, [currentUser?.id, wallet?.currentSeasonId]);

  // ── Gerçek Zamanlı (Realtime) Sohbet Senkronizasyonu ───────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // 1. Odaları Çek
    (supabase as any).from("chat_rooms").select("*").order("created_at", { ascending: false }).then(({ data: roomsData }: any) => {
      if (roomsData) {
        const mappedRooms: ChatRoom[] = (roomsData as any[]).map(r => ({
          id: r.id,
          name: r.name,
          desc: r.description,
          vibe: r.vibe,
          online: r.online_count,
          ownerUserId: r.owner_user_id,
          messages: []
        }));
        setChatRooms(mappedRooms);

        // 2. Oda mesajlarını çek
        (supabase as any).from("chat_messages").select("*").not("room_id", "is", null).order("created_at", { ascending: false }).limit(200).then(({ data: msgData }: any) => {
           if (msgData) {
              const reversed = (msgData as any[]).reverse();
              setChatRooms(prev => prev.map(room => {
                 const roomMsgs = reversed.filter(m => m.room_id === room.id).map(m => ({
                    id: m.id,
                    user: m.user_name,
                    text: m.text,
                    time: "Şimdi",
                    createdAt: new Date(m.created_at).getTime(),
                    mine: m.user_id === currentUser.id,
                    isAnnouncement: m.is_announcement
                 }));
                 return { ...room, messages: roomMsgs };
              }));
           }
        });
      }
    });

    // 3. Genel Sohbeti Çek
    (supabase as any).from("chat_messages").select("*").is("room_id", null).order("created_at", { ascending: false }).limit(50).then(({ data }: any) => {
      if (data) {
        const mapped: ChatMessage[] = (data as any[]).reverse().map(m => ({
          id: m.id,
          user: m.user_name,
          text: m.text,
          time: "Şimdi",
          createdAt: new Date(m.created_at).getTime(),
          mine: m.user_id === currentUser.id,
          isAnnouncement: m.is_announcement
        }));
        setGlobalMessages(mapped);
      }
    });

    // 4. Realtime Aboneliği
    const channel = supabase.channel('public:chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        const m = payload.new as any;
        const newMsg: ChatMessage = {
          id: m.id,
          user: m.user_name,
          text: m.text,
          time: "Şimdi",
          createdAt: new Date(m.created_at).getTime(),
          mine: m.user_id === currentUser.id,
          isAnnouncement: m.is_announcement
        };

        if (m.room_id === null) {
          setGlobalMessages(prev => {
            if (prev.some(x => x.id === m.id || (x.text === m.text && x.mine && Date.now() - (x.createdAt || 0) < 10000))) return prev;
            return [...prev, newMsg].slice(-100);
          });
          if (m.user_id !== currentUser.id) {
             setUnreadGeneralCount(prev => prev + 1);
          }
        } else {
          setChatRooms(prev => prev.map(room => {
            if (room.id === m.room_id) {
              if (room.messages.some(x => x.id === m.id || (x.text === m.text && x.mine && Date.now() - (x.createdAt || 0) < 10000))) return room;
              return { ...room, messages: [...room.messages, newMsg].slice(-100) };
            }
            return room;
          }));
          if (m.user_id !== currentUser.id) {
             setRoomUnreadCounts(prev => ({ ...prev, [m.room_id]: (prev[m.room_id] || 0) + 1 }));
          }
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_rooms' }, payload => {
        const r = payload.new as any;
        setChatRooms(prev => {
          if (prev.some(x => x.id === r.id)) return prev;
          return [{
            id: r.id,
            name: r.name,
            desc: r.description,
            vibe: r.vibe,
            online: r.online_count,
            ownerUserId: r.owner_user_id,
            messages: []
          }, ...prev];
        });
      })
      .subscribe();

    // Özel Mesaj Canlı Yayın
    const dmChannel = supabase.channel('public:dm')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, payload => {
        const m = payload.new as any;
        if (m.sender_id === currentUser.id || m.receiver_id === currentUser.id) {
          const otherId = m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
          const newMsg: ChatMessage = { id: m.id, user: m.sender_name, text: m.text, time: "Şimdi", createdAt: new Date(m.created_at).getTime(), mine: m.sender_id === currentUser.id };
          setDmThreads((prev) => {
            const existing = prev.find(t => t.userId === otherId);
            if (existing) {
               if (existing.messages.some(x => x.id === m.id || (x.text === m.text && x.mine && Date.now() - (x.createdAt || 0) < 10000))) return prev;
               return prev.map(t => t.userId === otherId ? { ...t, messages: [...t.messages, newMsg] } : t);
            }
            return [...prev, { userId: otherId, messages: [newMsg] }];
          });
          
          if (m.sender_id !== currentUser.id) {
            setUnreadDmCounts((prev) => ({ ...prev, [m.sender_id]: (prev[m.sender_id] || 0) + 1 }));
          }
        }
      }).subscribe();

    // Arkadaşlık Canlı Yayın
    const relChannel = supabase.channel('public:relationships')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relationships' }, () => {
        // Herhangi bir istek veya kabul durumunda listeyi tazele
        const fetchRelWithRetry = async (retries = 3) => {
          for (let i = 0; i < retries; i++) {
            const res = await (supabase as any).from("relationships").select("*").or(`user_id.eq.${currentUser.id},target_user_id.eq.${currentUser.id}`);
            if (res.error && String(res.error.message).includes("Lock broken")) {
              await new Promise((r) => setTimeout(r, 300));
              continue;
            }
            return res;
          }
          return await (supabase as any).from("relationships").select("*").or(`user_id.eq.${currentUser.id},target_user_id.eq.${currentUser.id}`);
        };
        fetchRelWithRetry().then(({ data }: any) => {
          if (data) {
            const accepted: string[] = [];
            const requests: FriendRequestItem[] = [];
            data.forEach((r: any) => {
              if (r.status === 'friends') {
                accepted.push(r.user_id === currentUser.id ? r.target_user_id : r.user_id);
              } else if (r.status === 'pending') {
                if (r.target_user_id === currentUser.id) requests.push({ userId: r.user_id, direction: 'incoming' });
                if (r.user_id === currentUser.id) requests.push({ userId: r.target_user_id, direction: 'outgoing' });
              }
            });
            setAcceptedFriendIds(accepted);
            setFriendRequests(requests);
          }
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); supabase.removeChannel(dmChannel); supabase.removeChannel(relChannel); };
  }, [currentUser]);

  // ── Streak'e Bağlı Görev Senkronizasyonu ──
  useEffect(() => {
     if (streakCount > 0) {
        setTasks(prev => {
           let changed = false;
           const next = prev.map(t => {
              if (t.id === 'w1' && t.current !== Math.min(streakCount, t.target)) {
                 changed = true;
                 return { ...t, current: Math.min(streakCount, t.target) };
              }
              if (t.id === 'w8' && t.current !== Math.min(streakCount, t.target)) {
                 changed = true;
                 return { ...t, current: Math.min(streakCount, t.target) };
              }
              return t;
           });
           if (changed) {
              syncTasksToDb(next);
           }
           return changed ? next : prev;
        });
     }
  }, [streakCount, syncTasksToDb]);

  // ── XP Bazlı Seviye (Level) Hesaplama Modülü ──────────────────────────────
  const { level: currentLevel, baseXp: currentLevelBaseXp, nextXp: nextLevelXp } = useMemo(() => {
    let level = 1;
    let baseXp = 0;
    let nextXp = GAME_CONFIG.xp.levelBaseThreshold;

    while (xpBalance >= nextXp && level < GAME_CONFIG.levelSystem.maxLevel) {
      baseXp = nextXp;
      level++;
      nextXp += GAME_CONFIG.xp.levelBaseThreshold + (level - 1) * GAME_CONFIG.xp.levelIncrementPerLevel;
    }
    return { level, baseXp, nextXp };
  }, [xpBalance]);

  // Açık özellikler listesini oluştur
  const unlockedFeatures = useMemo<AppFeature[]>(() => {
    const features: AppFeature[] = [...GAME_CONFIG.levelSystem.baseFeatures];
    for (let lvl = 2; lvl <= currentLevel; lvl++) {
      const unlock = GAME_CONFIG.levelSystem.unlocks[lvl as keyof typeof GAME_CONFIG.levelSystem.unlocks];
      if (unlock) features.push(unlock.id as AppFeature);
    }
    return features;
  }, [currentLevel]);

  const isFeatureUnlocked = useCallback((feature: AppFeature) => {
    return unlockedFeatures.includes(feature);
  }, [unlockedFeatures]);

  const levelInfo = useMemo<LevelInfo>(() => {
    const safeTitleIndex = Math.min(currentLevel - 1, LEVEL_TITLES.length - 1);
    const isMaxLevel = currentLevel >= GAME_CONFIG.levelSystem.maxLevel;
    const xpInCurrentLevel = xpBalance - currentLevelBaseXp;
    const xpNeededForNext = nextLevelXp - currentLevelBaseXp;
    
    return {
      level: currentLevel,
      currentXp: xpBalance,
      nextLevelXp: nextLevelXp,
      progress: isMaxLevel ? 1 : Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNext)), 
      totalXp: xpBalance,
      title: LEVEL_TITLES[safeTitleIndex],
    };
  }, [currentLevel, xpBalance, nextLevelXp, currentLevelBaseXp]);
  // ──────────────────────────────────────────────────────────────────────────

  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const currentProfileAppearance = useMemo(() => {
    const titleItem = getStoreItem(equippedStoreItems.titleId);
    const avatarItem = getStoreItem(equippedStoreItems.avatarId);
    const frameItem = getStoreItem(equippedStoreItems.frameId);
    const bgItem = getStoreItem(equippedStoreItems.backgroundId);
    const badgeItem = getStoreItem(equippedStoreItems.badgeId);
    const entryItem = getStoreItem(equippedStoreItems.entryEffectId);
    const themeItem = getStoreItem(equippedStoreItems.themeId);
    const msgItem = getStoreItem(equippedStoreItems.messageStyleId);
    const bannerItem = getStoreItem(equippedStoreItems.bannerId);

    return {
      title: titleItem?.name ?? "Yükselen Analist",
      avatar: avatarItem?.previewText ?? "G",
      frameColor: frameItem?.color ?? "#14b8a6",
      backgroundName: bgItem?.name ?? "Varsayılan",
      badgeText: badgeItem?.previewText ?? "—",
      entryEffectName: entryItem?.name ?? "Efektsiz",
      themeName: themeItem?.name ?? "Varsayılan Tema",
      themeColor: themeItem?.color ?? "#14b8a6",
      themeAppBgColor: themeItem?.appBgColor ?? "#f8fafc",
      messageStyleName: msgItem?.name ?? "Klasik",
      bannerColor: bannerItem?.color ?? null,
    };
  }, [equippedStoreItems]);

  const purchaseStoreItem: AppDataContextType["purchaseStoreItem"] = (itemId) => {
    const item = getStoreItem(itemId);

    if (!item) {
      return {
        ok: false,
        title: "Mağaza",
        message: "Ürün bulunamadı.",
        type: "error",
      };
    }

    if (ownedStoreItemIds.includes(itemId)) {
      return {
        ok: false,
        title: "Mağaza",
        message: "Bu ürün zaten sende var.",
        type: "error",
      };
    }

    if (kpBalance < item.priceKp) {
      return {
        ok: false,
        title: "Mağaza",
        message: "Yeterli KP bakiyen yok.",
        type: "error",
      };
    }

    spendKp(item.priceKp, "store_purchase", `Mağaza: ${item.name} satın alındı`);

    const nextOwned = [...ownedStoreItemIds, itemId];
    setOwnedStoreItemIds(nextOwned);

    if (currentUser) {
      (supabase as any).from("profiles").update({ owned_store_items: nextOwned }).eq("id", currentUser.id).then(({ error }: any) => {
        if (error) console.error("SUPABASE SATIN ALMA YAZMA HATASI:", error);
      });
    }

    return {
      ok: true,
      title: "Satın Alındı",
      message: `${item.name} hesabına eklendi.`,
      type: "success",
    };
  };

  const equipStoreItem: AppDataContextType["equipStoreItem"] = (itemId) => {
    const item = getStoreItem(itemId);

    if (!item) {
      return {
        ok: false,
        title: "Profil",
        message: "Ürün bulunamadı.",
        type: "error",
      };
    }

    if (!ownedStoreItemIds.includes(itemId)) {
      return {
        ok: false,
        title: "Profil",
        message: "Bu ürün önce mağazadan alınmalı.",
        type: "error",
      };
    }

    const nextEquipped = { ...equippedStoreItems };
    if (item.category === "title") nextEquipped.titleId = itemId;
    else if (item.category === "avatar") nextEquipped.avatarId = itemId;
    else if (item.category === "frame") nextEquipped.frameId = itemId;
    else if (item.category === "background") nextEquipped.backgroundId = itemId;
    else if (item.category === "badge") nextEquipped.badgeId = itemId;
    else if (item.category === "entry_effect") nextEquipped.entryEffectId = itemId;
    else if (item.category === "theme") nextEquipped.themeId = itemId;
    else if (item.category === "message_style") nextEquipped.messageStyleId = itemId;
    else if (item.category === "banner") nextEquipped.bannerId = itemId;

    setEquippedStoreItems(nextEquipped);

    if (currentUser) {
      (supabase as any).from("profiles").update({ equipped_store_items: nextEquipped }).eq("id", currentUser.id).then(({ error }: any) => {
        if (error) console.error("SUPABASE KUŞANMA YAZMA HATASI:", error);
      });
    }

    return {
      ok: true,
      title: "Profil Güncellendi",
      message: `${item.name} kullanıma alındı.`,
      type: "success",
    };
  };

  const setCurrentProfileTitle = (value: string) => {
    const target = storeCatalogSeed.find(
      (item) => item.category === "title" && item.name === value
    );
    if (target && ownedStoreItemIds.includes(target.id)) {
      const nextEquipped = { ...equippedStoreItems, titleId: target.id };
      setEquippedStoreItems(nextEquipped);
      if (currentUser) {
        (supabase as any).from("profiles").update({ equipped_store_items: nextEquipped }).eq("id", currentUser.id).then(({ error }: any) => {
          if (error) console.error("Profil başlık hatası:", error);
        });
      }
    }
  };

  const setCurrentProfileAvatar = (value: string) => {
    const target = storeCatalogSeed.find(
      (item) => item.category === "avatar" && item.previewText === value
    );
    if (target && ownedStoreItemIds.includes(target.id)) {
      const nextEquipped = { ...equippedStoreItems, avatarId: target.id };
      setEquippedStoreItems(nextEquipped);
      if (currentUser) {
        (supabase as any).from("profiles").update({ equipped_store_items: nextEquipped }).eq("id", currentUser.id).then(({ error }: any) => {
          if (error) console.error("Profil avatar hatası:", error);
        });
      }
    }
  };

  const setCurrentProfileFrameColor = (value: string) => {
    const target = storeCatalogSeed.find(
      (item) => item.category === "frame" && item.color === value
    );
    if (target && ownedStoreItemIds.includes(target.id)) {
      const nextEquipped = { ...equippedStoreItems, frameId: target.id };
      setEquippedStoreItems(nextEquipped);
      if (currentUser) {
        (supabase as any).from("profiles").update({ equipped_store_items: nextEquipped }).eq("id", currentUser.id).then(({ error }: any) => {
          if (error) console.error("Profil çerçeve hatası:", error);
        });
      }
    }
  };

  const placeCoupon: AppDataContextType["placeCoupon"] = async ({
    selections,
    stake,
    totalOdds,
  }) => {
    const validStake = Math.floor(stake); // Tam sayı garantisi

    if (selections.length === 0) {
      return {
        ok: false,
        title: "Kupon",
        message: "Önce en az 1 seçim eklemelisin.",
        type: "error",
      };
    }

    if (!Number.isFinite(validStake) || validStake <= 0) {
      return {
        ok: false,
        title: "Kupon",
        message: "Geçerli bir TP tutarı girmelisin.",
        type: "error",
      };
    }

    if (validStake > tpBalance) {
      return {
        ok: false,
        title: "Kupon",
        message: "Yeterli TP bakiyen yok.",
        type: "error",
      };
    }

    // Bug 3 fix: Tek kupona yatırılabilecek maksimum TP sınırı.
    // Düşük bakiyeli kullanıcılara (lowBalanceThreshold altı) esneklik tanınır.
    const maxAllowedStake =
      tpBalance >= GAME_CONFIG.prediction.lowBalanceThreshold
        ? Math.floor(tpBalance * GAME_CONFIG.prediction.maxStakeRatio)
        : tpBalance;

    if (validStake > maxAllowedStake) {
      return {
        ok: false,
        title: "Kupon",
        message: `Tek bir kupona en fazla ${maxAllowedStake} TP yatırabilirsin (%${Math.round(GAME_CONFIG.prediction.maxStakeRatio * 100)} kuralı).`,
        type: "error",
      };
    }

    // ── Süresi dolmuş tahmin kontrolü ──
    for (const sel of selections) {
      const q = questions.find((x) => x.id === sel.predictionId);
      if (!q) {
        return { ok: false, title: "Hata", message: `"${sel.title}" bulunamadı.`, type: "error" };
      }
      if (q.status !== "open" || Date.now() >= q.closesAt) {
        return { 
          ok: false, 
          title: "Süresi Dolmuş Tahmin", 
          message: `"${sel.title}" tahmini bahse kapandı. Lütfen kupondan çıkarın.`, 
          type: "error" 
        };
      }
    }

    // Parimutuel motora bağlama ve hacim enjekte etme
    try {
      if (selections.length === 1) {
        const sel = selections[0];
        const stakeRes = await placeStake(sel.predictionId, sel.choice, validStake);
        if (!stakeRes.ok) {
          return { ok: false, title: "Tahmin İşlemi", message: stakeRes.message, type: "error" };
        }
      } else {
        const spent = spendTp(validStake, "prediction_stake", `Kupon: ${validStake} TP yatırıldı`);
        if (!spent) {
          return { ok: false, title: "İşlem Başarısız", message: "Yeterli TP bulunamadı veya işlem gerçekleştirilemedi.", type: "error" };
        }
        selections.forEach((sel) => injectVolume(sel.predictionId, sel.choice, validStake));
      }
    } catch (error) {
      console.error("Tahmin Gönderim Hatası:", error);
      return { ok: false, title: "Sistem Hatası", message: "İşlem sırasında beklenmeyen bir hata oluştu.", type: "error" };
    }

    const mappedSelections: CouponSelectionRecord[] = selections.map((item, index) => ({
      id: `live-sel-${Date.now()}-${index}`,
      predictionId: item.predictionId,
      title: item.title,
      category: item.category,
      choice: item.choice,
      odd: item.odd,
    }));

    const newRecord: CouponRecord = {
      id: `live-coupon-${Date.now()}`,
      type: selections.length <= 1 ? "Tekli Tahmin" : "Kupon",
      status: "Aktif",
      playedAt: getNowLabel(),
      totalOdds,
      stake: validStake,
      maxWin: validStake * totalOdds,
      selections: mappedSelections,
    };

    if (currentUser) {
      const seasonId = wallet?.currentSeasonId || 1;
      (supabase as any).from('coupons').insert({
        user_id: currentUser.id,
        season_id: seasonId,
        type: newRecord.type,
        stake: newRecord.stake,
        total_odds: newRecord.totalOdds,
        max_win: newRecord.maxWin,
        status: newRecord.status,
        played_at: newRecord.playedAt,
        selections: newRecord.selections
      }).then();
    }

    setActiveCouponRecords((prev) => [newRecord, ...prev]);

    setTasks((prev) => {
      const next = prev.map((task) =>
        ["s1"].includes(task.id) ? { ...task, current: Math.min(task.current + 1, task.target) } : task
      );
      syncTasksToDb(next);
      return next;
    });

    return {
      ok: true,
      title: selections.length <= 1 ? "Tahmin Oynandı" : "Kupon Aktif",
      message: selections.length <= 1 ? "Tekli tahminin başarıyla onaylandı." : "Kupon aktif kayıtlara eklendi.",
      type: "success",
      tpDelta: -validStake
    };
  };

  const shareCouponToArena: AppDataContextType["shareCouponToArena"] = ({
    selections,
    stake,
    totalOdds,
    note,
  }) => {
    if (selections.length === 0) {
      return {
        ok: false,
        title: "Arena",
        message: "Paylaşmak için önce seçim eklemelisin.",
        type: "error",
      };
    }

    const newPost: ArenaPost = {
      id: `arena-post-${Date.now()}`,
      user: currentUser?.displayName || currentUser?.username || "Oyuncu",
      avatar: currentProfileAppearance.avatar,
      time: "Şimdi",
      note: note?.trim() || "Yeni kuponumu arena'da paylaştım.",
      selectionCount: selections.length,
      stake,
      totalOdds,
      maxWin: stake * totalOdds,
      selections: selections.map((item, index) => ({
        id: `arena-sel-${Date.now()}-${index}`,
        predictionId: item.predictionId,
        title: item.title,
        category: item.category,
        choice: item.choice,
        odd: item.odd,
      })),
    };

    if (currentUser) {
      (supabase as any).from("arena_posts").insert({
        user_id: currentUser.id,
        user_name: newPost.user,
        avatar: newPost.avatar,
        note: newPost.note,
        selection_count: newPost.selectionCount,
        stake: newPost.stake,
        total_odds: newPost.totalOdds,
        max_win: newPost.maxWin,
        selections: newPost.selections
      }).then(({ error }: any) => {
        if (error) console.error("ARENA PAYLAŞIM HATASI:", error);
      });
    }

    setArenaPosts((prev) => [newPost, ...prev]);

    setTasks((prev) => {
      const next = prev.map((task) =>
        ["d3", "w3", "s4"].includes(task.id) ? { ...task, current: Math.min(task.current + 1, task.target) } : task
      );
      syncTasksToDb(next);
      return next;
    });

    return {
      ok: true,
      title: "Arena Paylaşımı",
      message: "Kupon arena akışına eklendi.",
      type: "success",
    };
  };

  const claimTask: AppDataContextType["claimTask"] = (taskId) => {
    const targetTask = tasks.find((task) => task.id === taskId);

    if (!targetTask) {
      return {
        ok: false,
        title: "Görev",
        message: "Görev bulunamadı.",
        type: "error",
      };
    }

    if (targetTask.claimed) {
      return {
        ok: false,
        title: "Görev",
        message: "Bu görev ödülü zaten toplandı.",
        type: "error",
      };
    }

    if (targetTask.current < targetTask.target) {
      return {
        ok: false,
        title: "Görev",
        message: "Bu görev henüz tamamlanmadı.",
        type: "error",
      };
    }

    if (targetTask.isPremium && !hasPass) {
      return {
        ok: false,
        title: "Premium Görev",
        message: "Bu görevi tamamlamak için Bilebilirsin Pass satın almalısın.",
        type: "error",
      };
    }

    const xpGain =
      targetTask.period === "seasonal"
        ? GAME_CONFIG.tasks.seasonalTaskXp
        : targetTask.period === "weekly"
        ? GAME_CONFIG.tasks.weeklyTaskXp
        : GAME_CONFIG.tasks.dailyTaskXp;

    const newXp = xpBalance + xpGain;

    let calcLevel = 1;
    let nextXp = GAME_CONFIG.xp.levelBaseThreshold;
    while (newXp >= nextXp && calcLevel < GAME_CONFIG.levelSystem.maxLevel) {
      calcLevel++;
      nextXp += GAME_CONFIG.xp.levelBaseThreshold + (calcLevel - 1) * GAME_CONFIG.xp.levelIncrementPerLevel;
    }

    if (calcLevel > currentLevel) {
      const unlockedFeature = GAME_CONFIG.levelSystem.unlocks[calcLevel as keyof typeof GAME_CONFIG.levelSystem.unlocks];
      if (unlockedFeature) {
        setLevelUpData({
          level: calcLevel,
          featureName: unlockedFeature.name,
          featureDesc: unlockedFeature.description,
        });
      }
    }

    setTasks((prev) => {
      const next = prev.map((task) => {
        if (task.id === taskId) return { ...task, claimed: true };
        if (task.id === "w9" && targetTask.period === "weekly" && taskId !== "w9") {
          return { ...task, current: Math.min(task.current + 1, task.target) };
        }
        return task;
      });
      
      if (currentUser) {
         const claimedIds = next.filter(t => t.claimed).map(t => `${t.id}_${getTaskPeriodKey(t.period, wallet?.currentSeasonId || 1)}`);
         (supabase as any).from("profiles").update({ 
            xp_balance: newXp, 
            claimed_task_ids: claimedIds 
         }).eq("id", currentUser.id).then(({error}: any) => {
            if (error) console.error("Görev claim kaydetme hatası:", error);
         });
      }

      if (targetTask.period === "weekly" && taskId !== "w9") {
         syncTasksToDb(next);
      }
      return next;
    });
    addTp(targetTask.rewardTp, "task_reward", `Görev ödülü: ${targetTask.rewardTp} TP`);
    if (targetTask.rewardKp) {
      addKp(targetTask.rewardKp, "pass_reward", `Görev KP ödülü: ${targetTask.rewardKp} KP`);
    }
    
    setXpBalance(newXp);

    return {
      ok: true,
      title: "Görev Ödülü",
      message: "Görev ödülü hesabına eklendi.",
      type: "success",
      tpDelta: targetTask.rewardTp,
      kpDelta: targetTask.rewardKp,
      xpDelta: xpGain,
    };
  };

  const claimWinXp: AppDataContextType["claimWinXp"] = (recordId) => {
    const record = activeCouponRecords.find((item) => item.id === recordId);

    if (!record) {
      return {
        ok: false,
        title: "Kazanç",
        message: "Kayıt bulunamadı.",
        type: "error",
      };
    }

    if (record.status !== "Kazandı") {
      return {
        ok: false,
        title: "Kazanç",
        message: "Sadece kazanılmış kayıtlardan XP alınabilir.",
        type: "error",
      };
    }

    if (processedWinIds.includes(recordId)) {
      return {
        ok: false,
        title: "Kazanç",
        message: "Bu kaydın XP’si zaten işlendi.",
        type: "error",
      };
    }

    const xpGain =
      record.type === "Kupon"
        ? GAME_CONFIG.xp.couponWin
        : GAME_CONFIG.xp.singlePredictionWin;

    const newXp = xpBalance + xpGain;

    let calcLevel = 1;
    let nextXp = GAME_CONFIG.xp.levelBaseThreshold;
    while (newXp >= nextXp && calcLevel < GAME_CONFIG.levelSystem.maxLevel) {
      calcLevel++;
      nextXp += GAME_CONFIG.xp.levelBaseThreshold + (calcLevel - 1) * GAME_CONFIG.xp.levelIncrementPerLevel;
    }

    if (calcLevel > currentLevel) {
      const unlockedFeature = GAME_CONFIG.levelSystem.unlocks[calcLevel as keyof typeof GAME_CONFIG.levelSystem.unlocks];
      if (unlockedFeature) {
        setLevelUpData({
          level: calcLevel,
          featureName: unlockedFeature.name,
          featureDesc: unlockedFeature.description,
        });
      }
    }

    setXpBalance(newXp);

    setTasks((prev) => {
      let changed = false;
      const next = prev.map((task) => {
        if (["d2", "w2"].includes(task.id) && task.current < task.target) {
           changed = true;
           return { ...task, current: Math.min(task.current + 1, task.target) };
        }
        return task;
      });
      if (changed) {
         syncTasksToDb(next);
      }
      return changed ? next : prev;
    });
    
    setProcessedWinIds((prev) => {
      const next = [...prev, recordId];
      if (currentUser) {
        (supabase as any).from("profiles").update({ processed_win_ids: next, xp_balance: newXp }).eq("id", currentUser.id).then();
      }
      return next;
    });

    return {
      ok: true,
      title: "Kazanan Tahmin",
      message: "Kazanan kaydın XP ödülü işlendi.",
      type: "success",
      xpDelta: xpGain,
    };
  };

  const purchasePass: AppDataContextType["purchasePass"] = () => {
    if (hasPass) {
      return {
        ok: false,
        title: "Bilebilirsin Pass",
        message: "Pass zaten aktif.",
        type: "info",
      };
    }

    setHasPass(true);
    if (currentUser) (supabase as any).from("profiles").update({ has_pass: true }).eq("id", currentUser.id).then();
    const bonus = GAME_CONFIG.pass.purchaseBonusTp;
    addTp(bonus, "task_reward", `Pass aktivasyon bonusu: ${bonus} TP`);

    setTasks(prev => {
       const next = prev.map(t => t.isPremium ? { ...t, current: t.target } : t);
       syncTasksToDb(next);
       return next;
    });

    return {
      ok: true,
      title: "Pass Aktif",
      message: `Premium pass aktifleştirildi. ${bonus} TP bonus eklendi.`,
      type: "success",
      tpDelta: bonus,
    };
  };

  const claimBonus: AppDataContextType["claimBonus"] = (bonusId) => {
    if (claimedBonusIds.includes(bonusId)) {
      return {
        ok: false,
        title: "Bonus",
        message: "Bu bonus zaten toplandı.",
        type: "error",
      };
    }

    const bonusMap: Record<string, { label: string; tp: number }> = {
      profileComplete: { label: "Profil Tamamlama", tp: GAME_CONFIG.bonusActions.profileComplete },
      firstCoupon: { label: "İlk Kupon", tp: GAME_CONFIG.bonusActions.firstCoupon },
      weeklyStreak: { label: "Haftalık Streak", tp: GAME_CONFIG.bonusActions.weeklyStreak },
      friendInvite: { label: "Arkadaş Daveti", tp: GAME_CONFIG.bonusActions.friendInvite },
      firstWin: { label: "İlk Kazanç", tp: GAME_CONFIG.bonusActions.firstWin },
    };

    const entry = bonusMap[bonusId];
    if (!entry) {
      return {
        ok: false,
        title: "Bonus",
        message: "Bilinmeyen bonus.",
        type: "error",
      };
    }

    setClaimedBonusIds((prev) => {
       const next = [...prev, bonusId];
       if (currentUser) (supabase as any).from("profiles").update({ claimed_bonus_ids: next }).eq("id", currentUser.id).then();
       return next;
    });
    addTp(entry.tp, "task_reward", `Bonus: ${entry.label} — ${entry.tp} TP`);

    return {
      ok: true,
      title: "Bonus Toplandı",
      message: `${entry.label} bonusu toplandı.`,
      type: "success",
      tpDelta: entry.tp,
    };
  };

  const claimPassDay: AppDataContextType["claimPassDay"] = (day) => {
    const reward = passDaysSeed.find((item) => item.day === day);

    if (!reward) {
      return {
        ok: false,
        title: "Bilebilirsin Pass",
        message: "Gün bulunamadı.",
        type: "error",
      };
    }

    if (day > streakCount) {
      return {
        ok: false,
        title: "Bilebilirsin Pass",
        message: "Bu gün henüz açılmadı.",
        type: "error",
      };
    }

    if (claimedPassDays.includes(day)) {
      return {
        ok: false,
        title: "Bilebilirsin Pass",
        message: "Bu günün ödülü zaten toplandı.",
        type: "error",
      };
    }

    const totalKp = hasPass ? reward.freeKp + reward.premiumKp : reward.freeKp;

    setClaimedPassDays((prev) => {
       const next = [...prev, day];
       if (currentUser) (supabase as any).from("profiles").update({ claimed_pass_days: next }).eq("id", currentUser.id).then();
       return next;
    });
    addKp(totalKp, "pass_reward", `Pass gün ${day} ödülü: ${totalKp} KP`);

    return {
      ok: true,
      title: "Bilebilirsin Pass",
      message: hasPass
        ? "Ücretsiz ve premium ödüller toplandı."
        : "Ücretsiz ödül toplandı.",
      type: "success",
      kpDelta: totalKp,
    };
  };

  const createChatRoom: AppDataContextType["createChatRoom"] = ({
    name,
    desc,
    vibe,
  }) => {
    if (!name.trim() || !desc.trim() || !vibe.trim()) {
      return {
        ok: false,
        title: "Sohbet Odası",
        message: "Oda adı, açıklama ve hava seçimi zorunlu.",
        type: "error",
      };
    }

    if (kpBalance < GAME_CONFIG.chat.roomCreationCostKp) {
      return {
        ok: false,
        title: "Sohbet Odası",
        message: `Oda oluşturmak için en az ${GAME_CONFIG.chat.roomCreationCostKp} KP gerekli.`,
        type: "error",
      };
    }

    if (chatRooms.some((room) => room.ownerUserId === currentUser?.id)) {
      return {
        ok: false,
        title: "Sohbet Odası",
        message: "Zaten sana ait bir oda var.",
        type: "error",
      };
    }

    spendKp(GAME_CONFIG.chat.roomCreationCostKp, "chat_room_create", `Sohbet odası: ${GAME_CONFIG.chat.roomCreationCostKp} KP`);

    if (currentUser) {
      (supabase as any).from("chat_rooms").insert({
        name: name.trim(),
        description: desc.trim(),
        vibe: vibe.trim(),
        owner_user_id: currentUser.id,
        online_count: 1
      } as any).select().single().then(({ data }: any) => {
        if (data) {
          const d = data as any;
          (supabase as any).from("chat_messages").insert({
            room_id: d.id,
            user_id: currentUser.id,
            user_name: currentUser.displayName || currentUser.username || "Oyuncu",
            text: "Oda oluşturuldu. İlk mesaj burada başlar.",
            is_announcement: false
          } as any).then();
        }
      });
    }

    return {
      ok: true,
      title: "Sohbet Odası",
      message: `Oda oluşturuldu. ${GAME_CONFIG.chat.roomCreationCostKp} KP harcandı.`,
      type: "success",
    };
  };

  const followUser: AppDataContextType["followUser"] = (userId) => {
    if (userId === currentUser?.id) {
      return { ok: false, title: "Takip", message: "Kendini takip edemezsin.", type: "error" };
    }
    if (followingIds.includes(userId)) {
      return { ok: false, title: "Takip", message: "Zaten takip ediyorsun.", type: "info" };
    }
    setFollowingIds((prev) => [...prev, userId]);
    return { ok: true, title: "Takip", message: "Kullanıcı takip listene eklendi.", type: "success" };
  };

  const unfollowUser = (userId: string) => {
    setFollowingIds((prev) => prev.filter((id) => id !== userId));
  };

  const sendGlobalMessage: AppDataContextType["sendGlobalMessage"] = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, title: "Mesaj", message: "Boş mesaj gönderilemez.", type: "error" };
    }

    const cooldownMs = GAME_CONFIG.chat.globalCooldownSeconds * 1000;
    const now = Date.now();
    if (now - lastGlobalMessageAt < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - lastGlobalMessageAt)) / 1000);
      return {
        ok: false,
        title: "Bekleme Süresi",
        message: `${remaining} saniye beklemen gerekiyor.`,
        type: "error",
      };
    }

    setLastGlobalMessageAt(now);
    
    // Anında UI Güncellemesi (Optimistic UI)
    const msg: ChatMessage = {
      id: `tmp-${now}`,
      user: currentUser?.displayName || currentUser?.username || "Oyuncu",
      text: trimmed,
      time: "Şimdi",
      createdAt: now,
      mine: true,
      isAnnouncement: false
    };
    setGlobalMessages(prev => [...prev, msg].slice(-100));

    if (currentUser) {
      (supabase as any).from("chat_messages").insert({
        room_id: null,
        user_id: currentUser.id,
        user_name: currentUser.displayName || currentUser.username || "Oyuncu",
        text: trimmed,
        is_announcement: false
      } as any).then();
    }

    setTasks((prev) => {
      const next = prev.map((task) =>
        ["d4", "w4"].includes(task.id) ? { ...task, current: Math.min(task.current + 1, task.target) } : task
      );
      syncTasksToDb(next);
      return next;
    });

    return { ok: true, title: "Mesaj Gönderildi", message: "", type: "success" };
  };

  const sendGlobalAnnouncement: AppDataContextType["sendGlobalAnnouncement"] = (text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, title: "Duyuru", message: "Boş duyuru gönderilemez.", type: "error" };
    }

    const cost = GAME_CONFIG.chat.announcementCostKp;
    if (kpBalance < cost) {
      return {
        ok: false,
        title: "Yetersiz KP",
        message: `Duyuru için ${cost} KP gerekiyor. Bakiyen: ${kpBalance} KP.`,
        type: "error",
      };
    }

    const now = Date.now();
    spendKp(cost, "global_announcement", "Genel sohbet duyurusu");

    // Anında UI Güncellemesi
    const msg: ChatMessage = {
      id: `tmp-${now}`,
      user: currentUser?.displayName || currentUser?.username || "Oyuncu",
      text: trimmed,
      time: "Şimdi",
      createdAt: now,
      mine: true,
      isAnnouncement: true
    };
    setGlobalMessages(prev => [...prev, msg].slice(-100));

    if (currentUser) {
      (supabase as any).from("chat_messages").insert({
        room_id: null,
        user_id: currentUser.id,
        user_name: currentUser.displayName || currentUser.username || "Oyuncu",
        text: trimmed,
        is_announcement: true
      } as any).then();
    }

    return {
      ok: true,
      title: "Duyuru Yayınlandı",
      message: `${cost} KP harcandı.`,
      type: "success",
      kpDelta: -cost,
    };
  };

  const sendRoomMessage: AppDataContextType["sendRoomMessage"] = (roomId, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { ok: false, title: "Mesaj", message: "Boş mesaj gönderilemez.", type: "error" };
    }

    const cooldownMs = GAME_CONFIG.chat.categoryCooldownSeconds * 1000;
    const now = Date.now();
    const lastSent = lastRoomMessageAt[roomId] ?? 0;

    if (now - lastSent < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - lastSent)) / 1000);
      return {
        ok: false,
        title: "Bekleme Süresi",
        message: `${remaining} saniye beklemelisin.`,
        type: "error",
      };
    }

    setLastRoomMessageAt((prev) => ({ ...prev, [roomId]: now }));

    // Anında UI Güncellemesi
    const msg: ChatMessage = {
      id: `tmp-${now}`,
      user: currentUser?.displayName || currentUser?.username || "Oyuncu",
      text: trimmed,
      time: "Şimdi",
      createdAt: now,
      mine: true,
      isAnnouncement: false
    };
    setChatRooms(prev => prev.map(room => room.id === roomId ? { ...room, messages: [...room.messages, msg].slice(-100) } : room));

    if (currentUser) {
      (supabase as any).from("chat_messages").insert({
        room_id: roomId,
        user_id: currentUser.id,
        user_name: currentUser.displayName || currentUser.username || "Oyuncu",
        text: trimmed,
        is_announcement: false
      } as any).then();
    }

    return { ok: true, title: "Mesaj Gönderildi", message: "", type: "success" };
  };

  const sendDirectMessage: AppDataContextType["sendDirectMessage"] = (userId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    const msg: ChatMessage = {
      id: `tmp-${now}`,
      user: currentUser?.displayName || currentUser?.username || "Oyuncu",
      text: trimmed,
      time: "Şimdi",
      createdAt: now,
      mine: true,
      isAnnouncement: false
    };
    setDmThreads(prev => {
      const existing = prev.find(t => t.userId === userId);
      if (existing) return prev.map(t => t.userId === userId ? { ...t, messages: [...t.messages, msg] } : t);
      return [...prev, { userId, messages: [msg] }];
    });

    if (currentUser) {
      (supabase as any).from("direct_messages").insert({
        sender_id: currentUser.id,
        receiver_id: userId,
        sender_name: currentUser.displayName || currentUser.username || "Oyuncu",
        text: trimmed
      }).then();
    }
  };

  const sendFriendRequest: AppDataContextType["sendFriendRequest"] = (userId) => {
    if (userId === currentUser?.id) {
      return {
        ok: false,
        title: "Arkadaş",
        message: "Kendine istek gönderemezsin.",
        type: "error",
      };
    }

    if (acceptedFriendIds.includes(userId)) {
      return {
        ok: false,
        title: "Arkadaş",
        message: "Zaten arkadaşsınız.",
        type: "error",
      };
    }

    if (friendRequests.some((item) => item.userId === userId)) {
      return {
        ok: false,
        title: "Arkadaş",
        message: "Bu kullanıcı için zaten bir istek var.",
        type: "error",
      };
    }

    setFriendRequests((prev) => [...prev, { userId, direction: "outgoing" }]);

    if (currentUser) {
      (supabase as any).from("relationships").insert({
        user_id: currentUser.id,
        target_user_id: userId,
        status: "pending"
      }).then();
    }

    return {
      ok: true,
      title: "Arkadaş İsteği",
      message: "Arkadaş isteği gönderildi.",
      type: "success",
    };
  };

  const sendFriendRequestByInternalId: AppDataContextType["sendFriendRequestByInternalId"] = async (
    internalId
  ) => {
    const normalized = internalId.trim().toLowerCase();

    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id")
      .ilike("id", `${normalized}%`)
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        title: "Arkadaş",
        message: "Bu ID ile kullanıcı bulunamadı.",
        type: "error",
      };
    }

    return sendFriendRequest(data.id);
  };

  const acceptFriendRequest = (userId: string) => {
    setFriendRequests((prev) =>
      prev.filter((item) => !(item.userId === userId && item.direction === "incoming"))
    );

    setAcceptedFriendIds((prev) =>
      prev.includes(userId) ? prev : [...prev, userId]
    );

    if (currentUser) {
      (supabase as any).from("relationships").update({ status: "friends" })
        .match({ user_id: userId, target_user_id: currentUser.id }).then();
    }
  };

  const declineFriendRequest = (userId: string) => {
    setFriendRequests((prev) =>
      prev.filter((item) => !(item.userId === userId && item.direction === "incoming"))
    );

    if (currentUser) {
      (supabase as any).from("relationships").delete()
        .match({ user_id: userId, target_user_id: currentUser.id }).then();
    }
  };

  const markGeneralChatRead = () => {
    setUnreadGeneralCount(0);
  };

  const markRoomRead = (roomId: string) => {
    setRoomUnreadCounts((prev) => ({
      ...prev,
      [roomId]: 0,
    }));
  };

  const markDmRead = (userId: string) => {
    setUnreadDmCounts((prev) => {
      if (!prev[userId]) return prev;
      return { ...prev, [userId]: 0 };
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );
    (supabase as any).from("notifications").update({ is_read: true }).eq("id", id).then();
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );
    if (currentUser) {
       (supabase as any).from("notifications").update({ is_read: true }).eq("user_id", currentUser.id).then();
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    (supabase as any).from("notifications").delete().eq("id", id).then();
  };

  const addNotification = (notif: Omit<AppNotification, "id" | "createdAt" | "isRead">) => {
    if (currentUser) {
      (supabase as any).from("notifications").insert({
        user_id: currentUser.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        target: notif.target
      }).then();
    }
  };

  // ── Kariyer İstatistikleri (önceki sezon mock baseline'ı) ──────────────────
  const careerStats = useMemo(() => ({
    totalSeasons: 1,
    allTimeQuestions: 0,
    allTimeStaked: 0,
    allTimeWon: 0,
    bestWinRate: 0,
    bestSeasonKp: 0,
  }), []);

  // ── KP Satın Alma Sistemi ──────────────────────────────────────────────────

  const purchaseKpPackage: AppDataContextType["purchaseKpPackage"] = (packageId) => {
    const pkg = GAME_CONFIG.kpStore.packages.find((p) => p.id === packageId);
    if (!pkg) {
      return { ok: false, title: "Hata", message: "Paket bulunamadı.", type: "error" };
    }

    const now = Date.now();
    const todayKey = new Date(now).toISOString().slice(0, 10);

    const todayRecords = kpPurchaseRecords.filter(
      (r) => r.status === "completed" && new Date(r.purchasedAt).toISOString().slice(0, 10) === todayKey
    );

    const flags: FraudFlag[] = [];

    // Fraud kontrol 1: çok hızlı ardışık satın alma
    const lastCompleted = kpPurchaseRecords
      .filter((r) => r.status === "completed")
      .sort((a, b) => b.purchasedAt - a.purchasedAt)[0];
    if (lastCompleted && now - lastCompleted.purchasedAt < GAME_CONFIG.kpStore.fraud.minPurchaseIntervalMs) {
      flags.push("rapid_purchase");
    }

    // Fraud kontrol 2: günlük alım adedi
    if (todayRecords.length >= GAME_CONFIG.kpStore.fraud.maxPurchasesPerDay) {
      flags.push("daily_limit_exceeded");
    }

    // Fraud kontrol 3: günlük KP edinim üst sınırı
    const todayKp = todayRecords.reduce((sum, r) => sum + r.kpGranted, 0);
    const kpGranted = pkg.kpBase + pkg.bonusKp;
    if (todayKp + kpGranted > GAME_CONFIG.kpStore.fraud.maxKpPerDay) {
      flags.push("daily_kp_cap_exceeded");
    }

    // Fraud kontrol 4: aynı gün aynı paket tekrarı
    const alreadyBoughtSameToday = todayRecords.some((r) => r.packageId === packageId);
    if (alreadyBoughtSameToday) {
      flags.push("duplicate_package");
    }

    const logId = `plog-${now}-${Math.random().toString(36).slice(2, 7)}`;

    const blockingFlags: FraudFlag[] = ["rapid_purchase", "daily_limit_exceeded", "daily_kp_cap_exceeded"];
    const isBlocked = flags.some((f) => blockingFlags.includes(f));

    if (isBlocked) {
      const log: PaymentLog = {
        id: logId,
        packageId,
        mockPaymentRef: `MOCK-${logId.toUpperCase()}`,
        attemptedAt: now,
        status: "failed",
        failureReason: flags[0],
      };
      const record: KpPurchaseRecord = {
        id: `kpur-${now}-${Math.random().toString(36).slice(2, 7)}`,
        packageId,
        kpGranted: 0,
        mockPriceTl: pkg.mockPriceTl,
        purchasedAt: now,
        status: "failed",
        isRefundEligible: false,
        fraudFlags: flags,
        paymentLogId: logId,
      };
      setPaymentLogs((prev) => [...prev, log]);
      setKpPurchaseRecords((prev) => [...prev, record]);

      const msgMap: Record<FraudFlag, string> = {
        rapid_purchase: `Son alımdan bu yana ${GAME_CONFIG.kpStore.fraud.minPurchaseIntervalMs / 1000} saniye geçmedi.`,
        daily_limit_exceeded: `Günlük ${GAME_CONFIG.kpStore.fraud.maxPurchasesPerDay} alım limitine ulaştın.`,
        daily_kp_cap_exceeded: `Bugünlük ${GAME_CONFIG.kpStore.fraud.maxKpPerDay} KP edinim sınırına ulaştın.`,
        duplicate_package: "Bu paketi bugün zaten satın aldın.",
      };
      return { ok: false, title: "İşlem Engellendi", message: msgMap[flags[0]], type: "error" };
    }

    const log: PaymentLog = {
      id: logId,
      packageId,
      mockPaymentRef: `MOCK-${logId.toUpperCase()}`,
      attemptedAt: now,
      completedAt: now,
      status: "success",
    };
    const record: KpPurchaseRecord = {
      id: `kpur-${now}-${Math.random().toString(36).slice(2, 7)}`,
      packageId,
      kpGranted,
      mockPriceTl: pkg.mockPriceTl,
      purchasedAt: now,
      status: "completed",
      isRefundEligible: true,
      fraudFlags: flags,
      paymentLogId: logId,
    };
    setPaymentLogs((prev) => [...prev, log]);
    setKpPurchaseRecords((prev) => [...prev, record]);
    addKp(kpGranted, "kp_purchase", `KP satın alma: ${pkg.label} (${kpGranted} KP)`);

    return {
      ok: true,
      title: "Satın Alma Başarılı",
      message: `${kpGranted} KP bakiyene eklendi.`,
      type: "success",
      kpDelta: kpGranted,
    };
  };

  const requestKpRefund: AppDataContextType["requestKpRefund"] = (recordId) => {
    const record = kpPurchaseRecords.find((r) => r.id === recordId);
    if (!record) {
      return { ok: false, title: "Hata", message: "Kayıt bulunamadı.", type: "error" };
    }
    if (record.status !== "completed") {
      return { ok: false, title: "İade Yapılamaz", message: "Bu alım zaten iade edilmiş veya başarısız.", type: "error" };
    }
    const now = Date.now();
    if (now - record.purchasedAt > GAME_CONFIG.kpStore.refund.eligibilityWindowMs) {
      return { ok: false, title: "İade Süresi Doldu", message: "İade için 24 saatlik pencere geçti.", type: "error" };
    }
    if (kpBalance < record.kpGranted) {
      return { ok: false, title: "Yetersiz KP", message: "İade için bakiyende yeterli KP yok.", type: "error" };
    }

    setKpPurchaseRecords((prev) =>
      prev.map((r) =>
        r.id === recordId
          ? { ...r, status: "refunded" as const, isRefundEligible: false, refundRequestedAt: now }
          : r
      )
    );
    // İade edilen KP'yi geri al
    // spendKp kullanmak yerine negatif bir log yazmak için addKp -amount kullanamayız;
    // mevcut spendKp fonksiyonu en doğru yol.
    // "store_purchase" tipi en uygun çıkış tipi; ileride "kp_refund" eklenebilir.
    spendKp(record.kpGranted, "store_purchase", `KP iade: ${record.packageId} (${record.kpGranted} KP geri alındı)`);

    return {
      ok: true,
      title: "İade Başarılı",
      message: `${record.kpGranted} KP bakiyenden düşüldü.`,
      type: "success",
      kpDelta: -record.kpGranted,
    };
  };

  const unlockPredictionAccess: AppDataContextType["unlockPredictionAccess"] = (questionId) => {
    const cost = GAME_CONFIG.prediction.openAccessCostKp;

    if (unlockedPredictionIds.includes(questionId)) {
      return {
        ok: true,
        title: "Erişim",
        message: "Bu tahmine zaten erişimin var.",
        type: "info",
      };
    }

    if (kpBalance < cost) {
      return {
        ok: false,
        title: "Yetersiz KP",
        message: `Erişmek için ${cost} KP gerekiyor. Bakiyen: ${kpBalance} KP.`,
        type: "error",
      };
    }

    spendKp(cost, "prediction_access", `Tahmin erişimi: ${cost} KP`);
    setUnlockedPredictionIds((prev) => {
       const next = [...prev, questionId];
       if (currentUser) (supabase as any).from("profiles").update({ unlocked_prediction_ids: next }).eq("id", currentUser.id).then();
       return next;
    });

    return {
      ok: true,
      title: "Erişim Açıldı",
      message: `${cost} KP harcandı. Tahmin detayı görüntülenebilir.`,
      type: "success",
      kpDelta: -cost,
    };
  };

  const incrementTaskProgress: AppDataContextType["incrementTaskProgress"] = useCallback((taskIds) => {
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((task) => {
        if (taskIds.includes(task.id) && task.current < task.target) {
          changed = true;
          return { ...task, current: Math.min(task.current + 1, task.target) };
        }
        return task;
      });
      if (changed) syncTasksToDb(next);
      return changed ? next : prev;
    });
  }, [syncTasksToDb]);

  const value: AppDataContextType = {
    tpBalance,
    kpBalance,
    ownInternalId: currentUser?.id?.slice(0, 8) ?? "BLB-0000",
    levelInfo,
    currentLevel,
    activeCouponRecords,
    arenaPosts,
    tasks,
    unreadGeneralCount,
    roomUnreadCounts,
    unreadDmCounts,
    processedWinIds,
    streakCount,
    hasPass,
    passDays: passDaysSeed,
    claimedPassDays,
    chatRooms,
    dmThreads,
    acceptedFriendIds,
    friendRequests,
    followingIds,
    followUser,
    unfollowUser,
    globalMessages,
    lastRoomMessageAt,
    lastGlobalMessageAt,
    sendGlobalMessage,
    sendGlobalAnnouncement,
    notifications,
    unreadNotificationCount,
    storeCatalog: storeCatalogSeed,
    ownedStoreItemIds,
    equippedStoreItems,
    currentProfileAppearance,
    careerStats,
    kpPurchaseRecords,
    paymentLogs,
    purchaseKpPackage,
    requestKpRefund,
    unlockedPredictionIds,
    unlockPredictionAccess,
    setCurrentProfileTitle,
    setCurrentProfileAvatar,
    setCurrentProfileFrameColor,
    purchaseStoreItem,
    equipStoreItem,
    placeCoupon,
    shareCouponToArena,
    claimedBonusIds,
    claimTask,
    claimWinXp,
    claimPassDay,
    purchasePass,
    claimBonus,
    createChatRoom,
    sendRoomMessage,
    sendDirectMessage,
    sendFriendRequest,
    sendFriendRequestByInternalId,
    acceptFriendRequest,
    declineFriendRequest,
    markGeneralChatRead,
    markRoomRead,
    markDmRead,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    addNotification,
    isGlobalChatPanelOpen,
    openGlobalChatPanel: () => setIsGlobalChatPanelOpen(true),
    closeGlobalChatPanel: () => setIsGlobalChatPanelOpen(false),
    incrementTaskProgress,
    isFeatureUnlocked,
    unlockedFeatures,
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {/* Seviye Atlama Modalı (Tüm uygulamanın üzerine biner) */}
      {levelUpData && (
        <LevelUpOverlay
          level={levelUpData.level}
          featureName={levelUpData.featureName}
          featureDesc={levelUpData.featureDesc}
          onClose={() => setLevelUpData(null)}
        />
      )}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}

// ── Route Guard Hook'u (Diğer sayfalarda güvenliği sağlamak için) ────────
export function useFeatureGuard(feature: AppFeature) {
  const { isFeatureUnlocked } = useAppData();
  const { showFeedback } = useUIFeedback();
  const router = useRouter();

  useEffect(() => {
    // Eğer özellik kilitliyse, geri at ve uyarı ver
    if (!isFeatureUnlocked(feature)) {
      showFeedback({
        type: "error",
        title: "Kilitli Özellik",
        message: "Bu bölüm henüz seviyene uygun değil. Görev tamamlayarak seviye atla!",
      });
      
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
      } else {
        router.replace("/");
      }
    }
  }, [feature, isFeatureUnlocked]);
}

// ── Seviye Atlama Görsel Overlay'i (Animasyonlu) ──────────────────────────
function LevelUpOverlay({ level, featureName, featureDesc, onClose }: { level: number, featureName: string, featureDesc: string, onClose: () => void }) {
  const scale = React.useRef(new Animated.Value(0.8)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start(onClose);
  };

  const { width: SCREEN_WIDTH } = Dimensions.get("window");

  return (
    <Modal transparent animationType="none" visible>
      <View style={{ flex: 1, backgroundColor: 'rgba(11, 16, 32, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <ConfettiCannon count={200} origin={{ x: SCREEN_WIDTH / 2, y: -50 }} fallSpeed={3000} fadeOut />
        <Animated.View style={{ 
          backgroundColor: '#111a33', 
          borderRadius: 24, 
          padding: 24, 
          width: '100%', 
          maxWidth: 340, 
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#14b8a6',
          opacity,
          transform: [{ scale }]
        }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#0d2235', justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderColor: '#14b8a6' }}>
            <Ionicons name="arrow-up-circle" size={32} color="#14b8a6" />
          </View>
          
          <Text style={{ color: '#14b8a6', fontSize: 14, fontWeight: '800', letterSpacing: 1, marginBottom: 4 }}>SEVİYE ATLADIN!</Text>
          <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '900', marginBottom: 16 }}>Level {level}</Text>
          
          <View style={{ backgroundColor: '#0b1328', padding: 16, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 12, marginBottom: 6 }}>YENİ AÇILAN ÖZELLİK</Text>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 }}>{featureName}</Text>
            <Text style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>{featureDesc}</Text>
          </View>

          <Pressable 
            onPress={handleClose}
            style={{ backgroundColor: '#14b8a6', width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '800' }}>Harika, Devam Et</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}