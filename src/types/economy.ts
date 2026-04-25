/**
 * TP/KP ekonomi sistemi tip tanımları.
 *
 * Sezonluk TP (geçici) ve kalıcı KP ayrımını, işlem loglarını,
 * günlük giriş ödülü durumunu ve dönüşüm yapılarını tanımlar.
 */

import type { Currency } from "./index";

// ─────────────────────────────────────────────────────────────
// İŞLEM TÜRLERİ
// ─────────────────────────────────────────────────────────────

/** TP işlem türleri. */
export type TpTransactionType =
  | "season_start"           // sezon başlangıç dağıtımı
  | "daily_login"            // günlük giriş ödülü
  | "prediction_stake"       // tahmine TP yatırma (çıkış)
  | "prediction_win"         // tahmin kazancı (giriş)
  | "prediction_loss_refund" // kaybedilen tahmin → KP dönüşüm kaynağı
  | "auction_bid"            // açık artırma teklifi (çıkış)
  | "auction_loss_refund"    // kaybedilen artırma → KP dönüşüm kaynağı
  | "task_reward"            // görev ödülü
  | "bonus_friend_invite"    // arkadaş davet bonusu
  | "bonus_first_coupon"     // ilk kupon bonusu
  | "bonus_profile_complete" // profil tamamlama bonusu
  | "bonus_weekly_activity"  // haftalık aktiflik bonusu
  | "season_end_convert";    // sezon sonu kalan TP → KP dönüşümü (çıkış)

/** KP işlem türleri. */
export type KpTransactionType =
  | "store_purchase"         // mağaza satın alma (çıkış)
  | "chat_room_create"       // sohbet odası oluşturma (çıkış)
  | "global_announcement"    // genel sohbet duyurusu (çıkış)
  | "prediction_access"      // açık tahmin erişim ücreti (çıkış)
  | "pass_reward"            // pass gün ödülü (giriş)
  | "season_end_convert"     // sezon sonu TP → KP dönüşümü (giriş)
  | "prediction_loss_convert" // kaybedilen tahmin TP → KP (giriş)
  | "auction_loss_convert"   // kaybedilen artırma TP → KP (giriş)
  | "kp_purchase";           // gerçek para ile KP satın alma (giriş)

// ─────────────────────────────────────────────────────────────
// KP SATIN ALMA
// ─────────────────────────────────────────────────────────────

/** Satın alma paketi kimliği. */
export type KpPackageId = "starter" | "standard" | "value" | "mega";

/** KP satın alma işleminin yaşam döngüsü durumu. */
export type KpPurchaseStatus =
  | "completed"  // KP bakiyeye eklendi
  | "failed"     // fraud kontrolü veya sistem hatası
  | "refunded";  // iade edildi

/** Fraud tespitinde kullanılan işaret türleri. */
export type FraudFlag =
  | "rapid_purchase"        // son alımdan bu yana çok az süre geçti
  | "daily_limit_exceeded"  // günlük satın alma adedi aşıldı
  | "daily_kp_cap_exceeded" // günlük KP edinim üst sınırı aşıldı
  | "duplicate_package";    // aynı paket aynı gün içinde tekrar satın alınmak isteniyor

/** Tek bir ödeme girişiminin logu. */
export type PaymentLog = {
  id: string;
  packageId: KpPackageId;
  /** Mock ödeme referans numarası (gerçek gateway entegrasyonunda doldurulacak). */
  mockPaymentRef: string;
  attemptedAt: number;        // epoch ms
  completedAt?: number;       // başarılı ise set edilir
  status: "success" | "failed";
  failureReason?: string;
};

/** Tek bir KP satın alma kaydı. */
export type KpPurchaseRecord = {
  id: string;
  packageId: KpPackageId;
  /** Bakiyeye eklenen toplam KP (baz + bonus). */
  kpGranted: number;
  /** Paketin mock TL fiyatı. */
  mockPriceTl: number;
  purchasedAt: number;        // epoch ms
  status: KpPurchaseStatus;
  /** Satın alma tarihinden 24 saat geçmemişse ve refunded değilse true. */
  isRefundEligible: boolean;
  refundRequestedAt?: number; // iade talep zamanı (epoch ms)
  /** Bu alımda tetiklenen fraud işaretleri. */
  fraudFlags: FraudFlag[];
  /** İlgili ödeme logu ID'si. */
  paymentLogId: string;
};

// ─────────────────────────────────────────────────────────────
// İŞLEM LOGU
// ─────────────────────────────────────────────────────────────

/** Tek bir ekonomi işlemi kaydı. */
export type TransactionLog = {
  id: string;
  currency: Currency;
  type: TpTransactionType | KpTransactionType;
  /** Pozitif = giriş, negatif = çıkış. */
  amount: number;
  /** İşlem sonrası bakiye. */
  balanceAfter: number;
  /** İşlemle ilgili açıklama. */
  description: string;
  /** İlgili sezon numarası (TP işlemleri için). */
  seasonId?: number;
  /** İşlem zamanı (epoch ms). */
  createdAt: number;
};

// ─────────────────────────────────────────────────────────────
// GÜNLÜK GİRİŞ ÖDÜLÜ
// ─────────────────────────────────────────────────────────────

/** Günlük giriş ödülü takip durumu. */
export type DailyLoginState = {
  /** Son giriş ödülü alınan gün (YYYY-MM-DD). */
  lastClaimDate: string | null;
  /** Ardışık giriş günü sayısı. */
  streakDays: number;
};

// ─────────────────────────────────────────────────────────────
// SEZON SONU DÖNÜŞÜM
// ─────────────────────────────────────────────────────────────

/** Sezon sonu dönüşüm sonucu. */
export type SeasonEndConversionResult = {
  /** Dönüştürülen TP miktarı. */
  tpConverted: number;
  /** Kazanılan KP miktarı. */
  kpGained: number;
  /** Uygulanan dönüşüm oranı. */
  conversionRate: number;
  /** Dönüşümün yapıldığı sezon. */
  seasonId: number;
};

// ─────────────────────────────────────────────────────────────
// CÜZDAN
// ─────────────────────────────────────────────────────────────

/** TP/KP cüzdan yapısı. */
export type Wallet = {
  tp: number;
  kp: number;
  /** Mevcut sezon numarası. */
  currentSeasonId: number;
};
