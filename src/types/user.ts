import type { UserRole } from "./index";

/**
 * Tam kullanıcı modeli.
 *
 * Mock fazında AuthContext tarafından sabit veri ile beslenir.
 * Faz 3+ Supabase entegrasyonunda bu tip doğrudan DB şemasına eşlenir.
 */
export type AuthUser = {
  // ─── Kimlik ────────────────────────────────────────────────────────────────
  /** Supabase auth.users.id — UUID. Mock fazında kısa string. */
  id: string;

  /**
   * Tekil kullanıcı adı.
   * Kurallar: 3–24 karakter, yalnızca küçük harf / rakam / alt çizgi.
   * Değiştirilemez (sezon sonu gibi özel durumlar hariç).
   */
  username: string;

  /**
   * Görünen ad.
   * Emojili ve özel karakterli olabilir, gameConfig.auth.displayNameMaxLength kadar.
   */
  displayName: string;

  // ─── E-posta doğrulama ───────────────────────────────────────────────────
  /** Kullanıcının giriş için kullandığı e-posta adresi. */
  email: string;
  emailVerified: boolean;
  emailVerifiedAt?: number;

  // ─── Rol ve yetki ─────────────────────────────────────────────────────────
  role: UserRole;

  /**
   * Admin ek izinleri. Faz 6 (Admin paneli) öncesi boş bırakılabilir.
   * Örnek: ["mute_users", "resolve_predictions", "manage_auctions"]
   */
  permissions: string[];

  // ─── Profil ───────────────────────────────────────────────────────────────
  avatarCode: string;
  titleText: string;
  frameColor: string;
  /** Serbest metin bio. gameConfig.auth.bioMaxLength kadar. */
  bio: string;

  // ─── Durum ────────────────────────────────────────────────────────────────
  /** false iken profil oluşturma ekranına yönlendirilir. */
  profileCompleted: boolean;
  isBanned: boolean;
  /** Ban sona erme zamanı (ms timestamp). null = kalıcı ban. */
  bannedUntil?: number;

  // ─── Zaman ────────────────────────────────────────────────────────────────
  createdAt: number;
  lastSeenAt: number;
};

// ─── OTP akışı ───────────────────────────────────────────────────────────────

/**
 * OTP gönderimi sırasında bellekte tutulan geçici oturum.
 * Supabase entegrasyonunda Supabase session ile değiştirilecek.
 */
export type OtpSession = {
  /** Kullanıcının OTP gönderilen e-posta adresi. */
  email: string;
  /** Kodun gönderildiği zaman (ms timestamp). */
  sentAt: number;
  /** Bu oturumda yapılan doğrulama denemesi sayısı. */
  attemptCount: number;
  /** true ise kod doğrulandı. */
  verified: boolean;
};

/**
 * E-posta tabanlı auth akışının adımları.
 * - email    → e-posta giriş ekranı
 * - otp      → kod doğrulama ekranı
 * - profile  → profil oluşturma ekranı
 * - done     → oturum açık, ana uygulama
 */
export type EmailAuthStep = "email" | "otp" | "profile" | "done";

/** Profil oluşturma ekranından gelen form verisi. */
export type ProfileSetupData = {
  username: string;
  displayName: string;
  bio?: string;
};

// ─── İlişki modeli (Faz 7 — Takım/Arkadaş sistemi hazırlığı) ─────────────────

/**
 * İki kullanıcı arasındaki anlık ilişki durumu.
 *
 * - none              → ilişki yok
 * - pending_sent      → ben istek gönderdim, karşı taraf bekliyor
 * - pending_received  → bana istek geldi, karar bekleniyor
 * - friends           → karşılıklı kabul edilmiş arkadaşlık
 * - blocked           → ben engelliyim
 */
export type RelationshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends"
  | "blocked";

/**
 * Arkadaş / takip kaydı.
 * Supabase'de `relationships` tablosuna eşlenir.
 */
export type RelationshipRecord = {
  userId: string;
  targetUserId: string;
  status: RelationshipStatus;
  createdAt: number;
  updatedAt: number;
};
