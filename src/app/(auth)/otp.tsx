import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { GAME_CONFIG } from "../../config/gameConfig";
import { useAuth } from "../../context/AuthContext";

export default function OtpScreen() {
  const router = useRouter();
  const { email, cooldown } = useLocalSearchParams<{
    email: string;
    cooldown: string;
  }>();
  const { verifyOtp, requestOtp } = useAuth();

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(
    Number(cooldown) || GAME_CONFIG.auth.otpResendCooldownSeconds
  );

  const inputRef = useRef<TextInput>(null);

  // Geri sayım
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  async function handleVerify() {
    setError("");
    setLoading(true);

    const result = await verifyOtp(code);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      setCode("");
      inputRef.current?.focus();
      return;
    }

    router.replace("/(auth)/profil-olustur");
  }

  async function handleResend() {
    if (!email || resendCountdown > 0) return;
    setError("");
    setCode("");

    const result = await requestOtp(email);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setResendCountdown(
      result.cooldownSeconds ?? GAME_CONFIG.auth.otpResendCooldownSeconds
    );
  }

  const isReady = code.length >= 6 && code.length <= 8;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          justifyContent: "center",
          padding: 24,
        }}
      >
        {/* Geri butonu */}
        <Pressable
          onPress={() => router.back()}
          style={{ marginBottom: 32, alignSelf: "flex-start" }}
        >
          <Text style={{ color: "#2563eb", fontSize: 15, fontWeight: "600" }}>
            ← Geri
          </Text>
        </Pressable>

        {/* Başlık */}
        <Text
          style={{
            color: "#0f172a",
            fontSize: 26,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Kodu gir
        </Text>
        <Text
          style={{
            color: "#64748b",
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 36,
          }}
        >
          {email} adresine gönderilen{"\n"}6–8 haneli kodu gir.
        </Text>

        {/* Form kartı */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 20,
          }}
        >
          <TextInput
            ref={inputRef}
            style={{
              borderWidth: 1.5,
              borderColor: error ? "#ef4444" : "#e5e7eb",
              borderRadius: 14,
              paddingHorizontal: 20,
              paddingVertical: 18,
              fontSize: 28,
              fontWeight: "800",
              color: "#0f172a",
              textAlign: "center",
              letterSpacing: 6,
              marginBottom: error ? 8 : 20,
            }}
            placeholder="• • •  • • • • •"
            placeholderTextColor="#cbd5e1"
            keyboardType="number-pad"
            maxLength={8}
            value={code}
            onChangeText={(v) => {
              setCode(v.replace(/\D/g, ""));
              setError("");
            }}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleVerify}
          />

          {/* Hata mesajı */}
          {error ? (
            <Text
              style={{
                color: "#ef4444",
                fontSize: 13,
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Doğrula butonu */}
          <Pressable
            onPress={handleVerify}
            disabled={!isReady || loading}
            style={{
              backgroundColor:
                isReady && !loading ? "#0f172a" : "#e2e8f0",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: isReady && !loading ? "#ffffff" : "#94a3b8",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              {loading ? "Doğrulanıyor…" : "Doğrula"}
            </Text>
          </Pressable>
        </View>

        {/* Yeniden gönder */}
        <Pressable
          onPress={handleResend}
          disabled={resendCountdown > 0}
          style={{ alignItems: "center" }}
        >
          <Text
            style={{
              color: resendCountdown > 0 ? "#94a3b8" : "#2563eb",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {resendCountdown > 0
              ? `Tekrar gönder (${resendCountdown}s)`
              : "Kodu tekrar gönder"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
