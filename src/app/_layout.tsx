import * as Notifications from "expo-notifications";
import { usePathname, useRootNavigationState, useRouter, useSegments } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ActivityIndicator, Animated, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomTabBar from "../components/layout/BottomTabBar";
import CustomDrawerContent from "../components/layout/CustomDrawerContent";
import FloatingChatButton from "../components/layout/FloatingChatButton";
import GlobalChatPanel from "../components/layout/GlobalChatPanel";
import HeaderLeftControls from "../components/layout/HeaderLeftControls";
import HomeHeaderActions from "../components/layout/HomeHeaderActions";
import NotificationPanel from "../components/layout/NotificationPanel";
import RightCouponPanel from "../components/layout/RightCouponPanel";
import { AppDataProvider, useAppData } from "../context/AppDataContext";
import { AppSettingsProvider } from "../context/AppSettingsContext";
import { AuctionProvider } from "../context/AuctionContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CouponProvider } from "../context/CouponContext";
import { EconomyProvider } from "../context/EconomyContext";
import { NotificationProvider } from "../context/NotificationContext";
import { PredictionProvider } from "../context/PredictionContext";
import { TeamProvider } from "../context/TeamContext";
import { UIFeedbackProvider } from "../context/UIFeedbackContext";

const HIDDEN_ITEM = { display: "none" as const };
const TITLE_STYLE = { marginLeft: 22 } as const;
const HEADER_STYLE = { backgroundColor: "#ffffff" } as const;
const DRAWER_STYLE = { width: "78%" as const, backgroundColor: "#ffffff" };

// ─── Push Notification Handler Ayarları ─────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Auth guard + ana navigasyon ─────────────────────────────────────────────
//
// AppNavigator, tüm provider'ların içinde render edilir; bu sayede
// useAuth(), useAppData() gibi hook'ları güvenle çağırabilir.
//
// Auth guard stratejisi (Expo Router standardı):
//   - isLoading   → splash spinner
//   - !isAuthenticated && route auth grubunda değil → /(auth)/giris'e yönlendir
//   - isAuthenticated && route auth grubundaysa → "/"e yönlendir
//
// Mock fazında MOCK_USER pre-authenticated olduğundan guard hiçbir zaman
// tetiklenmez; Supabase entegrasyonunda gerçek session restore devreye girer.

function AppNavigator() {
  const { isAuthenticated, isLoading, currentUser } = useAuth();
  const { currentProfileAppearance, isFeatureUnlocked } = useAppData();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const rootNavigationState = useRootNavigationState();

  const appBgColor = currentProfileAppearance?.themeAppBgColor ?? "#f8fafc";

  // ── Sayfa Geçiş Animasyonu (Şimdilik İptal Edildi) ──
  const slideAnim = useRef(new Animated.Value(0)).current;
  const prevIndexRef = useRef(0);

  useEffect(() => { // Animasyon için pathname değişikliğini dinle
    const tabPaths = ["/", "/aktif-kuponlar", "/profil"];
    const currIndex = tabPaths.indexOf(pathname);

    if (currIndex !== -1) {
      prevIndexRef.current = currIndex;
    }
  }, [pathname]);
  
  const showTabBar = [
    "/", "/aktif-kuponlar", "/profil",
    "/gorevler", "/arena", "/sohbet-odalari", "/arkadaslar",
    "/takimlar", "/magaza", "/siralama", "/zaman-yolculugu",
    "/acik-artirma", "/bilebilirsin-pass", "/ayarlar",
    "/tp-kazan", "/kp-satin-al"
  ].includes(pathname) || pathname.startsWith("/tahmin/");

  // Döngü kırmak için segmentleri stringe çeviriyoruz
  const segmentsString = useMemo(() => segments.join("/"), [segments]);

  const renderDrawerContent = useCallback((props: any) => <CustomDrawerContent {...props} />, []);
  const renderHeaderLeft = useCallback(() => <HeaderLeftControls />, []);
  const renderHeaderRight = useCallback(() => <HomeHeaderActions />, []);
  const sceneStyle = useMemo(() => ({
    backgroundColor: appBgColor,
    paddingBottom: showTabBar ? 64 + (Platform.OS === 'ios' ? insets.bottom : 0) : 0
  }), [appBgColor, showTabBar, insets.bottom]);

  useEffect(() => {
    // Navigasyon ağacının tam olarak yüklenmesini bekle (Sonsuz spinner hatasını önler)
    if (isLoading || !rootNavigationState?.key) return;
    
    const inAuthGroup = segments[0] === "(auth)";
    const currentRoute = segments[1] as string | undefined;

    // Oturum var ama profil tamamlanmamış → profil kurulum ekranı
    if (currentUser && !currentUser.profileCompleted) {
      if (currentRoute !== "profil-olustur") {
        router.replace("/(auth)/profil-olustur");
      }
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/giris");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }

    // ─── Push Notification İzni İste ───────────────────────────────────────
    if (isAuthenticated) {
      const requestNotificationPermissions = async () => {
        try {
          if (Platform.OS === 'web') return;
          const existing = await Notifications.getPermissionsAsync() as any;
          let isGranted = existing?.granted || existing?.status === 'granted';
          if (!isGranted) {
            const requested = await Notifications.requestPermissionsAsync() as any;
            isGranted = requested?.granted || requested?.status === 'granted';
          }
        } catch (error) {
          console.warn("Push notification izin hatası:", error);
        }
        // Gerçekte burada: const token = (await Notifications.getExpoPushTokenAsync()).data;
      };
      requestNotificationPermissions();
    }
  }, [isAuthenticated, isLoading, segmentsString, currentUser?.id, currentUser?.profileCompleted, rootNavigationState?.key]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: appBgColor,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: appBgColor }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
        <Drawer
          drawerContent={renderDrawerContent}
          screenOptions={{
          headerShown: true,
          headerTitleAlign: "center",
          drawerType: "front",
          drawerStyle: DRAWER_STYLE,
          overlayColor: "rgba(15,23,42,0.28)",
          sceneStyle: sceneStyle,
          headerStyle: HEADER_STYLE,
          headerTintColor: "#111827",
        }}
      >
        {/* ── Ana ekranlar ───────────────────────────────────────────────── */}
        <Drawer.Screen
          name="index"
          options={{
            title: "Bilebilirsin",
            headerTitleAlign: "left",
            headerTitleStyle: TITLE_STYLE,
            headerLeft: renderHeaderLeft,
            headerRight: renderHeaderRight,
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="gorevler"
          options={{ title: "Görevler" }}
        />
        <Drawer.Screen
          name="aktif-kuponlar"
          options={{ 
            title: "Aktif Tahmin ve Kuponlar",
            drawerItemStyle: HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="arena"
          options={{ 
            title: "Arena",
            drawerItemStyle: isFeatureUnlocked("social_feed") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="sohbet-odalari"
          options={{ 
            title: "Sohbet Odaları",
          drawerItemStyle: isFeatureUnlocked("chat_rooms") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="arkadaslar"
          options={{ 
            title: "Arkadaşlar",
            drawerItemStyle: isFeatureUnlocked("friends") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="takimlar"
          options={{ 
            title: "Takımlar",
            drawerItemStyle: isFeatureUnlocked("teams") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="magaza"
          options={{ title: "Mağaza" }}
        />
        <Drawer.Screen
          name="siralama"
          options={{ 
            title: "Sıralama",
            drawerItemStyle: isFeatureUnlocked("leaderboard") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="profil"
          options={{ 
            title: "Profil",
            drawerItemStyle: HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="zaman-yolculugu"
          options={{ title: "Zaman Yolculuğu" }}
        />
        <Drawer.Screen
          name="acik-artirma"
          options={{ 
            title: "Açık Artırma",
          drawerItemStyle: isFeatureUnlocked("auction") ? undefined : HIDDEN_ITEM
          }}
        />
        <Drawer.Screen
          name="bilebilirsin-pass"
          options={{ 
            title: "Bilebilirsin Pass",
            drawerItemStyle: isFeatureUnlocked("premium_module") ? undefined : HIDDEN_ITEM
          }}
        />

        {/* ── Gizli / overlay ekranlar ───────────────────────────────────── */}
        <Drawer.Screen
          name="tp-kazan"
          options={{
            title: "TP Kazan",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="kp-satin-al"
          options={{
            title: "KP Satın Al",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="ayarlar"
          options={{
            title: "Ayarlar",
          }}
        />
        <Drawer.Screen
          name="genel-sohbet"
          options={{
            title: "Genel Sohbet",
            drawerItemStyle: isFeatureUnlocked("global_chat") ? undefined : HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="sohbet-odasi/[id]"
          options={{
            title: "Sohbet Odası",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="kullanici/[id]"
          options={{
            title: "Kullanıcı Profili",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="takim/[id]"
          options={{
            title: "Takım Profili",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="takim-yonetim/[id]"
          options={{
            title: "Takım Yönetimi",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="takim-chat/[id]"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="kullanici-menu/[id]"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />
        <Drawer.Screen
          name="tahmin/[id]"
          options={{
            title: "Tahmin Detayı",
            drawerItemStyle: HIDDEN_ITEM,
          }}
        />

        {/* ── Auth ekranları (header yok, drawer kapalı) ────────────────── */}
        <Drawer.Screen
          name="(auth)/giris"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="(auth)/kayit"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="(auth)/otp"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="(auth)/profil-olustur"
          options={{
            headerShown: false,
            drawerItemStyle: HIDDEN_ITEM,
            swipeEnabled: false,
          }}
        />
        </Drawer>
      </Animated.View>

      <BottomTabBar />
      {/* Uygulama geneli overlay'ler */}
      <NotificationPanel />
      <RightCouponPanel />
      <GlobalChatPanel />
      {isFeatureUnlocked("global_chat") && <FloatingChatButton />}
    </View>
  );
}

// ─── Kök layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NotificationProvider>
        <AuthProvider>
          <CouponProvider>
            <AppSettingsProvider>
              <UIFeedbackProvider>
                <EconomyProvider>
                  <AuctionProvider>
                    <PredictionProvider>
                      <AppDataProvider>
                        <TeamProvider>
                          <AppNavigator />
                        </TeamProvider>
                      </AppDataProvider>
                    </PredictionProvider>
                  </AuctionProvider>
                </EconomyProvider>
              </UIFeedbackProvider>
            </AppSettingsProvider>
          </CouponProvider>
        </AuthProvider>
      </NotificationProvider>
    </GestureHandlerRootView>
  );
}
