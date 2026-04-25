import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppData } from "../../context/AppDataContext";

function TabBarItem({
  tab,
  badgeCount,
  isActive,
  onPress,
}: {
  tab: any;
  badgeCount?: number;
  isActive: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.15 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(isActive ? -4 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1.15 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: isActive ? -4 : 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive, scaleAnim, translateYAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
          alignItems: "center",
        }}
      >
        <Ionicons
          name={isActive ? tab.icon : `${tab.icon}-outline`}
          size={24}
          color={isActive ? "#0f766e" : "#64748b"}
        />
        <Text
          style={{
            fontSize: 11,
            marginTop: 4,
            fontWeight: isActive ? "800" : "600",
            color: isActive ? "#0f766e" : "#64748b",
          }}
        >
          {tab.label}
        </Text>
        {badgeCount && badgeCount > 0 ? (
          <View style={{ position: 'absolute', top: -4, right: -12, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 }}>
            <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800' }}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unreadNotificationCount } = useAppData();

  // Tab bar'ın görüneceği ana sayfalar (Auth ve alt detay sayfalarında otomatik gizlenir)
  const showOn = [
    "/", "/aktif-kuponlar", "/profil",
    "/gorevler", "/arena", "/sohbet-odalari", "/arkadaslar",
    "/takimlar", "/magaza", "/siralama", "/zaman-yolculugu",
    "/acik-artirma", "/bilebilirsin-pass", "/ayarlar",
    "/tp-kazan", "/kp-satin-al"
  ];

  const isVisible = showOn.includes(pathname) || pathname.startsWith("/tahmin/");

  if (!isVisible) return null;

  const tabs = [
    { label: "Ana Sayfa", path: "/", icon: "home" },
    { label: "Kuponlar", path: "/aktif-kuponlar", icon: "ticket" },
    { label: "Profil", path: "/profil", icon: "person" },
  ] as const;

  return (
    <View style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "#ffffff",
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 12) : 12,
      paddingTop: 12,
      elevation: 16,
      shadowColor: "#0f172a",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TabBarItem
            key={tab.path}
            tab={tab}
            badgeCount={tab.path === '/profil' ? unreadNotificationCount : 0}
            isActive={isActive}
            onPress={() => router.replace(tab.path as any)}
          />
        );
      })}
    </View>
  );
}