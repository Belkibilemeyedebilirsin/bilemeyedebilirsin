import Ionicons from "@expo/vector-icons/Ionicons";
import { ScrollView, Switch, Text, View } from "react-native";
import { useAppSettings } from "../context/AppSettingsContext";

function SettingRow({
  icon,
  title,
  description,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "#ecfeff",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={20} color="#0f766e" />
      </View>

      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <Text style={{ color: "#64748b", lineHeight: 21 }}>
          {description}
        </Text>
      </View>

      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function AyarlarPage() {
  const {
    notificationsEnabled,
    animationsEnabled,
    compactMode,
    dataSaver,
    setNotificationsEnabled,
    setAnimationsEnabled,
    setCompactMode,
    setDataSaver,
  } = useAppSettings();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View
        style={{
          backgroundColor: "#14b8a6",
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          AYARLAR
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 10,
          }}
        >
          Uygulama tercihleri
        </Text>

        <Text style={{ color: "#ffffff", lineHeight: 22 }}>
          Buradaki anahtarlar artık gerçek davranışı değiştiriyor.
        </Text>
      </View>

      <SettingRow
        icon="notifications-outline"
        title="Bildirimler"
        description="Sohbet rozetleri ve okunmamış göstergeleri görünür olur."
        value={notificationsEnabled}
        onChange={setNotificationsEnabled}
      />

      <SettingRow
        icon="sparkles-outline"
        title="Animasyonlar"
        description="Panel, kategori ve ödül bildirim animasyonlarını aç/kapat."
        value={animationsEnabled}
        onChange={setAnimationsEnabled}
      />

      <SettingRow
        icon="grid-outline"
        title="Kompakt görünüm"
        description="Kartların padding ve yüksekliklerini biraz sıkılaştırır."
        value={compactMode}
        onChange={setCompactMode}
      />

      <SettingRow
        icon="wifi-outline"
        title="Veri tasarrufu"
        description="Büyük görseller yerine hafif placeholder gösterir."
        value={dataSaver}
        onChange={setDataSaver}
      />
    </ScrollView>
  );
}