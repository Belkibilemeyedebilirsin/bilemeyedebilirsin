-- =============================================================================
-- Bilebilirsin — Eksik Şemaların ve RPC İmzalarının Düzeltilmesi
-- Aşağıdaki sorunlar bu migrasyonda kapatılır:
--   1. profiles tablosunda günlük giriş kolonları eksikti (last_daily_claim_date,
--      daily_streak_days). EconomyContext bu kolonları okuyor.
--   2. Takım sistemi (TeamContext) için 4 tablo eksikti (teams, team_members,
--      team_chat_messages, team_requests).
--   3. Açık artırma sistemi için admin_auctions tablosu hiç oluşturulmamıştı.
--   4. increment_wallet_balance RPC'si 2 argümanla tanımlıydı; istemci 3 argüman
--      ile çağırıyordu (p_user_id eklenmiş hâli).
--   5. place_prediction_stake RPC'si 3 argümanla tanımlıydı ve farklı tabloya
--      yazıyordu; istemci 5 argümanlı ve prediction_stakes/prediction_questions
--      tabloları üzerinde çalışan sürümü çağırıyor.
--   6. inject_prediction_volume ve place_auction_bid RPC'leri tanımlı değildi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES — Günlük giriş kolonları
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_daily_claim_date TEXT,
ADD COLUMN IF NOT EXISTS daily_streak_days INTEGER NOT NULL DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 2. TAKIM SİSTEMİ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    logo_url TEXT NOT NULL DEFAULT '',
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_members (
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.team_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.team_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('invite','application')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defansif: eski sürümden kalmış tablolarda kolonlar eksik olabilir
ALTER TABLE public.team_requests ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.team_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_chat_team ON public.team_chat_messages(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_team_requests_team ON public.team_requests(team_id);

-- -----------------------------------------------------------------------------
-- 3. AÇIK ARTIRMA SİSTEMİ
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    accent_color TEXT,
    starter_bid INTEGER NOT NULL DEFAULT 0,
    current_bid INTEGER NOT NULL DEFAULT 0,
    highest_bidder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    highest_bidder_username TEXT,
    participant_count INTEGER NOT NULL DEFAULT 0,
    bids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','cancelled')),
    reward_type TEXT,
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    cancelled BOOLEAN NOT NULL DEFAULT false,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Defansif: eski sürümden kalmış admin_auctions varsa kolonları tamamla
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS starter_bid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS current_bid INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS highest_bidder_id UUID;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS highest_bidder_username TEXT;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS participant_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS bids JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS reward_type TEXT;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS winner_id UUID;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS cancelled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.admin_auctions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_admin_auctions_status ON public.admin_auctions(status);

-- -----------------------------------------------------------------------------
-- 3.5 RPC — get_email_for_login (kullanıcı adından e-postayı bulur)
-- AuthContext.signInWithPassword anonim olarak çağırır; SECURITY DEFINER
-- ile RLS'yi atlayıp auth.users'tan e-postayı çeker.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_email_for_login(TEXT);

CREATE OR REPLACE FUNCTION public.get_email_for_login(
    p_username TEXT
) RETURNS TEXT AS $$
DECLARE
    v_email TEXT;
BEGIN
    SELECT u.email INTO v_email
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = LOWER(p_username)
    LIMIT 1;

    RETURN v_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_email_for_login(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3.6 RPC — is_username_available (kayıt sırasında benzersizlik kontrolü)
-- profiles SELECT politikası anon'a kapalı; bu yüzden RPC ile çağırılır.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_username_available(TEXT);

CREATE OR REPLACE FUNCTION public.is_username_available(
    p_username TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(username) = LOWER(p_username)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. RPC — increment_wallet_balance (3 argüman, p_user_id dahil)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.increment_wallet_balance(INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.increment_wallet_balance(UUID, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
    p_user_id UUID,
    p_amount INTEGER,
    p_currency TEXT
) RETURNS VOID AS $$
DECLARE
    v_active_season_id INTEGER;
BEGIN
    -- Güvenlik: sadece kendi cüzdanını değiştirebilir.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Yetkisiz cüzdan işlemi.';
    END IF;

    SELECT id INTO v_active_season_id FROM public.seasons
    WHERE ended_at IS NULL ORDER BY season_number DESC LIMIT 1;

    IF v_active_season_id IS NULL THEN
        RAISE EXCEPTION 'Aktif sezon bulunamadı.';
    END IF;

    IF p_currency = 'TP' THEN
        UPDATE public.wallets
        SET tp_balance = tp_balance + p_amount,
            tp_earned_total = tp_earned_total + GREATEST(p_amount, 0)
        WHERE user_id = p_user_id AND season_id = v_active_season_id;
    ELSE
        UPDATE public.wallets
        SET kp_balance = kp_balance + p_amount,
            kp_earned_total = kp_earned_total + GREATEST(p_amount, 0)
        WHERE user_id = p_user_id AND season_id = v_active_season_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 5. RPC — place_prediction_stake (5 argüman)
-- Cüzdan düşümünü istemci spendTp -> increment_wallet_balance ile yapıyor;
-- bu RPC sadece tahmin tarafında atomik kayıt + havuz güncellemesi yapar.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.place_prediction_stake(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.place_prediction_stake(UUID, UUID, TEXT, INTEGER, NUMERIC);

CREATE OR REPLACE FUNCTION public.place_prediction_stake(
    p_user_id UUID,
    p_question_id UUID,
    p_side TEXT,
    p_amount INTEGER,
    p_odd_at_time NUMERIC
) RETURNS JSONB AS $$
DECLARE
    v_q RECORD;
    v_existing_count INTEGER;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Yetkisiz tahmin yatırımı.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Geçersiz tutar.';
    END IF;

    IF p_side NOT IN ('EVET', 'HAYIR') THEN
        RAISE EXCEPTION 'Geçersiz taraf.';
    END IF;

    -- Soruyu kilitle
    SELECT * INTO v_q FROM public.prediction_questions
    WHERE id = p_question_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Soru bulunamadı.';
    END IF;

    IF v_q.status <> 'open' OR NOW() >= v_q.closes_at THEN
        RAISE EXCEPTION 'Soru kapalı.';
    END IF;

    -- Bu kullanıcının bu soruda mevcut bahsi var mı?
    SELECT COUNT(*) INTO v_existing_count FROM public.prediction_stakes
    WHERE question_id = p_question_id AND user_id = p_user_id;

    -- Stake'i kaydet
    INSERT INTO public.prediction_stakes (user_id, question_id, side, amount, odd_at_time)
    VALUES (p_user_id, p_question_id, p_side, p_amount, p_odd_at_time);

    -- Havuzu ve katılımcı sayacını atomik güncelle
    IF p_side = 'EVET' THEN
        UPDATE public.prediction_questions
        SET yes_pool = yes_pool + p_amount,
            participant_count = participant_count + (CASE WHEN v_existing_count = 0 THEN 1 ELSE 0 END),
            updated_at = NOW()
        WHERE id = p_question_id;
    ELSE
        UPDATE public.prediction_questions
        SET no_pool = no_pool + p_amount,
            participant_count = participant_count + (CASE WHEN v_existing_count = 0 THEN 1 ELSE 0 END),
            updated_at = NOW()
        WHERE id = p_question_id;
    END IF;

    RETURN jsonb_build_object('ok', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. RPC — inject_prediction_volume (kupon yatırımları için havuz hacmi)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.inject_prediction_volume(
    p_question_id UUID,
    p_side TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
DECLARE
    v_q RECORD;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Yetkisiz hacim enjeksiyonu.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Geçersiz tutar.';
    END IF;

    IF p_side NOT IN ('EVET', 'HAYIR') THEN
        RAISE EXCEPTION 'Geçersiz taraf.';
    END IF;

    SELECT * INTO v_q FROM public.prediction_questions
    WHERE id = p_question_id FOR UPDATE;

    IF NOT FOUND OR v_q.status <> 'open' OR NOW() >= v_q.closes_at THEN
        RETURN;
    END IF;

    IF p_side = 'EVET' THEN
        UPDATE public.prediction_questions
        SET yes_pool = yes_pool + p_amount, updated_at = NOW()
        WHERE id = p_question_id;
    ELSE
        UPDATE public.prediction_questions
        SET no_pool = no_pool + p_amount, updated_at = NOW()
        WHERE id = p_question_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 7. RPC — place_auction_bid (admin_auctions üzerinde teklif kaydı)
-- TP düşümü istemci tarafında zaten yapılıyor (spendTp). Bu RPC sadece
-- admin_auctions satırını günceller ki admin paneli ve realtime senkron olsun.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.place_auction_bid(
    p_auction_id UUID,
    p_user_id UUID,
    p_amount INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_a RECORD;
    v_username TEXT;
    v_bids JSONB;
    v_existing JSONB;
    v_idx INTEGER;
    v_new_total INTEGER;
    v_top JSONB;
    v_top_user TEXT;
    v_top_amount INTEGER;
    v_top_user_id UUID;
    v_participant_count INTEGER;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Yetkisiz teklif.';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Geçersiz tutar.';
    END IF;

    SELECT * INTO v_a FROM public.admin_auctions
    WHERE id = p_auction_id FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Artırma bulunamadı.';
    END IF;

    IF v_a.status <> 'active' OR NOW() >= v_a.ends_at THEN
        RAISE EXCEPTION 'Artırma aktif değil.';
    END IF;

    SELECT username INTO v_username FROM public.profiles WHERE id = p_user_id;

    v_bids := COALESCE(v_a.bids, '[]'::jsonb);
    v_existing := NULL;
    v_idx := -1;

    -- Mevcut teklifi ara
    FOR i IN 0 .. (jsonb_array_length(v_bids) - 1) LOOP
        IF (v_bids->i->>'userId') = p_user_id::text THEN
            v_existing := v_bids->i;
            v_idx := i;
            EXIT;
        END IF;
    END LOOP;

    IF v_existing IS NULL THEN
        v_new_total := p_amount;
        v_bids := v_bids || jsonb_build_array(jsonb_build_object(
            'userId', p_user_id,
            'username', v_username,
            'totalAmount', v_new_total,
            'lastBidAt', extract(epoch from NOW()) * 1000
        ));
    ELSE
        v_new_total := COALESCE((v_existing->>'totalAmount')::int, 0) + p_amount;
        v_bids := jsonb_set(v_bids, ARRAY[v_idx::text], jsonb_build_object(
            'userId', p_user_id,
            'username', v_username,
            'totalAmount', v_new_total,
            'lastBidAt', extract(epoch from NOW()) * 1000
        ));
    END IF;

    -- En yüksek teklifçiyi bul
    v_top_amount := 0;
    v_top_user := NULL;
    v_top_user_id := NULL;
    FOR i IN 0 .. (jsonb_array_length(v_bids) - 1) LOOP
        v_top := v_bids->i;
        IF COALESCE((v_top->>'totalAmount')::int, 0) > v_top_amount THEN
            v_top_amount := (v_top->>'totalAmount')::int;
            v_top_user := v_top->>'username';
            v_top_user_id := (v_top->>'userId')::uuid;
        END IF;
    END LOOP;

    v_participant_count := jsonb_array_length(v_bids);

    UPDATE public.admin_auctions
    SET bids = v_bids,
        current_bid = v_top_amount,
        highest_bidder_id = v_top_user_id,
        highest_bidder_username = v_top_user,
        participant_count = v_participant_count
    WHERE id = p_auction_id;

    RETURN jsonb_build_object('ok', true, 'currentBid', v_top_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (Yeni Tablolar)
-- -----------------------------------------------------------------------------
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_select_all" ON public.teams;
CREATE POLICY "teams_select_all" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "teams_insert_owner" ON public.teams;
CREATE POLICY "teams_insert_owner" ON public.teams FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "teams_delete_owner" ON public.teams;
CREATE POLICY "teams_delete_owner" ON public.teams FOR DELETE USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "teams_update_owner" ON public.teams;
CREATE POLICY "teams_update_owner" ON public.teams FOR UPDATE USING (auth.uid() = owner_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tm_select_all" ON public.team_members;
CREATE POLICY "tm_select_all" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "tm_insert_self_or_owner" ON public.team_members;
CREATE POLICY "tm_insert_self_or_owner" ON public.team_members FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "tm_delete_self_or_owner" ON public.team_members;
CREATE POLICY "tm_delete_self_or_owner" ON public.team_members FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
);
DROP POLICY IF EXISTS "tm_update_owner" ON public.team_members;
CREATE POLICY "tm_update_owner" ON public.team_members FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
);

ALTER TABLE public.team_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tcm_select_all" ON public.team_chat_messages;
CREATE POLICY "tcm_select_all" ON public.team_chat_messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "tcm_insert_member" ON public.team_chat_messages;
CREATE POLICY "tcm_insert_member" ON public.team_chat_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid())
);

ALTER TABLE public.team_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tr_select_all" ON public.team_requests;
CREATE POLICY "tr_select_all" ON public.team_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "tr_insert_self_or_owner" ON public.team_requests;
CREATE POLICY "tr_insert_self_or_owner" ON public.team_requests FOR INSERT WITH CHECK (
    (type = 'application' AND auth.uid() = user_id)
    OR (type = 'invite' AND EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid()))
    OR (type = 'invite' AND EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')))
);
DROP POLICY IF EXISTS "tr_update_self_or_owner" ON public.team_requests;
CREATE POLICY "tr_update_self_or_owner" ON public.team_requests FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.teams t WHERE t.id = team_id AND t.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin'))
);

ALTER TABLE public.admin_auctions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "aa_select_all" ON public.admin_auctions;
CREATE POLICY "aa_select_all" ON public.admin_auctions FOR SELECT USING (true);
-- INSERT/UPDATE/DELETE: yalnızca admin (servis rolü) — RLS politika yok = blok.
-- place_auction_bid RPC SECURITY DEFINER ile RLS'yi atlar.

-- -----------------------------------------------------------------------------
-- 8.5 MODERATION — Sunucu tarafında ban/mute zorlaması
-- Client check_chat_moderation kontrolü atlatılırsa RLS bypass'ı engeller.
-- -----------------------------------------------------------------------------

-- Genel sohbet (chat_messages): banlanan/susturulan kullanıcı INSERT yapamasın
DROP POLICY IF EXISTS "cm_insert_own" ON public.chat_messages;
CREATE POLICY "cm_insert_own" ON public.chat_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND public.check_chat_moderation(
        auth.uid(),
        CASE WHEN room_id IS NULL THEN 'genel_sohbet' ELSE 'sohbet_odasi' END,
        CASE WHEN room_id IS NULL THEN NULL ELSE room_id::text END
    )
);

-- Özel mesaj (direct_messages): genel_sohbet bandına genişletilebilir
DROP POLICY IF EXISTS "dm_insert_own" ON public.direct_messages;
CREATE POLICY "dm_insert_own" ON public.direct_messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND public.check_chat_moderation(auth.uid(), 'genel_sohbet', NULL)
);

-- Takım sohbeti (team_chat_messages): genel_sohbet > takim_sohbeti scoped
DROP POLICY IF EXISTS "tcm_insert_member" ON public.team_chat_messages;
CREATE POLICY "tcm_insert_member" ON public.team_chat_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.team_members m WHERE m.team_id = team_id AND m.user_id = auth.uid())
    AND public.check_chat_moderation(auth.uid(), 'takim_sohbeti', team_id::text)
);

-- moderation_records realtime için
ALTER TABLE public.moderation_records REPLICA IDENTITY FULL;

-- -----------------------------------------------------------------------------
-- 9. REALTIME — REPLICA IDENTITY ve Yayın Üyelikleri
-- -----------------------------------------------------------------------------
ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;
ALTER TABLE public.team_chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.team_requests REPLICA IDENTITY FULL;
ALTER TABLE public.admin_auctions REPLICA IDENTITY FULL;
ALTER TABLE public.coupons REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.arena_posts REPLICA IDENTITY FULL;
ALTER TABLE public.wallets REPLICA IDENTITY FULL;

-- supabase_realtime publication mevcut tablolar dahil yeniden oluşturulur.
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
    public.prediction_questions,
    public.prediction_stakes,
    public.chat_rooms,
    public.chat_messages,
    public.direct_messages,
    public.relationships,
    public.teams,
    public.team_members,
    public.team_chat_messages,
    public.team_requests,
    public.admin_auctions,
    public.coupons,
    public.notifications,
    public.arena_posts,
    public.wallets,
    public.moderation_records;
