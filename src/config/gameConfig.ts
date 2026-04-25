/**
 * Merkezi oyun ekonomisi konfigürasyonu.
 *
 * Bu dosyada tanımlanan tüm değerler uygulama genelindeki iş kurallarını
 * yönetir. Oran, limit, cooldown, maliyet veya süre değiştirmek gerektiğinde
 * yalnızca bu dosyayı düzenlemek yeterlidir.
 *
 * "as const" ile tanımlandığı için tüm değerler TypeScript tarafından
 * literal tip olarak ele alınır ve yanlış değer ataması derleme hatası verir.
 */
export const GAME_CONFIG = {
  // ────────────────────────────────────────────
  // SEVİYE VE ÖZELLİK KİLİT SİSTEMİ
  // ────────────────────────────────────────────
  levelSystem: {
    /** Maksimum ulaşılabilecek seviye. */
    maxLevel: 9,
    
    /** Başlangıçta (Level 1) açık olan temel özellikler. */
    baseFeatures: [
      "tasks", 
      "coupons", 
      "store", 
      "time_travel", 
      "profile", 
      "settings",
      "auction"
    ] as const,

    /** 
     * Hangi seviyede hangi özelliğin açılacağını belirleyen kilit haritası.
     * Yeni seviyeler eklemek için sadece bu listeyi güncellemek yeterlidir.
     */
    unlocks: {
      2: { id: "global_chat", name: "Genel Sohbet", description: "Diğer oyuncularla anlık mesajlaş." },
      3: { id: "friends", name: "Arkadaşlar", description: "Arkadaş ekle ve sosyal çevreni kur." },
      4: { id: "dm", name: "Özel Mesajlar", description: "Arkadaşlarınla birebir özel mesajlaş." },
      5: { id: "teams", name: "Takımlar", description: "Bir takıma katıl veya kendi takımını kur." },
      6: { id: "leaderboard", name: "Sıralama", description: "Liderlik tablosundaki yerini gör." },
      7: { id: "social_feed", name: "Topluluk Akışı", description: "Gelişmiş sosyal akış ve görünürlük." },
      8: { id: "chat_rooms", name: "Sohbet Odaları", description: "Kendi sohbet odanı oluştur ve diğer odalara katıl." },
      9: { id: "premium_module", name: "Premium Modül", description: "En üst seviye uygulama özellikleri." },
    } as const,
  },

  // ────────────────────────────────────────────
  // TAHMİN EKONOMİSİ
  // ────────────────────────────────────────────
  prediction: {
    /** Kullanıcının tek bir soruya yatırabileceği maksimum TP oranı (bakiyenin %75'i). */
    maxStakeRatio: 0.75,

    /**
     * Bu eşiğin altındaki bakiyelerde maxStakeRatio esnekliği uygulanır;
     * düşük bakiyeli kullanıcı tüm bakiyesini yatırabilir.
     */
    lowBalanceThreshold: 200,

    /** Parimutuel havuzdan alınan sistem kesintisi oranı (%2). */
    parimutuelSystemCut: 0.02,

    /** Havuz çok küçükken gösterilecek minimum oran alt sınırı. */
    minDisplayOdd: 1.01,

    /** Havuz çok dengesizken gösterilecek maksimum oran üst sınırı. */
    maxDisplayOdd: 50.0,

    /**
     * Başlangıç oranlarının dengeli olmasını (örn. 1.96) ve ufak bahislerde
     * aniden zıplamasını engelleyen sanal başlangıç havuzu (likidite).
     */
    baseLiquidity: 200,

    /** Bir kullanıcının tek bir soruya yatırabileceği minimum TP. */
    minStakePerQuestion: 10,

    /** Oran snapshot'ı kaydedilme aralığı (ms). Her stake'te + bu aralıkta. */
    oddsSnapshotIntervalMs: 60_000,

    /** Soru başına tutulacak maksimum oran snapshot sayısı. */
    maxOddsSnapshots: 200,

    /**
     * Açık (open) veya kapalı (closed) bir tahmin detayını görüntülemek
     * için gereken KP miktarı. Sonuçlanmış ve iptal edilmiş tahminler ücretsizdir.
     * 0 → erişim kapısı devre dışı.
     */
    openAccessCostKp: 50,

    /**
     * Kaybeden tarafın yatırdığı TP'nin KP'ye dönüştürülecek oranı.
     * 0.25 → kaybedilen TP'nin %25'i KP olarak geri verilir.
     */
    predictionLossKpRate: 0.25,
  },

  // ────────────────────────────────────────────
  // SEZON YAPISI
  // ────────────────────────────────────────────
  season: {
    /** Tahmin fazının süresi (gün). */
    predictionPhaseDays: 10,

    /** Sonuç açıklama fazının süresi (gün). */
    resultPhaseDays: 1,

    /** Açık artırma fazının süresi (gün). */
    auctionPhaseDays: 2,

    /**
     * Sezon sonunda harcanmamış TP'nin KP'ye dönüşüm oranı.
     * 1.0 → 1 TP = 1 KP.
     * Kaybedilen tahmin/artırma TP'leri de aynı oranı kullanır.
     */
    tpToKpConversionRate: 1.0,
  },

  // ────────────────────────────────────────────
  // AÇIK ARTIRMA
  // ────────────────────────────────────────────
  auction: {
    /** Bir açık artırmaya girebilmek için gereken minimum başlangıç teklifi (TP). */
    minStarterBid: 100,

    /**
     * Normal süreçte geçerli olan minimum teklif artış miktarı (TP).
     * Son dakika fazlarında bu değer orana bağlı kurala geçer.
     */
    defaultMinIncrement: 50,

    /** Bir kullanıcının aynı anda aktif olarak katılabileceği maksimum açık artırma sayısı. */
    maxActiveParticipations: 5,

    /** Bitiş saatinden bu kadar dakika önce yeni katılım kapanır. */
    newEntryClosedMinutes: 60,

    /** Son bu kadar dakikada yalnızca en yüksek teklifçiler artırabilir. */
    finalPhaseMinutes: 5,

    /** Final fazında artırım yapabilecek maksimum kullanıcı sayısı (sıralamaya göre). */
    finalPhaseTopBidderCount: 50,

    /** Normal süreçte teklif artırımları arası bekleme süresi (dakika). */
    cooldownMinutes: 30,

    /** Son 1 saatte geçerli olan teklif artırımları arası bekleme süresi (dakika). */
    lastHourCooldownMinutes: 20,

    /**
     * Son 30 dakikada minimum teklif artışı, mevcut en yüksek teklifin
     * bu oranından az olamaz (%20).
     */
    last30MinMinIncrementRatio: 0.2,

    /**
     * Son 10 dakikada minimum teklif artışı, mevcut en yüksek teklifin
     * bu oranından az olamaz (%50).
     */
    last10MinMinIncrementRatio: 0.5,
  },

  // ────────────────────────────────────────────
  // SOHBET
  // ────────────────────────────────────────────
  chat: {
    /** Kategori sohbetinde mesajlar arası minimum bekleme süresi (saniye). */
    categoryCooldownSeconds: 15,

    /** Global sohbette normal mesajlar arası minimum bekleme süresi (saniye). */
    globalCooldownSeconds: 10,

    /** Yeni sohbet odası oluşturma maliyeti (KP). */
    roomCreationCostKp: 100,

    /**
     * Genel sohbette öne çıkan duyuru gönderme maliyeti (KP).
     * Normal mesajlar ücretsizdir; duyuru mesajları ücretlidir.
     */
    announcementCostKp: 50,
  },

  // ────────────────────────────────────────────
  // TAKIM
  // ────────────────────────────────────────────
  team: {
    /** Bir takımda bulunabilecek maksimum üye sayısı. */
    maxMembers: 25,

    /** Bir takımın aynı anda gönderebileceği maksimum aktif davet sayısı. */
    maxActiveInvites: 10,

    /** Bir kullanıcının aynı anda üye olabileceği maksimum takım sayısı. */
    maxTeamsPerUser: 1,
  },

  // ────────────────────────────────────────────
  // XP VE İLERLEME
  // ────────────────────────────────────────────
  xp: {
    /** Tekli tahmin kazanıldığında verilen XP miktarı. */
    singlePredictionWin: 25,

    /** Kupon kazanıldığında verilen XP miktarı. */
    couponWin: 45,

    /** Görev tamamlandığında verilen XP miktarı. */
    taskClaim: 40,

    /**
     * Seviye 2'ye çıkmak için gereken XP eşiği (baz değer).
     * Her seviye için eşik: levelBaseThreshold + (level - 1) * levelIncrementPerLevel
     */
    levelBaseThreshold: 120,

    /** Her seviyede eşiğe eklenen XP miktarı. */
    levelIncrementPerLevel: 80,
  },
  // ────────────────────────────────────────────
  // EKONOMİ
  // ────────────────────────────────────────────
  economy: {
    /** Sezon başlangıcında kullanıcıya verilen TP miktarı. */
    seasonStartTp: 1000,

    /** Günlük giriş ödülü (TP). */
    dailyLoginRewardTp: 100,

    /** Ardışık giriş günü başına ek bonus (TP). Her gün +streakBonusTp eklenir. */
    dailyLoginStreakBonusTp: 10,

    /** Ardışık giriş bonusu üst sınırı (TP). */
    dailyLoginStreakBonusCap: 50,

    /** Bonus TP kaynakları ve miktarları. */
    bonusTp: {
      /** Arkadaş davet etme bonusu. */
      friendInvite: 200,
      /** İlk kupon oluşturma bonusu. */
      firstCoupon: 150,
      /** Profil tamamlama bonusu. */
      profileComplete: 100,
      /** Haftalık aktiflik bonusu (7 ardışık gün giriş). */
      weeklyActivity: 300,
    },

    /** Client tarafında tutulan maksimum işlem log sayısı. */
    maxTransactionLogSize: 500,
  },

  // ────────────────────────────────────────────
  // GÖREV SİSTEMİ
  // ────────────────────────────────────────────
  tasks: {
    /** Günlük görev ödüllerine ek olarak verilen XP. */
    dailyTaskXp: 40,

    /** Haftalık görev ödüllerine ek olarak verilen XP. */
    weeklyTaskXp: 100,

    /** Sezonluk görev ödüllerine ek olarak verilen XP. */
    seasonalTaskXp: 250,
  },

  // ────────────────────────────────────────────
  // PREMIUM PASS
  // ────────────────────────────────────────────
  pass: {
    /** Pass'ın KP cinsinden mock fiyatı (gerçek para yerine mock için). */
    mockCostKp: 0,

    /**
     * Pass satın alındığında verilecek tek seferlik TP bonusu.
     * Düşük etkili TP ikramiyesi olarak tanımlanmıştır.
     */
    purchaseBonusTp: 200,

    /** Pass günleri sayısı. */
    totalDays: 14,
  },

  // ────────────────────────────────────────────
  // TEK SEFERLİK TP BONUSLARI
  // ────────────────────────────────────────────
  bonusActions: {
    /** Profil fotoğrafı ve biyografi doldurulduğunda verilen TP. */
    profileComplete: 100,

    /** İlk kupon oluşturulduğunda verilen TP. */
    firstCoupon: 150,

    /** İlk kez 7 günlük streak tamamlandığında verilen TP. */
    weeklyStreak: 300,

    /** Arkadaş davetinde her iki tarafa verilen TP. */
    friendInvite: 200,

    /** İlk kez tahmin kazanıldığında verilen TP. */
    firstWin: 250,
  },

  // ────────────────────────────────────────────
  // KP SATIN ALMA MAĞAZASI
  // ────────────────────────────────────────────
  kpStore: {
    /**
     * Satın alınabilir KP paketleri.
     * mockPriceTl: Gerçek para entegrasyonuna kadar gösterim amaçlı mock fiyat.
     * bonusKp: Pakete dahil ek KP (toplam = kpBase + bonusKp).
     */
    packages: [
      { id: "starter",  label: "Başlangıç Paketi", kpBase: 500,  bonusKp: 0,    mockPriceTl: 9.99  },
      { id: "standard", label: "Standart Paket",   kpBase: 1000, bonusKp: 100,  mockPriceTl: 19.99 },
      { id: "value",    label: "Değer Paketi",      kpBase: 2500, bonusKp: 300,  mockPriceTl: 44.99 },
      { id: "mega",     label: "Mega Paket",        kpBase: 5000, bonusKp: 1000, mockPriceTl: 89.99 },
    ] as const,

    fraud: {
      /** İki ardışık satın alma arasında gereken minimum süre (ms). */
      minPurchaseIntervalMs: 30_000,

      /** Takvim günü başına izin verilen maksimum satın alma adedi. */
      maxPurchasesPerDay: 5,

      /** Takvim günü başına toplam KP edinim üst sınırı (satın alma yoluyla). */
      maxKpPerDay: 10_000,
    },

    refund: {
      /** İade talebinin geçerli olduğu pencere (ms). 24 saat = 86 400 000 ms. */
      eligibilityWindowMs: 86_400_000,
    },
  },

  // ────────────────────────────────────────────
  // AUTH VE KULLANICI
  // ────────────────────────────────────────────
  auth: {
    /** OTP yeniden gönderim için bekleme süresi (saniye). */
    otpResendCooldownSeconds: 60,

    /** OTP kodunun sunucu tarafı geçerlilik süresi (saniye). Bilgi amaçlı. */
    otpExpirySeconds: 300,

    /** Kullanıcı adı minimum karakter sayısı. */
    usernameMinLength: 3,

    /** Kullanıcı adı maksimum karakter sayısı. */
    usernameMaxLength: 24,

    /** Görünen ad maksimum karakter sayısı. */
    displayNameMaxLength: 30,

    /** Bio maksimum karakter sayısı. */
    bioMaxLength: 120,

    /** Şifre minimum karakter sayısı. */
    passwordMinLength: 8,

    /** Şifre maksimum karakter sayısı. */
    passwordMaxLength: 72,
  },
} as const;
