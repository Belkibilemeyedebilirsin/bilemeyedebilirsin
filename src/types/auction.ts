/**
 * Açık artırma sistemi tip tanımları.
 *
 * Veri modeli, iş kuralları ve admin ödül tipleri burada tanımlanır.
 * Tüm sayısal limitler/oranlar gameConfig.ts'tedir; buraya doğrudan değer yazılmaz.
 */

// ─────────────────────────────────────────────────────────────
// ÖDÜL TİPİ
// ─────────────────────────────────────────────────────────────

/** Admin tarafından seçilen açık artırma ödül türü. */
export type AuctionRewardType =
  | { kind: "cosmetic"; itemName: string }
  | { kind: "tp"; amount: number }
  | { kind: "kp"; amount: number };

// ─────────────────────────────────────────────────────────────
// TEKLİF KAYDI
// ─────────────────────────────────────────────────────────────

/** Tek bir kullanıcının tek bir artırmaya verdiği teklifin anlık özeti. */
export type AuctionBidEntry = {
  userId: string;
  username: string;
  /** Kullanıcının bu artırmadaki birikimli teklif toplamı (TP). */
  totalAmount: number;
  /** Bu kullanıcının son teklif zamanı (epoch ms). */
  lastBidAt: number;
};

// ─────────────────────────────────────────────────────────────
// AÇIK ARTIRMA
// ─────────────────────────────────────────────────────────────

/** Açık artırma yaşam döngüsü durumu. */
export type AuctionStatus = "active" | "ended" | "cancelled" | "resolved";

/** Tam açık artırma modeli. */
export type Auction = {
  id: string;
  name: string;
  category: string;
  accent: string;

  /** Bitiş zamanı (epoch ms). */
  endsAt: number;

  /** Başlangıç teklifi (TP). */
  starterBid: number;

  /**
   * Şu anki en yüksek birikimli teklif (TP).
   * Henüz teklif yoksa 0.
   */
  currentBid: number;

  /** En yüksek teklifçi kullanıcı ID'si. null = teklif yok. */
  highestBidderId: string | null;

  /** En yüksek teklifçi kullanıcı adı. */
  highestBidderUsername: string | null;

  /** Toplam katılımcı sayısı. */
  participantCount: number;

  /** Tüm teklifçilerin birikimli teklif özeti (sıralanmamış). */
  bids: AuctionBidEntry[];

  status: AuctionStatus;

  /** Admin tarafından atanan ödül (çözümlemede kullanılır). */
  rewardType?: AuctionRewardType;

  /** Kazananın kullanıcı ID'si (resolved sonrası dolu). */
  winnerId?: string;
};

// ─────────────────────────────────────────────────────────────
// KULLANICI KATILIM BİLGİSİ
// ─────────────────────────────────────────────────────────────

/** Mevcut kullanıcının tek bir artırmadaki durumu. */
export type UserAuctionState = {
  /** Bu artırmaya verilen birikimli TP. 0 = henüz teklif yok. */
  committedTp: number;
  /** Son teklif zamanı (epoch ms). null = hiç teklif verilmedi. */
  lastBidAt: number | null;
};

// ─────────────────────────────────────────────────────────────
// İŞLEM SONUCU
// ─────────────────────────────────────────────────────────────

export type AuctionActionResult = {
  ok: boolean;
  title: string;
  message: string;
  type: "success" | "error" | "info";
  tpDelta?: number;
  kpDelta?: number;
};
