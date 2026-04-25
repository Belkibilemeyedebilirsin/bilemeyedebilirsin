/**
 * TP / KP Ekonomi Context'i.
 *
 * Sorumluluklar:
 * - TP (sezonluk, geçici) ve KP (kalıcı) cüzdan yönetimi
 * - Tüm ekonomi işlemlerinin loglanması
 * - Günlük giriş ödülü sistemi
 * - TP → KP dönüşüm mantığı (sezon sonu + kayıp tahmin/artırma)
 * - Bonus TP kaynakları (config-driven)
 *
 * Mock fazında: Tüm veriler in-memory state'te tutulur.
 * Backend fazında: Supabase RPC / Edge Function'lara taşınacak.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import { supabase } from "../lib/supabase";
import type {
  DailyLoginState,
  KpTransactionType,
  SeasonEndConversionResult,
  TpTransactionType,
  TransactionLog,
  Wallet,
} from "../types";
import { useAuth } from "./AuthContext";

// ─────────────────────────────────────────────────────────────
// Yardımcı: tarih → YYYY-MM-DD
// ─────────────────────────────────────────────────────────────

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayKey(): string {
  return toDateKey(new Date());
}

// ─────────────────────────────────────────────────────────────
// Context Tipleri
// ─────────────────────────────────────────────────────────────

type EconomyContextType = {
  /** Cüzdan bilgisi. */
  wallet: Wallet;

  /** İşlem logları (en yeni en başta). */
  transactionLogs: TransactionLog[];

  /** Günlük giriş ödülü durumu. */
  dailyLoginState: DailyLoginState;

  /** Bugün giriş ödülü alınabilir mi? */
  canClaimDailyLogin: boolean;

  // ── TP İşlemleri ─────────────────────────────────────────

  /** TP ekle (giriş). İşlem logu otomatik oluşturulur. */
  addTp: (amount: number, type: TpTransactionType, description: string, skipDbUpdate?: boolean) => void;

  /** TP düş (çıkış). Bakiye yetmezse false döner. */
  spendTp: (amount: number, type: TpTransactionType, description: string, skipDbUpdate?: boolean) => boolean;

  // ── KP İşlemleri ─────────────────────────────────────────

  /** KP ekle (giriş). İşlem logu otomatik oluşturulur. */
  addKp: (amount: number, type: KpTransactionType, description: string, skipDbUpdate?: boolean) => void;

  /** KP düş (çıkış). Bakiye yetmezse false döner. */
  spendKp: (amount: number, type: KpTransactionType, description: string, skipDbUpdate?: boolean) => boolean;

  // ── Günlük Giriş ────────────────────────────────────────

  /** Günlük giriş ödülünü topla. Zaten toplandıysa false döner. */
  claimDailyLogin: () => { ok: boolean; tpGained: number };

  // ── Dönüşüm ──────────────────────────────────────────────

  /** Kaybedilen tahmin TP'sini KP'ye dönüştür. */
  convertLostPredictionTp: (tpAmount: number) => number;

  /** Kaybedilen açık artırma TP'sini KP'ye dönüştür. */
  convertLostAuctionTp: (tpAmount: number) => number;

  /** Sezon sonu: kalan TP'yi KP'ye dönüştür ve TP'yi sıfırla. */
  processSeasonEnd: () => SeasonEndConversionResult;

  /** Yeni sezon başlat: TP dağıt. */
  startNewSeason: () => void;
};

const EconomyContext = createContext<EconomyContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

/** Mock başlangıç sezon numarası. */
const INITIAL_SEASON_ID = 1;

export function EconomyProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState<Wallet>({
    tp: 1000,
    kp: 150,
    currentSeasonId: INITIAL_SEASON_ID,
  });

  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);

  const [dailyLoginState, setDailyLoginState] = useState<DailyLoginState>({
    lastClaimDate: null,
    streakDays: 0,
  });

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchWallet = async (retryCount = 0) => {
      const { data, error } = await supabase.rpc('get_active_wallet' as any, { p_user_id: currentUser.id });
      if (error && String(error.message).includes('Lock broken') && retryCount < 3) {
        setTimeout(() => fetchWallet(retryCount + 1), 300);
        return;
      }
      if (error) {
        console.error("CÜZDAN ÇEKME HATASI:", error);
      }
      if (data && !error) {
        setWallet({
          tp: data.tp_balance,
          kp: data.kp_balance,
          currentSeasonId: data.season_id,
        });
      }

      let profileRes = await (supabase as any).from('profiles').select('last_daily_claim_date, daily_streak_days').eq('id', currentUser.id).single();
      if (profileRes.error && String(profileRes.error.message).includes('Lock broken')) {
        await new Promise((r) => setTimeout(r, 300));
        profileRes = await (supabase as any).from('profiles').select('last_daily_claim_date, daily_streak_days').eq('id', currentUser.id).single();
      }
      const profile = profileRes.data;
      if (profile) {
        setDailyLoginState({ lastClaimDate: profile.last_daily_claim_date, streakDays: profile.daily_streak_days });
      }

      let [tpData, kpData] = await Promise.all([
        (supabase as any).from('tp_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(50),
        (supabase as any).from('kp_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(50)
      ]);
      if ((tpData.error && String(tpData.error.message).includes('Lock broken')) || (kpData.error && String(kpData.error.message).includes('Lock broken'))) {
        await new Promise((r) => setTimeout(r, 300));
        [tpData, kpData] = await Promise.all([
          (supabase as any).from('tp_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(50),
          (supabase as any).from('kp_transactions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(50)
        ]);
      }

      const logs: TransactionLog[] = [];
      tpData.data?.forEach((r: any) => logs.push({ id: r.id, currency: 'TP', type: r.type, amount: r.amount, balanceAfter: r.balance_after, description: r.note || '', seasonId: r.season_id, createdAt: new Date(r.created_at).getTime() }));
      kpData.data?.forEach((r: any) => logs.push({ id: r.id, currency: 'KP', type: r.type, amount: r.amount, balanceAfter: r.balance_after, description: r.note || '', createdAt: new Date(r.created_at).getTime() }));

      logs.sort((a, b) => b.createdAt - a.createdAt);
      setTransactionLogs(logs);
    };
    fetchWallet();

    // Cüzdan bakiyesi arka planda (örn: Admin tahmin sonuçlandırdığında) değişirse anında UI'a yansıt
    const walletChannel = (supabase as any).channel(`public:wallets_${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${currentUser.id}` }, () => {
        fetchWallet();
      }).subscribe();

    return () => { (supabase as any).removeChannel(walletChannel); };
  }, [currentUser?.id]);

  // ── Log Oluşturma ──────────────────────────────────────

  const appendLog = useCallback(
    (
      currency: "TP" | "KP",
      type: TpTransactionType | KpTransactionType,
      amount: number,
      balanceAfter: number,
      description: string,
    ) => {
      const entry: TransactionLog = {
        id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        currency,
        type,
        amount,
        balanceAfter,
        description,
        seasonId: currency === "TP" ? wallet.currentSeasonId : undefined,
        createdAt: Date.now(),
      };

      setTransactionLogs((prev) => {
        const next = [entry, ...prev];
        if (next.length > GAME_CONFIG.economy.maxTransactionLogSize) {
          return next.slice(0, GAME_CONFIG.economy.maxTransactionLogSize);
        }
        return next;
      });
    },
    [wallet.currentSeasonId],
  );

  // ── TP İşlemleri ────────────────────────────────────────

  const addTp = useCallback(
    (amount: number, type: TpTransactionType, description: string, skipDbUpdate: boolean = false) => {
      setWallet((prev) => {
        const newTp = prev.tp + amount;
        setTimeout(() => {
          appendLog("TP", type, amount, newTp, description);
          if (currentUser && !skipDbUpdate) {
            supabase.rpc('increment_wallet_balance' as any, { p_user_id: currentUser.id, p_amount: amount, p_currency: 'TP' }).then(({ error }) => {
              if (error) console.error("TP GUNCELLEME HATASI:", error);
            });
            (supabase as any).from('tp_transactions').insert({
              user_id: currentUser.id,
              season_id: prev.currentSeasonId,
              type,
              amount,
              balance_after: newTp,
              note: description
            }).then();
          }
        }, 0);
        return { ...prev, tp: newTp };
      });
    },
    [appendLog, currentUser],
  );

  const spendTp = useCallback(
    (amount: number, type: TpTransactionType, description: string, skipDbUpdate: boolean = false): boolean => {
      if (wallet.tp < amount) return false;

      setWallet((prev) => {
        if (prev.tp < amount) return prev;
        const newTp = prev.tp - amount;
        setTimeout(() => {
          appendLog("TP", type, -amount, newTp, description);
          if (currentUser && !skipDbUpdate) {
            supabase.rpc('increment_wallet_balance' as any, { p_user_id: currentUser.id, p_amount: -amount, p_currency: 'TP' }).then(({ error }) => {
              if (error) console.error("TP GUNCELLEME HATASI:", error);
            });
            (supabase as any).from('tp_transactions').insert({
              user_id: currentUser.id,
              season_id: prev.currentSeasonId,
              type,
              amount: -amount,
              balance_after: newTp,
              note: description
            }).then();
          }
        }, 0);
        return { ...prev, tp: newTp };
      });

      return true;
    },
    [wallet.tp, appendLog, currentUser],
  );

  // ── KP İşlemleri ────────────────────────────────────────

  const addKp = useCallback(
    (amount: number, type: KpTransactionType, description: string, skipDbUpdate: boolean = false) => {
      setWallet((prev) => {
        const newKp = prev.kp + amount;
        setTimeout(() => {
          appendLog("KP", type, amount, newKp, description);
          if (currentUser && !skipDbUpdate) {
            supabase.rpc('increment_wallet_balance' as any, { p_user_id: currentUser.id, p_amount: amount, p_currency: 'KP' }).then(({ error }) => {
              if (error) console.error("KP GUNCELLEME HATASI:", error);
            });
            (supabase as any).from('kp_transactions').insert({
              user_id: currentUser.id,
              type,
              amount,
              balance_after: newKp,
              note: description
            }).then();
          }
        }, 0);
        return { ...prev, kp: newKp };
      });
    },
    [appendLog, currentUser],
  );

  const spendKp = useCallback(
    (amount: number, type: KpTransactionType, description: string, skipDbUpdate: boolean = false): boolean => {
      if (wallet.kp < amount) return false;

      setWallet((prev) => {
        if (prev.kp < amount) return prev;
        const newKp = prev.kp - amount;
        setTimeout(() => {
          appendLog("KP", type, -amount, newKp, description);
          if (currentUser && !skipDbUpdate) {
            supabase.rpc('increment_wallet_balance' as any, { p_user_id: currentUser.id, p_amount: -amount, p_currency: 'KP' }).then(({ error }) => {
              if (error) console.error("KP GUNCELLEME HATASI:", error);
            });
            (supabase as any).from('kp_transactions').insert({
              user_id: currentUser.id,
              type,
              amount: -amount,
              balance_after: newKp,
              note: description
            }).then();
          }
        }, 0);
        return { ...prev, kp: newKp };
      });

      return true;
    },
    [wallet.kp, appendLog, currentUser],
  );

  // ── Günlük Giriş Ödülü ──────────────────────────────────

  const canClaimDailyLogin = dailyLoginState.lastClaimDate !== getTodayKey();

  const claimDailyLogin = useCallback((): { ok: boolean; tpGained: number } => {
    const today = getTodayKey();

    if (dailyLoginState.lastClaimDate === today) {
      return { ok: false, tpGained: 0 };
    }

    // Streak hesapla
    let newStreak = 1;
    if (dailyLoginState.lastClaimDate !== null) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = toDateKey(yesterday);

      if (dailyLoginState.lastClaimDate === yesterdayKey) {
        newStreak = dailyLoginState.streakDays + 1;
      }
    }

    const cfg = GAME_CONFIG.economy;
    const streakBonus = Math.min(
      (newStreak - 1) * cfg.dailyLoginStreakBonusTp,
      cfg.dailyLoginStreakBonusCap,
    );
    const totalReward: number = cfg.dailyLoginRewardTp + streakBonus;

    setDailyLoginState({ lastClaimDate: today, streakDays: newStreak });
    if (currentUser) {
      (supabase as any).from("profiles").update({ last_daily_claim_date: today, daily_streak_days: newStreak }).eq("id", currentUser.id).then();
    }
    addTp(totalReward, "daily_login", `Günlük giriş ödülü (${newStreak}. gün, +${streakBonus} streak bonus)`);

    return { ok: true, tpGained: totalReward };
  }, [dailyLoginState, addTp]);

  // ── Kayıp Dönüşümleri ───────────────────────────────────

  const convertLostPredictionTp = useCallback(
    (tpAmount: number): number => {
      const rate: number = GAME_CONFIG.season.tpToKpConversionRate;
      const kpGained = Math.floor(tpAmount * rate);

      if (kpGained > 0) {
        addKp(kpGained, "prediction_loss_convert", `Kaybedilen tahmin → ${kpGained} KP (oran: ${rate})`);
      }

      return kpGained;
    },
    [addKp],
  );

  const convertLostAuctionTp = useCallback(
    (tpAmount: number): number => {
      const rate: number = GAME_CONFIG.season.tpToKpConversionRate;
      const kpGained = Math.floor(tpAmount * rate);

      if (kpGained > 0) {
        addKp(kpGained, "auction_loss_convert", `Kaybedilen artırma → ${kpGained} KP (oran: ${rate})`);
      }

      return kpGained;
    },
    [addKp],
  );

  // ── Sezon Sonu ───────────────────────────────────────────

  const processSeasonEnd = useCallback((): SeasonEndConversionResult => {
    const rate: number = GAME_CONFIG.season.tpToKpConversionRate;
    const currentTp = wallet.tp;
    const kpGained = Math.floor(currentTp * rate);
    const seasonId = wallet.currentSeasonId;

    // TP'yi sıfırla, KP'ye ekle
    setWallet((prev) => ({
      ...prev,
      tp: 0,
      kp: prev.kp + kpGained,
    }));

    // Log: TP çıkışı
    setTimeout(
      () =>
        appendLog(
          "TP",
          "season_end_convert",
          -currentTp,
          0,
          `Sezon ${seasonId} sonu: ${currentTp} TP → ${kpGained} KP dönüştürüldü`,
        ),
      0,
    );

    // Log: KP girişi
    setTimeout(
      () =>
        appendLog(
          "KP",
          "season_end_convert",
          kpGained,
          wallet.kp + kpGained,
          `Sezon ${seasonId} sonu TP → KP dönüşümü`,
        ),
      0,
    );

    return {
      tpConverted: currentTp,
      kpGained,
      conversionRate: rate,
      seasonId,
    };
  }, [wallet.tp, wallet.kp, wallet.currentSeasonId, appendLog]);

  // ── Yeni Sezon Başlat ───────────────────────────────────

  const startNewSeason = useCallback(() => {
    const newSeasonId = wallet.currentSeasonId + 1;
    const startTp: number = GAME_CONFIG.economy.seasonStartTp;

    setWallet((prev) => ({
      ...prev,
      tp: startTp,
      currentSeasonId: newSeasonId,
    }));

    setTimeout(
      () =>
        appendLog(
          "TP",
          "season_start",
          startTp,
          startTp,
          `Sezon ${newSeasonId} başlangıç TP dağıtımı`,
        ),
      0,
    );
  }, [wallet.currentSeasonId, appendLog]);

  // ── Context Value ────────────────────────────────────────

  const value = useMemo(
    () => ({
      wallet,
      transactionLogs,
      dailyLoginState,
      canClaimDailyLogin,
      addTp,
      spendTp,
      addKp,
      spendKp,
      claimDailyLogin,
      convertLostPredictionTp,
      convertLostAuctionTp,
      processSeasonEnd,
      startNewSeason,
    }),
    [
      wallet,
      transactionLogs,
      dailyLoginState,
      canClaimDailyLogin,
      addTp,
      spendTp,
      addKp,
      spendKp,
      claimDailyLogin,
      convertLostPredictionTp,
      convertLostAuctionTp,
      processSeasonEnd,
      startNewSeason,
    ],
  );

  return (
    <EconomyContext.Provider value={value}>{children}</EconomyContext.Provider>
  );
}

export function useEconomy() {
  const context = useContext(EconomyContext);

  if (!context) {
    throw new Error("useEconomy must be used inside EconomyProvider");
  }

  return context;
}
