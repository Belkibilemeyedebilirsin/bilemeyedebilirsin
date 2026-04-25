/**
 * Tahmin sistemi çekirdeği tip tanımları.
 *
 * Parimutuel havuz modeli: Kullanıcıların EVET/HAYIR'a yatırdığı TP'ler
 * ortak havuzda toplanır; oranlar havuz oranlarından hesaplanır.
 */

import type { PredictionChoice } from "./index";

// ─────────────────────────────────────────────────────────────
// SORU DURUMU
// ─────────────────────────────────────────────────────────────

/** Tahmin sorusunun yaşam döngüsü durumu. */
export type PredictionStatus =
  | "open"       // tahmine açık, havuz aktif
  | "closed"     // kapanış saati geçti, yeni bahis alınmaz
  | "resolved"   // sonuçlandı (EVET veya HAYIR kazandı)
  | "cancelled"; // iptal edildi, yatırılan TP'ler iade

// ─────────────────────────────────────────────────────────────
// SORU MODELİ
// ─────────────────────────────────────────────────────────────

/** Tahmin sorusu — parimutuel havuz verili. */
export type PredictionQuestion = {
  id: string;
  category: string;
  title: string;
  description: string;
  longDescription: string;
  image: string;
  accent: string;
  tags: string[];

  /** Soru durumu. */
  status: PredictionStatus;

  /** Kapanış zamanı (epoch ms). Bu saatten sonra yeni stake kabul edilmez. */
  closesAt: number;

  /** Sonuçlandırma zamanı (epoch ms). null ise henüz sonuçlanmadı. */
  resolvedAt: number | null;

  /** Kazanan taraf. null ise henüz sonuçlanmadı veya iptal. */
  outcome: PredictionChoice | null;

  // ── Havuz verileri ──────────────────────────────────────

  /** EVET tarafına toplam yatırılan TP. */
  yesPool: number;

  /** HAYIR tarafına toplam yatırılan TP. */
  noPool: number;

  /** Toplam katılımcı sayısı (benzersiz kullanıcı). */
  participantCount: number;

  /** Toplam yorum sayısı (UI gösterimi için). */
  commentCount: number;

  // ── Oran geçmişi ───────────────────────────────────────

  /** Oran snapshot'ları (zaman serisi). */
  oddsHistory: OddsSnapshot[];
};

// ─────────────────────────────────────────────────────────────
// ORAN SNAPSHOT'I
// ─────────────────────────────────────────────────────────────

/** Belirli bir andaki oran kaydı. */
export type OddsSnapshot = {
  /** Kayıt zamanı (epoch ms). */
  timestamp: number;
  /** O andaki EVET oranı. */
  yesOdd: number;
  /** O andaki HAYIR oranı. */
  noOdd: number;
  /** O andaki toplam havuz (TP). */
  totalPool: number;
};

// ─────────────────────────────────────────────────────────────
// KULLANICI STAKE
// ─────────────────────────────────────────────────────────────

/** Kullanıcının belirli bir soruya yaptığı yatırım kaydı. */
export type UserStake = {
  /** İlgili soru ID'si. */
  questionId: string;
  /** Kullanıcının seçtiği taraf (ilk yatırımda kilitlenir). */
  side: PredictionChoice;
  /** Toplam yatırılan TP (ekleme yapıldıkça artar). */
  totalAmount: number;
  /** Tek tek yatırım kayıtları. */
  entries: StakeEntry[];
};

/** Tek bir yatırım girişi. */
export type StakeEntry = {
  /** Yatırım zamanı (epoch ms). */
  timestamp: number;
  /** Yatırılan TP miktarı. */
  amount: number;
  /** Yatırım anındaki oran. */
  oddAtTime: number;
};

// ─────────────────────────────────────────────────────────────
// SONUÇLANDIRMA
// ─────────────────────────────────────────────────────────────

/** Sonuçlandırma işlemi sonucu. */
export type ResolutionResult = {
  questionId: string;
  outcome: PredictionChoice;
  /** Kazanan havuza toplam dağıtılacak TP. */
  winnerPool: number;
  /** Kaybeden havuz toplamı (KP'ye dönüşüm kaynağı). */
  loserPool: number;
  /** Sistem kesintisi (parimutuelSystemCut). */
  systemCut: number;
  /** Kullanıcının kazancı (kazanan taraftaysa). 0 ise kaybetmiş. */
  userPayout: number;
  /** Kullanıcının kaybettiği TP (kaybeden taraftaysa). KP dönüşüm kaynağı. */
  userLoss: number;
};

/** İptal/iade sonucu. */
export type CancellationResult = {
  questionId: string;
  /** İade edilen TP miktarı. */
  refundedAmount: number;
};

// ─────────────────────────────────────────────────────────────
// İSTATİSTİK
// ─────────────────────────────────────────────────────────────

/** Kullanıcının tahmin istatistikleri. */
export type PredictionStats = {
  totalQuestions: number;
  totalStaked: number;
  totalWon: number;
  totalLost: number;
  winRate: number;
  /** Kazanç/kayıp oranı. */
  profitLoss: number;
};
