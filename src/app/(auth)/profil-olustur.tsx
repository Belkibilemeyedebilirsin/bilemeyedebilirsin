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
import { GAME_CONFIG } from "../../config/gameConfig";
import { isValidUsername, useAuth } from "../../context/AuthContext";

export default function ProfilOlusturScreen() {
  const router = useRouter();
  const { completeProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState<{
    username?: string;
    displayName?: string;
    bio?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const { usernameMinLength, usernameMaxLength, displayNameMaxLength, bioMaxLength } =
    GAME_CONFIG.auth;

  function validateFields(): boolean {
    const newErrors: typeof errors = {};

    if (!isValidUsername(username)) {
      newErrors.username = `${usernameMinLength}–${usernameMaxLength} karakter, küçük harf/rakam/alt çizgi.`;
    }

    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > displayNameMaxLength) {
      newErrors.displayName = `Görünen ad 1–${displayNameMaxLength} karakter olmalı.`;
    }

    if (bio.trim().length > bioMaxLength) {
      newErrors.bio = `Bio en fazla ${bioMaxLength} karakter.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleComplete() {
    if (!validateFields()) return;
    setLoading(true);

    const result = await completeProfile({ username, displayName, bio });
    setLoading(false);

    if (!result.ok) {
      setErrors({ username: result.message });
      return;
    }

    // Auth guard otomatik "/" yönlendirir (useSegments effect)
    router.replace("/");
  }

  const isReady =
    isValidUsername(username) && displayName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#f8fafc",
          padding: 24,
          paddingTop: 60,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Başlık */}
        <Text
          style={{
            color: "#0f172a",
            fontSize: 26,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Profilini oluştur
        </Text>
        <Text
          style={{
            color: "#64748b",
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 32,
          }}
        >
          Kullanıcı adın değiştirilemez, dikkatli seç.
        </Text>

        {/* Form kartı */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 24,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            gap: 20,
          }}
        >
          {/* Kullanıcı adı */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}
              >
                KULLANICI ADI
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                {usernameMinLength}–{usernameMaxLength} karakter
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                borderWidth: 1.5,
                borderColor: errors.username ? "#ef4444" : "#e5e7eb",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  backgroundColor: "#f1f5f9",
                  justifyContent: "center",
                  borderRightWidth: 1,
                  borderRightColor: "#e5e7eb",
                }}
              >
                <Text style={{ color: "#64748b", fontWeight: "600" }}>@</Text>
              </View>
              <TextInput
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: "#0f172a",
                }}
                placeholder="ornek_kullanici"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={usernameMaxLength}
                value={username}
                onChangeText={(v) => {
                  setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                  setErrors((e) => ({ ...e, username: undefined }));
                }}
              />
            </View>

            {errors.username ? (
              <Text
                style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}
              >
                {errors.username}
              </Text>
            ) : null}
          </View>

          {/* Görünen ad */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}
              >
                GÖRÜNEN AD
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                {displayName.trim().length}/{displayNameMaxLength}
              </Text>
            </View>

            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: errors.displayName ? "#ef4444" : "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 16,
                color: "#0f172a",
              }}
              placeholder="Görünen Adın"
              placeholderTextColor="#94a3b8"
              maxLength={displayNameMaxLength}
              value={displayName}
              onChangeText={(v) => {
                setDisplayName(v);
                setErrors((e) => ({ ...e, displayName: undefined }));
              }}
            />

            {errors.displayName ? (
              <Text
                style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}
              >
                {errors.displayName}
              </Text>
            ) : null}
          </View>

          {/* Bio */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ color: "#374151", fontSize: 13, fontWeight: "700" }}
              >
                BIO{" "}
                <Text style={{ color: "#94a3b8", fontWeight: "400" }}>
                  (isteğe bağlı)
                </Text>
              </Text>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                {bio.trim().length}/{bioMaxLength}
              </Text>
            </View>

            <TextInput
              style={{
                borderWidth: 1.5,
                borderColor: errors.bio ? "#ef4444" : "#e5e7eb",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 14,
                color: "#0f172a",
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="Kendini birkaç cümleyle anlat…"
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={bioMaxLength}
              value={bio}
              onChangeText={(v) => {
                setBio(v);
                setErrors((e) => ({ ...e, bio: undefined }));
              }}
            />

            {errors.bio ? (
              <Text
                style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}
              >
                {errors.bio}
              </Text>
            ) : null}
          </View>

          {/* Devam butonu */}
          <Pressable
            onPress={handleComplete}
            disabled={!isReady || loading}
            style={{
              backgroundColor:
                isReady && !loading ? "#0f172a" : "#e2e8f0",
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                color: isReady && !loading ? "#ffffff" : "#94a3b8",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              {loading ? "Oluşturuluyor…" : "Devam Et"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
