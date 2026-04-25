-- =============================================================================
-- Bilebilirsin — İlk Şema Migrasyonu
-- Faz 2: auth, profiles ve temel veriler
--
-- Tablolar:
--   profiles        → auth.users'ı extend eder; profil ve rol bilgileri
--   seasons         → sezon yaşam döngüsü
--   wallets         → kullanıcı başına sezonluk TP/KP bakiyesi
--   tp_transactions → TP hareket logu
--   kp_transactions → KP hareket logu
--   relationships   → arkadaşlık/engelleme kayıtları
--   moderation_records → Scope bazlı ban/susturma kayıtları
--
-- Triggerlar:
--   on_auth_user_created        → yeni kayıtta profiles satırı oluşturur
--   on_auth_user_email_confirmed → e-posta doğrulandığında profili günceller
--   set_updated_at (per-table)  → updated_at alanını otomatik günceller
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Yardımcı fonksiyon: updated_at otomatik güncelleme
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 1. profiles
-- =============================================================================

CREATE TABLE public.profiles (
  -- Kimlik — auth.users.id ile bire-bir eşleşme
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Kullanıcı adı: profil tamamlanana kadar NULL olabilir.
  -- Benzersizlik: PostgreSQL'de NULL != NULL olduğundan çoklu NULL desteklenir.
  username TEXT UNIQUE,

  -- Görünen ad: maks 30 karakter (gameConfig.auth.displayNameMaxLength)
  display_name TEXT NOT NULL DEFAULT '',

  -- Bio: maks 120 karakter (gameConfig.auth.bioMaxLength)
  bio TEXT NOT NULL DEFAULT '',

  -- Kozmetik alanlar (mock fazda string kodlar; sonraki fazda FK olabilir)
  avatar_code TEXT NOT NULL DEFAULT '',
  title_text  TEXT NOT NULL DEFAULT '',
  frame_color TEXT NOT NULL DEFAULT '#14b8a6',

  -- Rol ve ek izinler
  role        TEXT     NOT NULL DEFAULT 'user'
                CHECK (role IN ('user', 'moderator', 'admin')),
  permissions TEXT[]   NOT NULL DEFAULT '{}',

  -- Durum bayrakları
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  is_banned         BOOLEAN NOT NULL DEFAULT false,
  banned_until      TIMESTAMPTZ,               -- NULL = kalıcı ban

  -- E-posta doğrulama (auth.users'dan kopyalanır; trigger ile senkronize tutulur)
  email_verified    BOOLEAN    NOT NULL DEFAULT false,
  email_verified_at TIMESTAMPTZ,

  -- Zaman damgaları
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ── Kısıtlamalar ──────────────────────────────────────────────────────────
  -- Kullanıcı adı formatı: 3–24 karakter, küçük harf / rakam / alt çizgi
  CONSTRAINT profiles_username_format CHECK (
    username IS NULL
    OR username ~ '^[a-z0-9_]{3,24}$'
  ),

  -- Görünen ad uzunluk üst sınırı
  CONSTRAINT profiles_display_name_length CHECK (
    char_length(display_name) <= 30
  ),

  -- Bio uzunluk üst sınırı
  CONSTRAINT profiles_bio_length CHECK (
    char_length(bio) <= 120
  ),

  -- Profil tamamlandıysa kullanıcı adı ve görünen ad zorunlu
  CONSTRAINT profiles_completed_requires_fields CHECK (
    profile_completed = false
    OR (
      username IS NOT NULL
      AND char_length(display_name) >= 1
    )
  )
);

COMMENT ON TABLE  public.profiles                  IS 'auth.users için uygulama katmanı profil verisi';
COMMENT ON COLUMN public.profiles.username         IS 'Tekil kullanıcı adı; profil kurulana kadar NULL';
COMMENT ON COLUMN public.profiles.permissions      IS 'Admin ek izin listesi (örn: resolve_predictions)';
COMMENT ON COLUMN public.profiles.profile_completed IS 'false iken profil kurulum ekranına yönlendirilir';
COMMENT ON COLUMN public.profiles.banned_until     IS 'NULL = kalıcı ban, dolmamışsa geçici ban';


-- -----------------------------------------------------------------------------
-- Trigger: yeni auth.users kaydında otomatik profiles satırı
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email_verified,
    email_verified_at
  ) VALUES (
    NEW.id,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.email_confirmed_at
  )
  -- Aynı id zaten varsa (örn: sosyal login yeniden bağlama) sessizce geç
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- -----------------------------------------------------------------------------
-- Trigger: e-posta doğrulandığında profili güncelle
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_active_season_id INTEGER;
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at != NEW.email_confirmed_at)
  THEN
    UPDATE public.profiles
    SET
      email_verified    = true,
      email_verified_at = NEW.email_confirmed_at
    WHERE id = NEW.id;
  END IF;

  -- Aktif sezonu bul ve kullanıcıya başlangıç cüzdanı tanımla
  SELECT id INTO v_active_season_id 
  FROM public.seasons 
  WHERE ended_at IS NULL 
  ORDER BY season_number DESC 
  LIMIT 1;

  IF v_active_season_id IS NOT NULL THEN
    INSERT INTO public.wallets (user_id, season_id)
    VALUES (NEW.id, v_active_season_id)
    ON CONFLICT (user_id, season_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_confirmed();


-- =============================================================================
-- 2. seasons
-- =============================================================================

CREATE TABLE public.seasons (
  id            SERIAL PRIMARY KEY,
  season_number INTEGER NOT NULL UNIQUE,

  -- Faz durumu; 'ended' kapalı sezonlar için
  phase TEXT NOT NULL DEFAULT 'prediction'
    CHECK (phase IN ('prediction', 'result', 'auction', 'ended')),

  -- Her faz başlangıç zamanı
  prediction_starts_at TIMESTAMPTZ NOT NULL,
  result_starts_at     TIMESTAMPTZ NOT NULL,
  auction_starts_at    TIMESTAMPTZ NOT NULL,
  ended_at             TIMESTAMPTZ,  -- NULL = henüz bitmedi

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Faz zamanlaması tutarlılığı
  CONSTRAINT seasons_phase_order CHECK (
    prediction_starts_at < result_starts_at
    AND result_starts_at  < auction_starts_at
  )
);

COMMENT ON TABLE public.seasons IS 'Oyun sezonları ve faz takvimi';

-- Aktif sezonu döndüren yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.get_active_season()
RETURNS public.seasons AS $$
  SELECT * FROM public.seasons
  WHERE ended_at IS NULL
  ORDER BY season_number DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Başlangıç verisi: Sezon 1 (şu an 'prediction' fazında)
INSERT INTO public.seasons (
  season_number,
  phase,
  prediction_starts_at,
  result_starts_at,
  auction_starts_at
) VALUES (
  1,
  'prediction',
  NOW(),
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '11 days'
);


-- =============================================================================
-- 3. wallets
-- =============================================================================

CREATE TABLE public.wallets (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID    NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES public.seasons(id),

  -- Sezonluk TP bakiyesi (sezon başında 1000 ile başlar)
  tp_balance     INTEGER NOT NULL DEFAULT 1000,
  -- Kalıcı KP bakiyesi (sezondan sezona taşınmaz — ayrı tablo olarak da modellenebilir)
  kp_balance     INTEGER NOT NULL DEFAULT 150,

  -- Toplam kazanım istatistikleri (sezon bazlı)
  tp_earned_total INTEGER NOT NULL DEFAULT 1000,
  kp_earned_total INTEGER NOT NULL DEFAULT 150,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, season_id),

  CONSTRAINT wallets_tp_non_negative CHECK (tp_balance >= 0),
  CONSTRAINT wallets_kp_non_negative CHECK (kp_balance >= 0)
);

COMMENT ON TABLE  public.wallets            IS 'Kullanıcı başına sezonluk TP/KP bakiyesi';
COMMENT ON COLUMN public.wallets.tp_balance IS 'Tahmin Puanı (sezonluk, sıfırlanabilir)';
COMMENT ON COLUMN public.wallets.kp_balance IS 'Kalıcı Puan (sezonlar arası geçer, bu tabloda anlık bakiye)';

CREATE TRIGGER wallets_set_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Aktif sezon cüzdanını döndüren yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.get_active_wallet(p_user_id UUID)
RETURNS public.wallets AS $$
  SELECT w.*
  FROM   public.wallets w
  JOIN   public.seasons s ON s.id = w.season_id
  WHERE  w.user_id  = p_user_id
    AND  s.ended_at IS NULL
  ORDER BY s.season_number DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- =============================================================================
-- 4. tp_transactions
-- =============================================================================

CREATE TABLE public.tp_transactions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES public.seasons(id),

  -- İşlem türü (EconomyContext.TpTransactionType değerleriyle uyumlu)
  type TEXT NOT NULL,

  -- Pozitif = kazanç, negatif = harcama
  amount        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Opsiyonel referans (prediction_id, auction_id vb.)
  reference_id TEXT,
  note         TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX tp_transactions_user_season_idx
  ON public.tp_transactions (user_id, season_id, created_at DESC);

COMMENT ON TABLE public.tp_transactions IS 'Tahmin Puanı hareket logu (her işlem için bir satır)';


-- =============================================================================
-- 5. kp_transactions
-- =============================================================================

CREATE TABLE public.kp_transactions (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- İşlem türü (EconomyContext.KpTransactionType değerleriyle uyumlu)
  type TEXT NOT NULL,

  -- Pozitif = kazanç, negatif = harcama
  amount        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Opsiyonel referans
  reference_id TEXT,
  note         TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX kp_transactions_user_idx
  ON public.kp_transactions (user_id, created_at DESC);

COMMENT ON TABLE public.kp_transactions IS 'Kalıcı Puan hareket logu';


-- =============================================================================
-- 6. relationships
-- =============================================================================

CREATE TABLE public.relationships (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- 'pending'  → istek gönderildi (kabul bekleniyor)
  -- 'friends'  → karşılıklı kabul edildi
  -- 'blocked'  → user_id, target_user_id'yi engelledi
  status TEXT NOT NULL
    CHECK (status IN ('pending', 'friends', 'blocked')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Her çift için tek kayıt (yön önemli: A→B ve B→A ayrı satırlardır)
  UNIQUE (user_id, target_user_id),

  -- Kendi kendini ekleme yasağı
  CONSTRAINT relationships_no_self CHECK (user_id != target_user_id)
);

CREATE INDEX relationships_user_idx        ON public.relationships (user_id);
CREATE INDEX relationships_target_user_idx ON public.relationships (target_user_id);

COMMENT ON TABLE  public.relationships        IS 'Kullanıcılar arası arkadaşlık/engelleme kayıtları';
COMMENT ON COLUMN public.relationships.status IS 'pending: istek; friends: kabul edilmiş; blocked: engelleme';

CREATE TRIGGER relationships_set_updated_at
  BEFORE UPDATE ON public.relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- =============================================================================
-- 7. moderation_records (Scope Bazlı Moderasyon)
-- =============================================================================

CREATE TABLE public.moderation_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('ban', 'mute')),
  scope_type  TEXT NOT NULL CHECK (scope_type IN ('genel_sohbet', 'takim_sohbeti', 'sohbet_odasi')),
  scope_id    TEXT, -- 'genel_sohbet' için NULL olabilir, diğerleri için zorunlu
  reason      TEXT,
  created_by  TEXT NOT NULL, -- İşlemi yapan admin/mod
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ, -- NULL = kalıcı
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX moderation_records_user_idx ON public.moderation_records (user_id) WHERE is_active = true;

COMMENT ON TABLE public.moderation_records IS 'Scope bazlı ban ve susturma kayıtları';

-- -----------------------------------------------------------------------------
-- Yardımcı Fonksiyon: Backend Seviyesinde Chat Yetki Kontrolü
-- Bu fonksiyon messages tablosunda RLS olarak "WITH CHECK (check_chat_moderation(auth.uid(), 'genel_sohbet', null))" şeklinde kullanılır.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_chat_moderation(
  p_user_id UUID,
  p_scope_type TEXT,
  p_scope_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_restricted BOOLEAN;
BEGIN
  -- 1. Kullanıcının aktif genel_sohbet yasağı varsa (genel_sohbet, arkadaş sohbeti ve dm'leri kapsar)
  SELECT EXISTS (
    SELECT 1 FROM public.moderation_records
    WHERE user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (scope_type = 'genel_sohbet' OR (scope_type = p_scope_type AND (scope_id = p_scope_id OR scope_id IS NULL)))
  ) INTO v_is_restricted;

  -- Eğer kısıtlama varsa FALSE (izin yok), yoksa TRUE (izin var) döner.
  RETURN NOT v_is_restricted;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Güvenlik: Kullanıcılar kendi moderasyon kayıtlarını görebilir, adminler hepsini görebilir.
ALTER TABLE public.moderation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "moderation_records_select"
  ON public.moderation_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'moderator'));

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

-- profiles ────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Giriş yapmış herkes tüm profilleri okuyabilir (sosyal özellikler için gerekli)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Kullanıcı yalnızca kendi profilini güncelleyebilir
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING  (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Rol/izin değişikliği yasak; sadece sunucu tarafı değiştirebilir
    AND role        = (SELECT role        FROM public.profiles WHERE id = auth.uid())
    AND permissions = (SELECT permissions FROM public.profiles WHERE id = auth.uid())
    AND is_banned   = (SELECT is_banned   FROM public.profiles WHERE id = auth.uid())
  );

-- INSERT yalnızca handle_new_user() trigger fonksiyonu üzerinden (SECURITY DEFINER)
-- Bu nedenle ayrıca bir INSERT politikası tanımlamıyoruz.


-- wallets ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Kullanıcı yalnızca kendi cüzdanını görebilir
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Cüzdan yazma işlemleri yalnızca SECURITY DEFINER edge functions üzerinden
-- (uygulama katmanından doğrudan UPDATE yapılamaz)


-- tp_transactions ─────────────────────────────────────────────────────────────
ALTER TABLE public.tp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tp_transactions_select_own"
  ON public.tp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- kp_transactions ─────────────────────────────────────────────────────────────
ALTER TABLE public.kp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kp_transactions_select_own"
  ON public.kp_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- relationships ───────────────────────────────────────────────────────────────
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

-- Kullanıcı kendi ilişkilerini görebilir (gönderilen ve gelen)
CREATE POLICY "relationships_select_own"
  ON public.relationships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- Yalnızca user_id = auth.uid() olan satırları ekleyebilir/güncelleyebilir/silebilir
CREATE POLICY "relationships_insert_own"
  ON public.relationships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "relationships_update_own"
  ON public.relationships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "relationships_delete_own"
  ON public.relationships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- seasons ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;

-- Herkes sezonları okuyabilir (public bilgi)
CREATE POLICY "seasons_select_all"
  ON public.seasons FOR SELECT
  TO authenticated
  USING (true);

-- Yazma işlemleri yalnızca service_role (admin paneli / edge functions)
