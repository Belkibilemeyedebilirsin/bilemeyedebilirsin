/**
 * İstemci tarafı rate limiter.
 *
 * ⚠️  GÜVENLİK UYARISI
 * Bu sınıf yalnızca UI katmanında kullanıcı deneyimini iyileştirmek içindir.
 * Gerçek güvenlik kısıtlaması (brute-force koruması vb.) mutlaka sunucu
 * tarafında (Supabase RLS / Edge Function / Twilio Verify) uygulanmalıdır.
 * İstemci tarafı kısıtlamalar devre dışı bırakılabilir.
 */

type RateLimitEntry = {
  /** Pencere içindeki deneme sayısı. */
  count: number;
  /** Mevcut pencerenin başladığı zaman (ms timestamp). */
  windowStartMs: number;
  /** Blok bitiş zamanı (ms timestamp). Tanımsızsa blok yok. */
  blockedUntil?: number;
};

type RecordResult = {
  blocked: boolean;
  /** Kalan deneme hakkı (blocked ise 0). */
  remaining: number;
  /** Blok bitiş zamanı (ms). Yalnızca blocked = true iken anlamlı. */
  blockedUntilMs?: number;
};

export class RateLimiter {
  private readonly store = new Map<string, RateLimitEntry>();

  /**
   * @param maxAttempts  Pencere içinde izin verilen maksimum deneme.
   * @param windowMs     Sayaç sıfırlama penceresi (milisaniye).
   * @param blockMs      Limit aşıldığında uygulanan blok süresi (milisaniye).
   */
  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
    private readonly blockMs: number,
  ) {}

  private getEntry(key: string): RateLimitEntry {
    return (
      this.store.get(key) ?? { count: 0, windowStartMs: Date.now() }
    );
  }

  /** Verilen anahtar şu an bloklu mu? */
  isBlocked(key: string): boolean {
    const entry = this.getEntry(key);
    return entry.blockedUntil != null && Date.now() < entry.blockedUntil;
  }

  /**
   * Yeni bir deneme kaydeder ve sonucu döndürür.
   * Her çağrıda sayaç artar; maxAttempts aşılırsa blok uygulanır.
   */
  record(key: string): RecordResult {
    const now = Date.now();
    let entry = this.getEntry(key);

    // Aktif blok kontrolü
    if (entry.blockedUntil != null && now < entry.blockedUntil) {
      return {
        blocked: true,
        remaining: 0,
        blockedUntilMs: entry.blockedUntil,
      };
    }

    // Pencere sıfırlama — blok süresi geçmişse veya pencere dolmuşsa
    if (now - entry.windowStartMs > this.windowMs) {
      entry = { count: 0, windowStartMs: now };
    }

    entry.count += 1;

    if (entry.count > this.maxAttempts) {
      entry.blockedUntil = now + this.blockMs;
      this.store.set(key, entry);
      return {
        blocked: true,
        remaining: 0,
        blockedUntilMs: entry.blockedUntil,
      };
    }

    this.store.set(key, entry);
    return {
      blocked: false,
      remaining: this.maxAttempts - entry.count,
    };
  }

  /** Belirli bir anahtarın tüm rate limit verilerini temizler. */
  reset(key: string): void {
    this.store.delete(key);
  }
}

// ─── Uygulama genelinde kullanılan limiter instance'ları ──────────────────────

/**
 * OTP kodu talep limiti.
 * 5 dakika içinde maks 3 istek → aşınca 15 dakika blok.
 */
export const otpRequestLimiter = new RateLimiter(3, 5 * 60_000, 15 * 60_000);

/**
 * OTP kodu doğrulama limiti.
 * 5 dakika içinde maks 5 yanlış deneme → aşınca 15 dakika blok.
 */
export const otpVerifyLimiter = new RateLimiter(5, 5 * 60_000, 15 * 60_000);
