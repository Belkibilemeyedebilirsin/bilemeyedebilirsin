/**
 * Açık Artırma Context'i — tam iş kuralları motoru.
 *
 * Kurallar (tümü gameConfig.ts'ten okunur):
 *  - Kullanıcı aynı anda max 5 farklı artırmada aktif katılımcı olabilir.
 *  - Bitiş saatinden 60 dk önce yeni giriş kabul edilmez.
 *  - Son 5 dk'da sadece top-50 teklifçi artırım yapabilir.
 *  - Normal cooldown: 30 dk; son 1 saatte: 20 dk.
 *  - Min artış: normal → defaultMinIncrement (50 TP)
 *                son 30 dk → max(default, currentBid * 0.20)
 *                son 10 dk → max(default, currentBid * 0.50)
 *  - Kullanıcı mevcut teklifinin ÜSTÜNE ekleme yapar (birikimli).
 *    TP maliyeti yalnızca eklenen artış kadardır.
 *  - Bitiş: kazanan ödülü alır; diğer katılımcıların birikimli TP'si KP'ye dönüşür.
 *  - Admin: ödül türünü seçer, sonucu onaylar.
 *
 * Mock fazında: in-memory state.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { supabase } from "../lib/supabase";
import type {
  Auction,
  AuctionActionResult,
  UserAuctionState
} from "../types/auction";
import { checkUserRestriction } from "../utils/moderation";
import { useAuth } from "./AuthContext";
import { useEconomy } from "./EconomyContext";

// ─────────────────────────────────────────────────────────────
// Yardımcılar
// ─────────────────────────────────────────────────────────────

function msLeft(endsAt: number): number {
  return Math.max(0, endsAt - Date.now());
}

function minLeft(endsAt: number): number {
  return msLeft(endsAt) / 60_000;
}

/**
 * Bu artırma için kullanıcının şu an verebileceği minimum eklenti miktarı.
 * (Birikimli teklif değil, bu seferki artış.)
 */
function computeMinIncrement(auction: Auction): number {
  const cfg = GAME_CONFIG.auction;
  const mins = minLeft(auction.endsAt);
  const base = cfg.defaultMinIncrement;

  if (mins <= 10) {
    return Math.max(base, Math.ceil(auction.currentBid * cfg.last10MinMinIncrementRatio));
  }
  if (mins <= 30) {
    return Math.max(base, Math.ceil(auction.currentBid * cfg.last30MinMinIncrementRatio));
  }
  return base;
}

// ─────────────────────────────────────────────────────────────
// Context Tipi
// ─────────────────────────────────────────────────────────────

type AuctionContextType = {
  /** Tüm artırmalar (aktif + bitmişler). */
  auctions: Auction[];

  /**
   * Mevcut kullanıcının her artırmadaki durumu.
   * Key: auction id.
   */
  userStates: Record<string, UserAuctionState>;

  /**
   * Teklif ver veya mevcut teklifin üstüne ekle.
   * `increment`: bu seferki eklenti miktarı (TP).
   */
  placeBid: (auctionId: string, increment: number) => Promise<AuctionActionResult>;

  /** Verilen artırma için kullanıcının şu an uygulayabileceği minimum eklentiyi döner. */
  getMinIncrement: (auctionId: string) => number;
};

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export function AuctionProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { wallet, spendTp, convertLostAuctionTp } = useEconomy();

  const [auctions, setAuctions] = useState<Auction[]>([]);

  /**
   * userStates: auctionId → { committedTp, lastBidAt }
   * Yalnızca mevcut kullanıcının verisi tutulur.
   */
  const [userStates, setUserStates] = useState<Record<string, UserAuctionState>>({});

  // ── Artırmaları Supabase'den Çek ve Dinle ─────────────────

  const fetchAuctions = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .from("admin_auctions")
      .select("*")
      .neq("cancelled", true)
      .order("created_at", { ascending: false });

    if (data) {
      const mapped: Auction[] = data.map((a: any) => ({
        id: a.id,
        name: a.name,
        category: a.category,
        accent: a.accent_color || "#7c3aed",
        endsAt: new Date(a.ends_at).getTime(),
        starterBid: a.starter_bid,
        currentBid: a.current_bid || 0,
        highestBidderId: a.highest_bidder_id,
        highestBidderUsername: a.highest_bidder_username,
        participantCount: a.participant_count || 0,
        bids: a.bids || [],
        status: a.status || "active",
        rewardType: a.reward_type,
        winnerId: a.winner_id,
      }));
      setAuctions(mapped);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();

    const channel = (supabase as any).channel("public:admin_auctions")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_auctions" }, () => {
        fetchAuctions();
      }).subscribe();

    return () => { (supabase as any).removeChannel(channel); };
  }, [fetchAuctions]);

  // ── Minimum artış ────────────────────────────────────────

  const getMinIncrement = useCallback(
    (auctionId: string): number => {
      const auction = auctions.find((a) => a.id === auctionId);
      if (!auction) return GAME_CONFIG.auction.defaultMinIncrement;
      return computeMinIncrement(auction);
    },
    [auctions],
  );

  // ── Teklif ver ───────────────────────────────────────────

  const placeBid = useCallback(
    async (auctionId: string, increment: number): Promise<AuctionActionResult> => {
      if (!currentUser) {
        return { ok: false, title: "Teklif", message: "Giriş yapman gerekiyor.", type: "error" };
      }

      // Moderasyon Kontrolü: Kullanıcı banlı mı?
      const restriction = await checkUserRestriction(currentUser.id, "ban");
      if (restriction.restricted) {
        return { ok: false, title: "Kısıtlama", message: `Hesabınız kısıtlı: ${restriction.reason}`, type: "error" };
      }

      const auction = auctions.find((a) => a.id === auctionId);
      if (!auction) {
        return { ok: false, title: "Teklif", message: "Artırma bulunamadı.", type: "error" };
      }
      if (auction.status !== "active") {
        return { ok: false, title: "Teklif", message: "Bu artırma artık aktif değil.", type: "error" };
      }

      const now = Date.now();
      const remaining = msLeft(auction.endsAt);
      const mins = remaining / 60_000;

      const cfg = GAME_CONFIG.auction;
      const userState = userStates[auctionId] ?? { committedTp: 0, lastBidAt: null };
      const isFirstEntry = userState.committedTp === 0;

      // Kural: Son 60 dk yeni giriş kabul edilmez
      if (isFirstEntry && mins <= cfg.newEntryClosedMinutes) {
        return {
          ok: false,
          title: "Teklif",
          message: `Artırmaya son ${cfg.newEntryClosedMinutes} dakikada yeni giriş yapılamaz.`,
          type: "error",
        };
      }

      // Kural: Aynı anda max 5 aktif katılım
      if (isFirstEntry) {
        const activeCount = Object.entries(userStates).filter(([id, s]) => {
          if (s.committedTp <= 0) return false;
          const a = auctions.find((x) => x.id === id);
          return a && a.status === "active";
        }).length;

        if (activeCount >= cfg.maxActiveParticipations) {
          return {
            ok: false,
            title: "Teklif",
            message: `Aynı anda en fazla ${cfg.maxActiveParticipations} farklı artırmada teklif verebilirsin.`,
            type: "error",
          };
        }
      }

      // Kural: Son 5 dk sadece top-50 teklifçi
      if (mins <= cfg.finalPhaseMinutes) {
        const sorted = [...auction.bids].sort((a, b) => b.totalAmount - a.totalAmount);
        const top50 = sorted.slice(0, cfg.finalPhaseTopBidderCount).map((b) => b.userId);
        if (!top50.includes(currentUser.id)) {
          return {
            ok: false,
            title: "Teklif",
            message: `Son ${cfg.finalPhaseMinutes} dakikada yalnızca ilk ${cfg.finalPhaseTopBidderCount} teklifçi artırım yapabilir.`,
            type: "error",
          };
        }
      }

      // Kural: Cooldown
      if (userState.lastBidAt !== null) {
        const cooldownMs =
          mins <= cfg.newEntryClosedMinutes
            ? cfg.lastHourCooldownMinutes * 60_000
            : cfg.cooldownMinutes * 60_000;
        const elapsed = now - userState.lastBidAt;
        if (elapsed < cooldownMs) {
          const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
          const waitMin = Math.ceil(waitSec / 60);
          return {
            ok: false,
            title: "Teklif",
            message: `Bir sonraki teklifin için ${waitMin} dakika beklemelisin.`,
            type: "error",
          };
        }
      }

      // Kural: Min artış
      const minIncrement = computeMinIncrement(auction);
      if (!Number.isFinite(increment) || increment < minIncrement) {
        return {
          ok: false,
          title: "Teklif",
          message: `Bu aşamada minimum artış ${minIncrement} TP.`,
          type: "error",
        };
      }

      // Kural: TP bakiyesi yeterli mi?
      if (wallet.tp < increment) {
        return {
          ok: false,
          title: "Teklif",
          message: "Yeterli TP bakiyen yok.",
          type: "error",
        };
      }

      // TP harca
      const spent = spendTp(
        increment,
        "auction_bid",
        `Açık artırma teklifi (+${increment} TP): ${auction.name}`,
      );
      if (!spent) {
        return { ok: false, title: "Teklif", message: "TP işlemi başarısız.", type: "error" };
      }

      // Supabase RPC üzerinden DB kaydını da yap (isteğe bağlı, admin_auctions update)
      (supabase as any).rpc("place_auction_bid", {
        p_auction_id: auctionId,
        p_user_id: currentUser.id,
        p_amount: increment
      }).then(({ error }: any) => {
        if (error) console.warn("Supabase Teklif Kayıt Hatası (RPC):", error);
      });

      const newCommitted = userState.committedTp + increment;

      // userStates güncelle
      setUserStates((prev) => ({
        ...prev,
        [auctionId]: { committedTp: newCommitted, lastBidAt: now },
      }));

      // Artırma kaydını güncelle
      setAuctions((prev) =>
        prev.map((a) => {
          if (a.id !== auctionId) return a;

          // Mevcut bid entry güncelle ya da yenisini ekle
          const existingEntry = a.bids.find((b) => b.userId === currentUser.id);
          const updatedBids = existingEntry
            ? a.bids.map((b) =>
                b.userId === currentUser.id
                  ? { ...b, totalAmount: newCommitted, lastBidAt: now }
                  : b,
              )
            : [
                ...a.bids,
                {
                  userId: currentUser.id,
                  username: currentUser.username,
                  totalAmount: newCommitted,
                  lastBidAt: now,
                },
              ];

          // En yüksek teklifçiyi bul
          const topBid = updatedBids.reduce(
            (max, b) => (b.totalAmount > max.totalAmount ? b : max),
            updatedBids[0],
          );

          return {
            ...a,
            currentBid: topBid.totalAmount,
            highestBidderId: topBid.userId,
            highestBidderUsername: topBid.username,
            participantCount: updatedBids.length,
            bids: updatedBids,
          };
        }),
      );

      return {
        ok: true,
        title: "Teklif Verildi",
        message: `Toplam teklifin: ${newCommitted} TP.`,
        type: "success",
        tpDelta: -increment,
      };
    },
    [auctions, userStates, currentUser, wallet.tp, spendTp],
  );

  // ── Context Value ────────────────────────────────────────

  const value = useMemo<AuctionContextType>(
    () => ({
      auctions,
      userStates,
      placeBid,
      getMinIncrement,
    }),
    [
      auctions,
      userStates,
      placeBid,
      getMinIncrement,
    ],
  );

  return (
    <AuctionContext.Provider value={value}>{children}</AuctionContext.Provider>
  );
}

export function useAuction() {
  const ctx = useContext(AuctionContext);
  if (!ctx) throw new Error("useAuction must be used inside AuctionProvider");
  return ctx;
}
