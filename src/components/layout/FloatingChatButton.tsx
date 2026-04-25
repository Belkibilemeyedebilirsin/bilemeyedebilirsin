import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter, useSegments } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppData } from "../../context/AppDataContext";
import { useAppSettings } from "../../context/AppSettingsContext";

export default function FloatingChatButton() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { unreadGeneralCount, currentProfileAppearance, openGlobalChatPanel } = useAppData();
  const { notificationsEnabled } = useAppSettings();

  const hidden =
    segments[0] === "(auth)" ||
    pathname === "/profil" ||
    pathname.startsWith("/sohbet-odasi/");

  if (hidden) return null;

  return (
    <Pressable
      onPress={() => openGlobalChatPanel()}
      style={{
        position: "absolute",
        right: 18,
        bottom: 90,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: currentProfileAppearance.themeColor,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0f172a",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <Ionicons name="chatbubble-ellipses" size={24} color="#ffffff" />

      {notificationsEnabled && unreadGeneralCount > 0 ? (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 6,
          }}
        >
          <Text
            style={{
              color: "#ffffff",
              fontSize: 11,
              fontWeight: "800",
            }}
          >
            {unreadGeneralCount > 9 ? "9+" : unreadGeneralCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}