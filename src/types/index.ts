/**
 * Uygulama genelinde paylaşılan merkezi tip tanımları.
 *
 * Bu dosya birden fazla modülde tekrar eden ya da ileride
 * domain katmanları oluşturulduğunda referans alınacak temel
 * tipleri toplar. Domain'e özgü karmaşık tipler (PredictionItem,
 * ChatRoom vb.) kendi kaynak dosyalarında kalmaya devam eder.
 */

// ─────────────────────────────────────────────────────────────
// TAHMİN
// ─────────────────────────────────────────────────────────────

/** Tahmin tercihi. */
export type PredictionChoice = "EVET" | "HAYIR";

export type PredictionTag = string;

export type PredictionItem = {
  id: string;
  category: string;
  timeLeft: string;
  title: string;
  description: string;
  longDescription: string;
  votes: number;
  comments: number;
  yesOdd: number;
  noOdd: number;
  accent: string;
  image: string;
  tabs: PredictionTag[];
};

// ─────────────────────────────────────────────────────────────
// KUPON
// ─────────────────────────────────────────────────────────────

/** Kupon veya tekli tahmin yaşam döngüsü durumu. */
export type CouponStatus = "Aktif" | "Kazandı" | "Kaybetti";

/** Kupon türü: tekli mi, çoklu mu? */
export type CouponType = "Tekli Tahmin" | "Kupon";

// ─────────────────────────────────────────────────────────────
// KULLANICI VE ROL
// ─────────────────────────────────────────────────────────────

/**
 * Kullanıcı rolü.
 * Faz 1'de AuthContext ile aktif kullanıma alınacak.
 */
export type UserRole = "user" | "moderator" | "admin";

/** Arkadaş isteği yönü. */
export type FriendRequestDirection = "incoming" | "outgoing";

// ─────────────────────────────────────────────────────────────
// SEZON
// ─────────────────────────────────────────────────────────────

/**
 * Sezon fazı.
 * Faz 3'te SeasonContext ile aktif kullanıma alınacak.
 */
export type SeasonPhase = "prediction" | "result" | "auction";

// ─────────────────────────────────────────────────────────────
// EKONOMİ
// ─────────────────────────────────────────────────────────────

/** Para birimi türü. */
export type Currency = "TP" | "KP";

// ─────────────────────────────────────────────────────────────
// BİLDİRİM
// ─────────────────────────────────────────────────────────────

/** Bildirim kategorisi. */
export type NotificationType =
  | "settlement"   // tahmin sonuçlandı
  | "message"      // DM / sohbet
  | "friend"       // arkadaş isteği
  | "new_question" // yeni tahmin açıldı
  | "auction"      // açık artırmada teklif geçildi
  | "team"         // takım bildirimi
  | "task";        // görev tamamlandı

// ─────────────────────────────────────────────────────────────
// KULLANICI İÇERİKLERİ (Kupon, Arena, Sohbet)
// ─────────────────────────────────────────────────────────────

export type CouponSelectionRecord = {
  id: string;
  predictionId: string;
  title: string;
  category: string;
  choice: PredictionChoice;
  odd: number;
};

export type CouponRecord = {
  id: string;
  type: CouponType;
  status: CouponStatus;
  playedAt: string;
  totalOdds: number;
  stake: number;
  maxWin: number;
  selections: CouponSelectionRecord[];
};

export type ArenaPost = {
  id: string;
  user: string;
  avatar: string;
  time: string;
  note: string;
  selectionCount: number;
  stake: number;
  totalOdds: number;
  maxWin: number;
  selections: CouponSelectionRecord[];
};

export type ChatMessage = {
  id: string;
  user: string;
  text: string;
  time: string;
  createdAt: number;
  mine: boolean;
  isAnnouncement?: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  desc: string;
  vibe: string;
  online: number;
  ownerUserId?: string;
  messages: ChatMessage[];
};

export type DirectMessageThread = {
  userId: string;
  messages: ChatMessage[];
};

// ─────────────────────────────────────────────────────────────
// MAĞAZA / KOZMETİK
// ─────────────────────────────────────────────────────────────

/**
 * İç mağaza (equippable kozmetik) kategori kodu.
 * AppDataContext.StoreCategory'nin merkezi kaynağı.
 * mockStore.StoreCategory (görsel mağaza Türkçe etiketleri) ile
 * karıştırılmamalıdır.
 */
export type StoreCategoryCode =
  | "title"
  | "avatar"
  | "frame"
  | "background"
  | "badge"
  | "entry_effect"
  | "theme"
  | "message_style"
  | "model"
  | "costume"
  | "banner";

/** Kozmetik ürün nadirlik seviyesi. */
export type ItemRarity = "Nadir" | "Epik" | "Efsane";

// ─────────────────────────────────────────────────────────────
// SOHBET
// ─────────────────────────────────────────────────────────────

/**
 * Sohbet odası hava tipi.
 * mockChat.chatVibeOptions dizisindeki değerlerle eşdeğerdir.
 */
export type ChatVibe =
  | "Temkinli"
  | "Analitik"
  | "Stratejik"
  | "Hızlı Akış"
  | "Topluluk"
  | "Sakin";

// ─────────────────────────────────────────────────────────────
// SEVİYE VE ÖZELLİK KİLİT SİSTEMİ (LEVEL UNLOCKS)
// ─────────────────────────────────────────────────────────────

/** Uygulama içindeki kilitlenebilir/açılabilir ana özellikler. */
export type AppFeature =
  | "tasks"           // Görevler (Temel)
  | "coupons"         // Kuponlar (Temel)
  | "store"           // Mağaza (Temel)
  | "time_travel"     // Zaman Yolculuğu (Temel)
  | "profile"         // Profil (Temel)
  | "settings"        // Ayarlar (Temel)
  | "global_chat"     // Genel Sohbet (Level 2)
  | "friends"         // Arkadaşlar (Level 3)
  | "dm"              // Özel Mesajlar (Level 4)
  | "teams"           // Takımlar (Level 5)
  | "leaderboard"     // Liderlik Tablosu / Sıralama (Level 6)
  | "social_feed"     // Arena / Sosyal Akış (Level 7)
  | "chat_rooms"      // Sohbet Odaları (Level 8)
  | "auction"         // Açık Artırma (Temel)
  | "premium_module"; // Premium Sosyal Modül (Level 9)

// ─────────────────────────────────────────────────────────────
// GÖREV SİSTEMİ
// ─────────────────────────────────────────────────────────────

/** Görev periyodu. */
export type TaskPeriod = "daily" | "weekly" | "seasonal";

// ─────────────────────────────────────────────────────────────
// EKONOMİ (detaylı tipler economy.ts'de)
// ─────────────────────────────────────────────────────────────

export type {
  DailyLoginState, FraudFlag, KpPackageId, KpPurchaseRecord, KpPurchaseStatus, KpTransactionType, PaymentLog, SeasonEndConversionResult, TpTransactionType, TransactionLog, Wallet
} from "./economy";

// ─────────────────────────────────────────────────────────────
// AÇIK ARTIRMA SİSTEMİ (detaylı tipler auction.ts'de)
// ─────────────────────────────────────────────────────────────

export type {
  Auction, AuctionActionResult, AuctionBidEntry, AuctionRewardType, AuctionStatus, UserAuctionState
} from "./auction";

// ─────────────────────────────────────────────────────────────
// TAHMİN SİSTEMİ (detaylı tipler prediction.ts'de)
// ─────────────────────────────────────────────────────────────

export type {
  CancellationResult, OddsSnapshot, PredictionQuestion, PredictionStats, PredictionStatus, ResolutionResult, StakeEntry, UserStake
} from "./prediction";

// ─────────────────────────────────────────────────────────────
// TAKIM SİSTEMİ (detaylı tipler team.ts'de)
// ─────────────────────────────────────────────────────────────

export type {
  Team, TeamApplication, TeamApplicationStatus, TeamChatMessage, TeamInvite, TeamInviteStatus, TeamMember, TeamRole
} from "./team";

