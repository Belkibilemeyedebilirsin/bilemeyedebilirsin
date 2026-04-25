import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { GAME_CONFIG } from "../../config/gameConfig";
import { useAuth } from "../../context/AuthContext";

type FieldErrors = {
  email?: string;
  username?: string;
  password?: string;
  passwordConfirm?: string;
};

export default function KayitScreen() {
  const router = useRouter();
  const { signUpWithPassword, verifyOtp, requestOtp, step, otpSession } =
    useAuth();

  // ─── Kayıt formu ────────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  // ─── OTP adımı ──────────────────────────────────────────────────────────────
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Kayıt başarılıysa cooldown sayacını başlat
  useEffect(() => {
    if (step === "otp" && otpSession) {
      const { otpResendCooldownSeconds } = GAME_CONFIG.auth;
      setResendCooldown(otpResendCooldownSeconds);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [step, otpSession]);

  const { usernameMinLength, usernameMaxLength, passwordMinLength } =
    GAME_CONFIG.auth;

  async function handleSignUp() {
    setErrors({});
    setFormError("");
    setLoading(true);

    const result = await signUpWithPassword({
      email,
      username,
      password,
      passwordConfirm,
    });
    setLoading(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }
  }

  async function handleVerifyOtp() {
    setOtpError("");
    setOtpLoading(true);
    const result = await verifyOtp(otpCode);
    setOtpLoading(false);
    if (!result.ok) {
      setOtpError(result.message);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || !otpSession) return;
    const result = await requestOtp(otpSession.email);
    if (result.ok) {
      const { otpResendCooldownSeconds } = GAME_CONFIG.auth;
      setResendCooldown(result.cooldownSeconds ?? otpResendCooldownSeconds);
      setOtpCode("");
      setOtpError("");
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(cooldownRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
  }

  const isReady =
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= passwordMinLength &&
    passwordConfirm.length >= passwordMinLength;

  // ─── OTP ekranı ─────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: "#0b1020" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 24,
            paddingTop: 72,
            paddingBottom: 40,
            justifyContent: "center",
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* İkon */}
          <View style={{ alignItems: "center", marginBottom: 28 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 22,
                backgroundColor: "#0d2235",
                borderWidth: 1.5,
                borderColor: "#14b8a6",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Ionicons name="mail-open-outline" size={34} color="#14b8a6" />
            </View>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 24,
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              E-postanı Doğrula
            </Text>
              <Text
              style={{
                color: "#94a3b8",
                fontSize: 14,
                textAlign: "center",
                lineHeight: 21,
              }}
            >
              <Text style={{ color: "#e2e8f0", fontWeight: "700" }}>
                {otpSession?.email}
              </Text>{"\n"}
                adresine 6–8 haneli bir kod gönderdik.
            </Text>
          </View>

          {/* Kod girişi */}
          <View
            style={{
              backgroundColor: "#111a33",
              borderRadius: 22,
              padding: 22,
              borderWidth: 1,
              borderColor: "#1f2a48",
            }}
          >
            <Text style={styles.label}>DOĞRULAMA KODU</Text>
            <View
              style={[
                styles.inputWrapper,
                otpError ? styles.inputError : null,
                { marginBottom: 0 },
              ]}
            >
              <Ionicons name="keypad-outline" size={18} color="#64748b" />
              <TextInput
                style={[styles.input, { letterSpacing: 6, fontSize: 22, fontWeight: "800" }]}
                placeholder="------"
                placeholderTextColor="#334155"
                keyboardType="number-pad"
                maxLength={8}
                value={otpCode}
                onChangeText={(v) => {
                  setOtpCode(v.replace(/\D/g, ""));
                  setOtpError("");
                }}
                onSubmitEditing={handleVerifyOtp}
                returnKeyType="go"
                autoFocus
              />
            </View>

            {otpError ? (
              <Text style={{ color: "#f87171", fontSize: 13, marginTop: 10, lineHeight: 18 }}>
                {otpError}
              </Text>
            ) : null}

            {/* Doğrula butonu */}
            <Pressable
              onPress={handleVerifyOtp}
              disabled={otpCode.length < 6 || otpCode.length > 8 || otpLoading}
              style={{
                backgroundColor:
                  otpCode.length >= 6 && otpCode.length <= 8 && !otpLoading
                    ? "#14b8a6"
                    : "#1e293b",
                paddingVertical: 16,
                borderRadius: 14,
                alignItems: "center",
                marginTop: 18,
              }}
            >
              <Text
                style={{
                  color:
                    otpCode.length >= 6 && otpCode.length <= 8 && !otpLoading
                      ? "#ffffff"
                      : "#64748b",
                  fontSize: 16,
                  fontWeight: "800",
                  letterSpacing: 0.3,
                }}
              >
                {otpLoading ? "Doğrulanıyor…" : "Kodu Onayla"}
              </Text>
            </Pressable>

            {/* Yeniden gönder */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 18,
              }}
            >
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                Kodu almadın mı?{" "}
              </Text>
              <Pressable
                onPress={handleResend}
                disabled={resendCooldown > 0}
                hitSlop={8}
              >
                <Text
                  style={{
                    color: resendCooldown > 0 ? "#334155" : "#14b8a6",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {resendCooldown > 0
                    ? `Tekrar gönder (${resendCooldown}s)`
                    : "Tekrar Gönder"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── Kayıt formu ─────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0b1020" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: 60,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Geri */}
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 28,
            alignSelf: "flex-start",
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#14b8a6" />
          <Text
            style={{
              color: "#14b8a6",
              fontSize: 15,
              fontWeight: "700",
              marginLeft: 2,
            }}
          >
            Geri
          </Text>
        </Pressable>

        {/* Başlık */}
        <Text
          style={{
            color: "#ffffff",
            fontSize: 28,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          Hesap Oluştur
        </Text>
        <Text
          style={{
            color: "#94a3b8",
            fontSize: 14,
            marginBottom: 28,
            lineHeight: 20,
          }}
        >
          Bilebilirsin topluluğuna katıl, tahminlerini yap, sezonda yüksel.
        </Text>

        {/* Form kartı */}
        <View
          style={{
            backgroundColor: "#111a33",
            borderRadius: 22,
            padding: 22,
            borderWidth: 1,
            borderColor: "#1f2a48",
            gap: 16,
          }}
        >
          {/* E-posta */}
          <View>
            <Text style={styles.label}>E-POSTA</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.email ? styles.inputError : null,
              ]}
            >
              <Ionicons name="mail-outline" size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="ornek@mail.com"
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErrors((e) => ({ ...e, email: undefined }));
                  setFormError("");
                }}
              />
            </View>
          </View>

          {/* Kullanıcı adı */}
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>KULLANICI ADI</Text>
              <Text style={styles.hint}>
                {usernameMinLength}–{usernameMaxLength} karakter
              </Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errors.username ? styles.inputError : null,
              ]}
            >
              <Text style={{ color: "#64748b", fontWeight: "700" }}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="kullanici_adi"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={usernameMaxLength}
                value={username}
                onChangeText={(v) => {
                  setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setErrors((e) => ({ ...e, username: undefined }));
                  setFormError("");
                }}
              />
            </View>
          </View>

          {/* Şifre */}
          <View>
            <View style={styles.labelRow}>
              <Text style={styles.label}>ŞİFRE</Text>
              <Text style={styles.hint}>En az {passwordMinLength} karakter</Text>
            </View>
            <View
              style={[
                styles.inputWrapper,
                errors.password ? styles.inputError : null,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setErrors((e) => ({ ...e, password: undefined }));
                  setFormError("");
                }}
              />
              <Pressable
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#64748b"
                />
              </Pressable>
            </View>
          </View>

          {/* Şifre tekrar */}
          <View>
            <Text style={styles.label}>ŞİFRE (TEKRAR)</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.passwordConfirm ? styles.inputError : null,
              ]}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#64748b"
              />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={!showPassword}
                value={passwordConfirm}
                onChangeText={(v) => {
                  setPasswordConfirm(v);
                  setErrors((e) => ({ ...e, passwordConfirm: undefined }));
                  setFormError("");
                }}
                onSubmitEditing={handleSignUp}
                returnKeyType="go"
              />
            </View>
          </View>

          {/* Hata */}
          {formError ? (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {formError}
            </Text>
          ) : null}

          {/* Kayıt butonu */}
          <Pressable
            onPress={handleSignUp}
            disabled={!isReady || loading}
            style={{
              backgroundColor:
                isReady && !loading ? "#14b8a6" : "#1e293b",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: isReady && !loading ? "#ffffff" : "#64748b",
                fontSize: 16,
                fontWeight: "800",
                letterSpacing: 0.3,
              }}
            >
              {loading ? "Oluşturuluyor…" : "Hesap Oluştur"}
            </Text>
          </Pressable>
        </View>

        {/* Giriş yönlendirmesi */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 28,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 14 }}>
            Zaten hesabın var mı?{" "}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text
              style={{
                color: "#14b8a6",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Giriş Yap
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  label: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700" as const,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  labelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  hint: {
    color: "#64748b",
    fontSize: 11,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderWidth: 1.5,
    borderColor: "#243049",
    backgroundColor: "#0b1328",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
    color: "#ffffff",
  },
};
