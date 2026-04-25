import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { GAME_CONFIG } from "../config/gameConfig";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import type {
  AuthUser,
  EmailAuthStep,
  OtpSession,
  ProfileSetupData,
} from "../types/user";
import { otpRequestLimiter, otpVerifyLimiter } from "../utils/rateLimit";

// ─── Yardımcı tipler ─────────────────────────────────────────────────────────

type PendingSignup = {
  email: string;
  username: string;
};

type ActionResult = {
  ok: boolean;
  message: string;
};

type OtpRequestResult = ActionResult & {
  cooldownSeconds?: number;
};

type AuthContextType = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  step: EmailAuthStep;
  otpSession: OtpSession | null;

  requestOtp: (email: string) => Promise<OtpRequestResult>;
  verifyOtp: (code: string) => Promise<ActionResult>;
  completeProfile: (data: ProfileSetupData) => Promise<ActionResult>;
  signInWithPassword: (identifier: string, password: string) => Promise<ActionResult>;
  signUpWithPassword: (data: {
    email: string;
    username: string;
    password: string;
    passwordConfirm: string;
  }) => Promise<ActionResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

// ─── Doğrulama yardımcıları ───────────────────────────────────────────────────

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidUsername(username: string): boolean {
  const { usernameMinLength, usernameMaxLength } = GAME_CONFIG.auth;
  const pattern = new RegExp(
    `^[a-z0-9_]{${usernameMinLength},${usernameMaxLength}}$`
  );
  return pattern.test(username);
}

// ─── DB satırı → AuthUser dönüşümü ───────────────────────────────────────────

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function dbRowToAuthUser(row: ProfileRow, email: string): AuthUser {
  return {
    id: row.id,
    username: row.username ?? "",
    displayName: row.display_name,
    email,
    emailVerified: row.email_verified,
    emailVerifiedAt: row.email_verified_at
      ? new Date(row.email_verified_at).getTime()
      : undefined,
    role: row.role,
    permissions: row.permissions,
    avatarCode: row.avatar_code,
    titleText: row.title_text,
    frameColor: row.frame_color,
    bio: row.bio,
    profileCompleted: row.profile_completed,
    isBanned: row.is_banned,
    bannedUntil: row.banned_until
      ? new Date(row.banned_until).getTime()
      : undefined,
    createdAt: new Date(row.created_at).getTime(),
    lastSeenAt: new Date(row.last_seen_at).getTime(),
  };
}

async function fetchProfile(userId: string, email: string): Promise<AuthUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return dbRowToAuthUser(data, email);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<EmailAuthStep>("email");
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);

  // Ref ile signup verisini saklarız; onAuthStateChange closure'ı her zaman güncel değeri okur.
  const pendingSignupRef = useRef<PendingSignup | null>(null);

  const isAuthenticated = currentUser !== null && currentUser.profileCompleted;

  // ─── Oturum restore + auth durum dinleyicisi ─────────────────────────────────

  useEffect(() => {
    let mounted = true;

    // Güvenlik ağı: Supabase getSession() web'de zaman zaman takılabiliyor
    // (özellikle ilk yüklemede). 4 saniye sonra hâlâ yükleniyorsa zorla
    // false'a çek; onAuthStateChange daha sonra session gelirse devreye girer.
    const fallbackTimer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 4000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          if (mounted) {
            setCurrentUser(null);
            setStep("email");
            setIsLoading(false);
          }
          return;
        }
        const profile = await fetchProfile(session.user.id, session.user.email ?? "");
        if (!mounted) return;
        if (profile) {
          setCurrentUser(profile);
          setStep(profile.profileCompleted ? "done" : "profile");
        } else {
          setCurrentUser(null);
          setStep("email");
        }
      } catch (err) {
        console.warn("Auth init hatası:", err);
      } finally {
        clearTimeout(fallbackTimer);
        if (mounted) setIsLoading(false);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === ("INITIAL_SESSION" as any)) return;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id, session.user.email ?? "");

          if (!mounted) return;

          if (profile) {
            // Kayıt akışı: OTP sonrası profili username ile otomatik tamamla
            if (!profile.profileCompleted && pendingSignupRef.current) {
              const pending = pendingSignupRef.current;
              pendingSignupRef.current = null;

              const { error } = await supabase
                .from("profiles")
                .update({
                  username: pending.username,
                  display_name: pending.username,
                  profile_completed: true,
                  last_seen_at: new Date().toISOString(),
                })
                .eq("id", session.user.id);

              if (!mounted) return;

              if (!error) {
                const updated = await fetchProfile(session.user.id, session.user.email ?? "");
                if (!mounted) return;
                setCurrentUser(updated);
                setStep("done");
              } else {
                // Username çakışması veya başka hata → profil kurulum ekranına gönder
                setCurrentUser(profile);
                setStep("profile");
              }
            } else if (!profile.profileCompleted) {
              setCurrentUser(profile);
              setStep("profile");
            } else {
              setCurrentUser(profile);
              setStep("done");
            }
          } else {
            setCurrentUser(null);
            setStep("email");
          }
        } else {
          setCurrentUser(null);
          if (event !== ("INITIAL_SESSION" as any)) {
            setStep("email");
            setOtpSession(null);
          }
        }

        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  // ─── OTP gönder (şifresiz giriş akışı) ──────────────────────────────────────

  const requestOtp = useCallback(async (email: string): Promise<OtpRequestResult> => {
    const trimmed = email.trim().toLowerCase();

    if (!isValidEmail(trimmed)) {
      return {
        ok: false,
        message: "Geçerli bir e-posta adresi gir. Örnek: kullanici@mail.com",
      };
    }

    const limitResult = otpRequestLimiter.record(trimmed);
    if (limitResult.blocked) {
      const waitMin = Math.ceil(
        ((limitResult.blockedUntilMs ?? Date.now()) - Date.now()) / 60_000
      );
      return {
        ok: false,
        message: `Çok fazla istek gönderildi. ${waitMin} dakika sonra tekrar dene.`,
      };
    }

    const { error } = await supabase.auth.signInWithOtp({ email: trimmed });

    if (error) {
      return { ok: false, message: error.message };
    }

    setOtpSession({
      email: trimmed,
      sentAt: Date.now(),
      attemptCount: 0,
      verified: false,
    });
    setStep("otp");

    return {
      ok: true,
      message: "Doğrulama kodu e-postana gönderildi.",
      cooldownSeconds: GAME_CONFIG.auth.otpResendCooldownSeconds,
    };
  }, []);

  // ─── OTP doğrula ─────────────────────────────────────────────────────────────

  const verifyOtp = useCallback(async (code: string): Promise<ActionResult> => {
    if (!otpSession) {
      return { ok: false, message: "Önce e-posta adresini gir." };
    }

    if (!/^\d{6,8}$/.test(code)) {
      return { ok: false, message: "6–8 haneli kodu eksiksiz gir." };
    }

    const limitResult = otpVerifyLimiter.record(otpSession.email);
    if (limitResult.blocked) {
      const waitMin = Math.ceil(
        ((limitResult.blockedUntilMs ?? Date.now()) - Date.now()) / 60_000
      );
      return {
        ok: false,
        message: `Çok fazla hatalı deneme. ${waitMin} dakika sonra tekrar dene.`,
      };
    }

    // Kayıt akışında 'signup', şifresiz giriş akışında 'email'
    const type = pendingSignupRef.current ? "signup" : "email";

    const { error } = await supabase.auth.verifyOtp({
      email: otpSession.email,
      token: code,
      type,
    });

    if (error) {
      return { ok: false, message: "Kod hatalı veya süresi dolmuş." };
    }

    otpVerifyLimiter.reset(otpSession.email);
    setOtpSession((prev) => (prev ? { ...prev, verified: true } : prev));

    // onAuthStateChange profil yükleme ve adım geçişini yönetir
    return {
      ok: true,
      message: pendingSignupRef.current
        ? "E-posta doğrulandı, hoş geldin!"
        : "E-posta doğrulandı.",
    };
  }, [otpSession]);

  // ─── Profil tamamla (şifresiz akış → profil kurulum ekranı) ──────────────────

  const completeProfile = useCallback(async (data: ProfileSetupData): Promise<ActionResult> => {
    if (!isValidUsername(data.username)) {
      const { usernameMinLength, usernameMaxLength } = GAME_CONFIG.auth;
      return {
        ok: false,
        message: `Kullanıcı adı ${usernameMinLength}–${usernameMaxLength} karakter, yalnızca küçük harf, rakam ve alt çizgi içerebilir.`,
      };
    }

    const trimmedDisplay = data.displayName.trim();
    if (!trimmedDisplay || trimmedDisplay.length > GAME_CONFIG.auth.displayNameMaxLength) {
      return {
        ok: false,
        message: `Görünen ad 1–${GAME_CONFIG.auth.displayNameMaxLength} karakter arasında olmalı.`,
      };
    }

    const trimmedBio = (data.bio ?? "").trim();
    if (trimmedBio.length > GAME_CONFIG.auth.bioMaxLength) {
      return {
        ok: false,
        message: `Bio en fazla ${GAME_CONFIG.auth.bioMaxLength} karakter olabilir.`,
      };
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { ok: false, message: "Oturum bulunamadı." };
    }

    // Username benzersizlik kontrolü (kullanıcı zaten authenticate)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", data.username)
      .neq("id", session.user.id)
      .maybeSingle();

    if (existingProfile) {
      return { ok: false, message: "Bu kullanıcı adı zaten kullanılıyor." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        username: data.username,
        display_name: trimmedDisplay,
        bio: trimmedBio,
        profile_completed: true,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      return { ok: false, message: "Profil kaydedilemedi." };
    }

    const updatedProfile = await fetchProfile(session.user.id, session.user.email ?? "");
    setCurrentUser(updatedProfile);
    setStep("done");
    setOtpSession(null);

    return { ok: true, message: "Profil oluşturuldu." };
  }, []);

  // ─── Şifre ile giriş ─────────────────────────────────────────────────────────

  const signInWithPassword = useCallback(
    async (identifier: string, password: string): Promise<ActionResult> => {
      const trimmed = identifier.trim().toLowerCase();

      if (!trimmed) {
        return { ok: false, message: "E-posta veya kullanıcı adını gir." };
      }

      const looksLikeEmail = trimmed.includes("@");
      let loginEmail = trimmed;

      if (looksLikeEmail) {
        if (!isValidEmail(trimmed)) {
          return { ok: false, message: "Geçerli bir e-posta adresi gir." };
        }
      } else {
        // Kullanıcı adından e-postayı bulmak için güvenli RPC çağrısı
        const { data: emailData, error: rpcError } = await supabase.rpc("get_email_for_login" as any, { p_username: trimmed });
        if (rpcError || !emailData) {
          return { ok: false, message: "Bu kullanıcı adıyla kayıtlı bir hesap bulunamadı." };
        }
        loginEmail = emailData as string;
      }

      const { passwordMinLength, passwordMaxLength } = GAME_CONFIG.auth;
      if (password.length < passwordMinLength || password.length > passwordMaxLength) {
        return {
          ok: false,
          message: `Şifre ${passwordMinLength}–${passwordMaxLength} karakter olmalı.`,
        };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        return { ok: false, message: "E-posta veya şifre hatalı." };
      }

      // onAuthStateChange oturumu yükler
      return { ok: true, message: "Giriş başarılı." };
    },
    []
  );

  // ─── Şifre ile kayıt ─────────────────────────────────────────────────────────

  const signUpWithPassword = useCallback(
    async (data: {
      email: string;
      username: string;
      password: string;
      passwordConfirm: string;
    }): Promise<ActionResult> => {
      const email = data.email.trim().toLowerCase();
      const username = data.username.trim().toLowerCase();

      if (!isValidEmail(email)) {
        return { ok: false, message: "Geçerli bir e-posta adresi gir." };
      }

      if (!isValidUsername(username)) {
        const { usernameMinLength, usernameMaxLength } = GAME_CONFIG.auth;
        return {
          ok: false,
          message: `Kullanıcı adı ${usernameMinLength}–${usernameMaxLength} karakter, küçük harf/rakam/alt çizgi.`,
        };
      }

      const { passwordMinLength, passwordMaxLength } = GAME_CONFIG.auth;
      if (
        data.password.length < passwordMinLength ||
        data.password.length > passwordMaxLength
      ) {
        return {
          ok: false,
          message: `Şifre ${passwordMinLength}–${passwordMaxLength} karakter olmalı.`,
        };
      }

      if (!/[A-Z]/.test(data.password)) {
        return { ok: false, message: "Şifreniz en az 1 adet büyük harf içermelidir." };
      }

      // Kullanıcı adı benzersizlik kontrolü (RPC, çünkü profiles SELECT anon'a kapalı)
      const { data: available, error: availErr } = await supabase.rpc(
        "is_username_available" as any,
        { p_username: username }
      );

      if (availErr) {
        return { ok: false, message: "Kullanıcı adı kontrol edilemedi." };
      }
      if (available === false) {
        return { ok: false, message: "Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane seç." };
      }

      if (data.password !== data.passwordConfirm) {
        return { ok: false, message: "Şifreler eşleşmiyor." };
      }

      const { error } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: { data: { username } },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          return { ok: false, message: "Bu e-posta zaten kayıtlı." };
        }
        return { ok: false, message: error.message };
      }

      pendingSignupRef.current = { email, username };
      setOtpSession({
        email,
        sentAt: Date.now(),
        attemptCount: 0,
        verified: false,
      });
      setStep("otp");

      return { ok: true, message: "Doğrulama kodu e-postana gönderildi." };
    },
    []
  );

  // ─── Çıkış ───────────────────────────────────────────────────────────────────

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase çıkış hatası:", err);
    } finally {
      setCurrentUser(null);
      setStep("email");
      setOtpSession(null);
    }
  }, []);

  // ─── Hesap sil ───────────────────────────────────────────────────────────────

  const deleteAccount = useCallback(async (): Promise<void> => {
    // TODO: Supabase'de delete_user_account RPC'si ile sunucu tarafında silinmeli
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Supabase hesap silme çıkış hatası:", err);
    } finally {
      setCurrentUser(null);
      setStep("email");
      setOtpSession(null);
    }
  }, []);

  // ─── Context değeri ──────────────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      isLoading,
      step,
      otpSession,
      requestOtp,
      verifyOtp,
      completeProfile,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      deleteAccount,
    }),
    [
      currentUser,
      isAuthenticated,
      isLoading,
      step,
      otpSession,
      requestOtp,
      verifyOtp,
      completeProfile,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      deleteAccount,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
