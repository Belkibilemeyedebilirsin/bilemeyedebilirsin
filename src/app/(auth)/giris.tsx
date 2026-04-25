import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function GirisScreen() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setError("");
    setLoading(true);

    const result = await signInWithPassword(identifier, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
  }

  const isReady = identifier.trim().length > 0 && password.length > 0;

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
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marka başlığı */}
        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 26,
              backgroundColor: "#14b8a6",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              shadowColor: "#14b8a6",
              shadowOpacity: 0.4,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 36, fontWeight: "900" }}>
              B
            </Text>
          </View>
          <Text
            style={{
              color: "#ffffff",
              fontSize: 30,
              fontWeight: "800",
              marginBottom: 6,
              letterSpacing: 0.3,
            }}
          >
            Bilebilirsin
          </Text>
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Tekrar hoş geldin
          </Text>
        </View>

        {/* Form kartı */}
        <View
          style={{
            backgroundColor: "#111a33",
            borderRadius: 22,
            padding: 22,
            borderWidth: 1,
            borderColor: "#1f2a48",
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: "800",
              marginBottom: 4,
            }}
          >
            Giriş Yap
          </Text>
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 13,
              marginBottom: 22,
            }}
          >
            Hesabına erişmek için bilgilerini gir.
          </Text>

          {/* Identifier */}
          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 12,
              fontWeight: "700",
              marginBottom: 8,
              letterSpacing: 0.4,
            }}
          >
            E-POSTA VEYA KULLANICI ADI
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: error ? "#ef4444" : "#243049",
              backgroundColor: "#0b1328",
              borderRadius: 14,
              paddingHorizontal: 14,
              marginBottom: 16,
            }}
          >
            <Ionicons name="person-outline" size={18} color="#64748b" />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingLeft: 10,
                fontSize: 15,
                color: "#ffffff",
              }}
              placeholder="ornek@mail.com veya kullanici_adi"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={identifier}
              onChangeText={(v) => {
                setIdentifier(v);
                setError("");
              }}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <Text
            style={{
              color: "#cbd5e1",
              fontSize: 12,
              fontWeight: "700",
              marginBottom: 8,
              letterSpacing: 0.4,
            }}
          >
            ŞİFRE
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: error ? "#ef4444" : "#243049",
              backgroundColor: "#0b1328",
              borderRadius: 14,
              paddingHorizontal: 14,
              marginBottom: error ? 10 : 22,
            }}
          >
            <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 14,
                paddingLeft: 10,
                fontSize: 15,
                color: "#ffffff",
              }}
              placeholder="••••••••"
              placeholderTextColor="#475569"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError("");
              }}
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
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

          {/* Hata mesajı */}
          {error ? (
            <Text
              style={{
                color: "#f87171",
                fontSize: 13,
                marginBottom: 14,
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
          ) : null}

          {/* Giriş butonu */}
          <Pressable
            onPress={handleSignIn}
            disabled={!isReady || loading}
            style={{
              backgroundColor:
                isReady && !loading ? "#14b8a6" : "#1e293b",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
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
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </Text>
          </Pressable>
        </View>

        {/* Kayıt yönlendirmesi */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 28,
          }}
        >
          <Text style={{ color: "#94a3b8", fontSize: 14 }}>
            Hesabın yok mu?{" "}
          </Text>
          <Pressable
            onPress={() => router.push("/(auth)/kayit")}
            hitSlop={8}
          >
            <Text
              style={{
                color: "#14b8a6",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Kayıt Ol
            </Text>
          </Pressable>
        </View>

        {/* Alt bilgi */}
        <Text
          style={{
            color: "#475569",
            fontSize: 11,
            textAlign: "center",
            marginTop: 28,
            lineHeight: 17,
          }}
        >
          Devam ederek Kullanım Şartları ve Gizlilik Politikasını kabul etmiş
          olursun.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
