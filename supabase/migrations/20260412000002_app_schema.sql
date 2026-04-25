-- =============================================================================
-- Bilebilirsin — Uygulama Şeması Migrasyonu (Faz 3)
-- Eksik olan tüm tabloların, profil güncellemelerinin ve RPC'lerin eklenmesi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLOSUNU GÜNCELLE (Eksik Kolonlar)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp_balance INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS owned_store_items TEXT[] NOT NULL DEFAULT '{"title-rising-analyst", "avatar-g", "frame-teal", "bg-default", "badge-none", "entry-none", "theme-default", "msg-classic", "banner-none"}',
ADD COLUMN IF NOT EXISTS equipped_store_items JSONB NOT NULL DEFAULT '{"titleId":"title-rising-analyst","avatarId":"avatar-g","frameId":"frame-teal","backgroundId":"bg-default","badgeId":"badge-none","entryEffectId":"entry-none","themeId":"theme-default","messageStyleId":"msg-classic","bannerId":"banner-none"}',
ADD COLUMN IF NOT EXISTS has_pass BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_pass_days INTEGER[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS claimed_bonus_ids TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unlocked_prediction_ids TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS task_progress JSONB NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS processed_win_ids TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS claimed_task_ids TEXT[] NOT NULL DEFAULT '{}';

-- -----------------------------------------------------------------------------
-- 2. TAHMİN (PREDICTION) SİSTEMİ TABLOLARI
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.prediction_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id INTEGER NOT NULL REFERENCES public.seasons(id),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    image_url TEXT,
    accent_color TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'resolved', 'cancelled')),
    closes_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    outcome TEXT CHECK (outcome IN ('EVET', 'HAYIR')),
    yes_pool INTEGER NOT NULL DEFAULT 0,
    no_pool INTEGER NOT NULL DEFAULT 0,
    participant_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prediction_stakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.prediction_questions(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('EVET', 'HAYIR')),
    amount INTEGER NOT NULL,
    odd_at_time NUMERIC NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. KUPONLAR & GÖREVLER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES public.seasons(id),
    type TEXT NOT NULL CHECK (type IN ('Tekli Tahmin', 'Kupon')),
    stake INTEGER NOT NULL,
    total_odds NUMERIC NOT NULL,
    max_win NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Kazandı', 'Kaybetti')),
    played_at TEXT NOT NULL,
    selections JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, task_id)
);

-- -----------------------------------------------------------------------------
-- 4. SOSYAL SİSTEMLER (Arena, Sohbet, Bildirim)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    note TEXT NOT NULL,
    selection_count INTEGER NOT NULL,
    stake INTEGER NOT NULL,
    total_odds NUMERIC NOT NULL,
    max_win NUMERIC NOT NULL,
    selections JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    vibe TEXT NOT NULL,
    online_count INTEGER NOT NULL DEFAULT 0,
    owner_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE, -- NULL ise genel sohbet
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    is_announcement BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    target JSONB NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 5. RPC (STORED PROCEDURES) - ADMIN SONUÇLANDIRMA
-- -----------------------------------------------------------------------------

-- A. TAHMİN SONUÇLANDIRMA
-- Eski imzaları (UUID, TEXT) ve (TEXT, TEXT) güvenli bir şekilde sil
DROP FUNCTION IF EXISTS public.resolve_prediction_admin(UUID, TEXT);
DROP FUNCTION IF EXISTS public.resolve_prediction_admin(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.resolve_prediction_admin(
    p_question_id UUID,
    p_outcome TEXT
) RETURNS JSONB AS $$
DECLARE
    v_q RECORD;
    v_stake RECORD;
    v_winner_pool INTEGER;
    v_loser_pool INTEGER;
    v_payout INTEGER;
    v_kp_refund INTEGER;
    v_coupon RECORD;
    v_total_pool INTEGER;
    v_season_id INTEGER;
BEGIN
    -- Soruyu bul ve kilitle
    SELECT * INTO v_q FROM public.prediction_questions WHERE id = p_question_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Soru bulunamadı.'; END IF;
    IF v_q.status IN ('resolved', 'cancelled') THEN RAISE EXCEPTION 'Soru zaten sonuçlanmış veya iptal edilmiş.'; END IF;
    
    v_season_id := v_q.season_id;
    v_total_pool := v_q.yes_pool + v_q.no_pool;
    IF p_outcome = 'EVET' THEN
        v_winner_pool := v_q.yes_pool;
        v_loser_pool := v_q.no_pool;
    ELSE
        v_winner_pool := v_q.no_pool;
        v_loser_pool := v_q.yes_pool;
    END IF;

    -- 1. Sorunun durumunu güncelle
    UPDATE public.prediction_questions 
    SET status = 'resolved', outcome = p_outcome, resolved_at = NOW() 
    WHERE id = p_question_id;

    -- 2. Her bir bahis için ödeme veya teselli (KP) dağıtımı yap
    FOR v_stake IN SELECT * FROM public.prediction_stakes WHERE question_id = p_question_id LOOP
        IF v_stake.side = p_outcome THEN
            -- Kazandı: (Toplam Havuz * 0.98) * (Yatırılan / Kazanan Taraf Havuzu) -> (Ana likiditeyi hesaba katmıyoruz, saf havuzdan dağıtım)
            -- Not: Eğer havuzda hiç kaybeden yoksa 1.01 gibi minimum orandan ödeme yapılabilir. Şimdilik basit havuz mantığı:
            v_payout := ROUND((v_total_pool * 0.98) * (v_stake.amount::numeric / NULLIF(v_winner_pool, 0)));
            IF v_payout IS NULL OR v_payout = 0 THEN v_payout := v_stake.amount; END IF; -- Fallback
            
            UPDATE public.wallets SET tp_balance = tp_balance + v_payout, tp_earned_total = tp_earned_total + v_payout WHERE user_id = v_stake.user_id AND season_id = v_season_id;
            INSERT INTO public.tp_transactions (user_id, season_id, type, amount, balance_after, reference_id, note)
            VALUES (v_stake.user_id, v_season_id, 'prediction_win', v_payout, (SELECT tp_balance FROM public.wallets WHERE user_id = v_stake.user_id AND season_id = v_season_id), p_question_id::text, 'Tahmin kazancı');
        ELSE
            -- Kaybetti: Yatırılanın %25'i kadar KP tesellisi
            v_kp_refund := ROUND(v_stake.amount * 0.25);
            UPDATE public.wallets SET kp_balance = kp_balance + v_kp_refund, kp_earned_total = kp_earned_total + v_kp_refund WHERE user_id = v_stake.user_id AND season_id = v_season_id;
            INSERT INTO public.kp_transactions (user_id, type, amount, balance_after, reference_id, note)
            VALUES (v_stake.user_id, 'prediction_loss_convert', v_kp_refund, (SELECT kp_balance FROM public.wallets WHERE user_id = v_stake.user_id AND season_id = v_season_id), p_question_id::text, 'Kaybeden tahmin KP dönüşümü');
        END IF;
    END LOOP;

    -- 3. Kuponları Güncelle
    FOR v_coupon IN SELECT * FROM public.coupons WHERE status = 'Aktif' AND selections::text LIKE '%' || p_question_id::text || '%' LOOP
        -- Kuponun içinde bu soruya yanlış cevap varsa, kuponu 'Kaybetti' yap
        IF EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_coupon.selections) sel
            WHERE sel->>'predictionId' = p_question_id::text AND sel->>'choice' != p_outcome
        ) THEN
            UPDATE public.coupons SET status = 'Kaybetti' WHERE id = v_coupon.id;
            -- Kaybeden kuponun TP'sini KP'ye dönüştür
            v_kp_refund := ROUND(v_coupon.stake * 0.25);
            UPDATE public.wallets SET kp_balance = kp_balance + v_kp_refund WHERE user_id = v_coupon.user_id AND season_id = v_season_id;
            INSERT INTO public.kp_transactions (user_id, type, amount, balance_after, reference_id, note)
            VALUES (v_coupon.user_id, 'prediction_loss_convert', v_kp_refund, (SELECT kp_balance FROM public.wallets WHERE user_id = v_coupon.user_id AND season_id = v_season_id), v_coupon.id::text, 'Kaybeden kupon KP dönüşümü');
        ELSE
            -- Kupondaki tüm tahminler sonuçlandı mı ve hepsi doğru mu?
            IF NOT EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_coupon.selections) sel
                JOIN public.prediction_questions q ON q.id = (sel->>'predictionId')::uuid
                WHERE q.status != 'resolved'
            ) THEN
                UPDATE public.coupons SET status = 'Kazandı' WHERE id = v_coupon.id;
                v_payout := v_coupon.max_win;
                UPDATE public.wallets SET tp_balance = tp_balance + v_payout WHERE user_id = v_coupon.user_id AND season_id = v_season_id;
                INSERT INTO public.tp_transactions (user_id, season_id, type, amount, balance_after, reference_id, note)
                VALUES (v_coupon.user_id, v_season_id, 'prediction_win', v_payout, (SELECT tp_balance FROM public.wallets WHERE user_id = v_coupon.user_id AND season_id = v_season_id), v_coupon.id::text, 'Kupon kazancı');
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'message', 'Soru sonuçlandırıldı ve ödüller dağıtıldı.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. TAHMİN İPTAL ETME
DROP FUNCTION IF EXISTS public.cancel_prediction_admin(UUID);
DROP FUNCTION IF EXISTS public.cancel_prediction_admin(TEXT);

CREATE OR REPLACE FUNCTION public.cancel_prediction_admin(
    p_question_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_q RECORD;
    v_stake RECORD;
BEGIN
    SELECT * INTO v_q FROM public.prediction_questions WHERE id = p_question_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Soru bulunamadı.'; END IF;
    IF v_q.status IN ('resolved', 'cancelled') THEN RAISE EXCEPTION 'Soru zaten sonuçlanmış veya iptal edilmiş.'; END IF;
    
    UPDATE public.prediction_questions SET status = 'cancelled', resolved_at = NOW() WHERE id = p_question_id;

    -- Tüm stake'leri iade et
    FOR v_stake IN SELECT * FROM public.prediction_stakes WHERE question_id = p_question_id LOOP
        UPDATE public.wallets SET tp_balance = tp_balance + v_stake.amount WHERE user_id = v_stake.user_id AND season_id = v_q.season_id;
        INSERT INTO public.tp_transactions (user_id, season_id, type, amount, balance_after, reference_id, note)
        VALUES (v_stake.user_id, v_q.season_id, 'prediction_loss_refund', v_stake.amount, (SELECT tp_balance FROM public.wallets WHERE user_id = v_stake.user_id AND season_id = v_q.season_id), p_question_id::text, 'İptal edilen tahmin iadesi');
    END LOOP;

    RETURN jsonb_build_object('ok', true, 'message', 'Soru iptal edildi ve tüm TP iade edildi.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) VE REALTIME YAYINLARI
-- -----------------------------------------------------------------------------
ALTER TABLE public.prediction_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pq_select_all" ON public.prediction_questions;
CREATE POLICY "pq_select_all" ON public.prediction_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "pq_update_all" ON public.prediction_questions;
CREATE POLICY "pq_update_all" ON public.prediction_questions FOR UPDATE USING (true); -- İstemci havuz güncelliyor
DROP POLICY IF EXISTS "pq_insert_admin" ON public.prediction_questions;
CREATE POLICY "pq_insert_admin" ON public.prediction_questions FOR INSERT WITH CHECK (true);

ALTER TABLE public.prediction_stakes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ps_select_own" ON public.prediction_stakes;
CREATE POLICY "ps_select_own" ON public.prediction_stakes FOR SELECT USING (true); -- Herkes havuzu görsün
DROP POLICY IF EXISTS "ps_insert_own" ON public.prediction_stakes;
CREATE POLICY "ps_insert_own" ON public.prediction_stakes FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cp_select_own" ON public.coupons;
CREATE POLICY "cp_select_own" ON public.coupons FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "cp_insert_own" ON public.coupons;
CREATE POLICY "cp_insert_own" ON public.coupons FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ut_select_own" ON public.user_tasks;
CREATE POLICY "ut_select_own" ON public.user_tasks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ut_insert_own" ON public.user_tasks;
CREATE POLICY "ut_insert_own" ON public.user_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.arena_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ap_select_all" ON public.arena_posts;
CREATE POLICY "ap_select_all" ON public.arena_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "ap_insert_own" ON public.arena_posts;
CREATE POLICY "ap_insert_own" ON public.arena_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cr_select_all" ON public.chat_rooms;
CREATE POLICY "cr_select_all" ON public.chat_rooms FOR SELECT USING (true);
DROP POLICY IF EXISTS "cr_insert_own" ON public.chat_rooms;
CREATE POLICY "cr_insert_own" ON public.chat_rooms FOR INSERT WITH CHECK (true);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_select_all" ON public.chat_messages;
CREATE POLICY "cm_select_all" ON public.chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "cm_insert_own" ON public.chat_messages;
CREATE POLICY "cm_insert_own" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dm_select_own" ON public.direct_messages;
CREATE POLICY "dm_select_own" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
DROP POLICY IF EXISTS "dm_insert_own" ON public.direct_messages;
CREATE POLICY "dm_insert_own" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nt_select_own" ON public.notifications;
CREATE POLICY "nt_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "nt_update_own" ON public.notifications;
CREATE POLICY "nt_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "nt_insert_all" ON public.notifications;
CREATE POLICY "nt_insert_all" ON public.notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "nt_delete_own" ON public.notifications;
CREATE POLICY "nt_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Realtime Replika Ayarları
ALTER TABLE public.prediction_questions REPLICA IDENTITY FULL;
ALTER TABLE public.prediction_stakes REPLICA IDENTITY FULL;
ALTER TABLE public.chat_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.relationships REPLICA IDENTITY FULL;

-- Realtime yayınına tabloları ekle
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.prediction_questions, 
    public.prediction_stakes, 
    public.chat_rooms, 
    public.chat_messages, 
    public.direct_messages, 
    public.relationships;