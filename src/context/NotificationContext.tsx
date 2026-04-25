/**
 * NotificationContext — Push bildirim altyapısı
 *
 * Mock fazında:
 *   - İzin ister, token kaydeder (konsolda görünür)
 *   - scheduleLocalNotification ile lokal bildirim tetiklenebilir
 *   - pushToken Supabase/backend entegrasyonunda kullanılacak
 *
 * Supabase fazında:
 *   - pushToken'ı kullanıcı profiline kaydet
 *   - Edge Function üzerinden Expo Push API'sine gönder
 */

import * as Notifications from "expo-notifications";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

// Bildirimlerin uygulama ön planda iken nasıl göründüğünü ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type NotificationContextType = {
  pushToken: string | null;
  permissionGranted: boolean;
  scheduleLocalNotification: (
    title: string,
    body: string,
    delaySeconds?: number
  ) => Promise<void>;
  isPanelOpen: boolean;
  openNotificationPanel: () => void;
  closeNotificationPanel: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  pushToken: null,
  permissionGranted: false,
  scheduleLocalNotification: async () => {},
  isPanelOpen: false,
  openNotificationPanel: () => {},
  closeNotificationPanel: () => {},
});

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const notificationListener = useRef<ReturnType<
    typeof Notifications.addNotificationReceivedListener
  > | null>(null);
  const responseListener = useRef<ReturnType<
    typeof Notifications.addNotificationResponseReceivedListener
  > | null>(null);

  useEffect(() => {
    registerForPushNotifications();

    // Bildirim alındığında (uygulama açıkken)
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("[Push] Bildirim alındı:", notification.request.content.title);
      });

    // Kullanıcı bildirimine tıkladığında
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "[Push] Bildirime tıklandı:",
          response.notification.request.content.title
        );
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function registerForPushNotifications() {
    if (Platform.OS === "web") return;

    try {
      const existing = await Notifications.getPermissionsAsync();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let isGranted = (existing as any).granted ?? (existing as any).status === "granted";

      if (!isGranted) {
        const result = await Notifications.requestPermissionsAsync();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isGranted = (result as any).granted ?? (result as any).status === "granted";
      }

      if (!isGranted) {
        console.log("[Push] Bildirim izni reddedildi.");
        return;
      }

      setPermissionGranted(true);

      // Expo push token — Supabase entegrasyonunda backend'e gönderilecek
      // Not: Expo Go'da fiziksel cihaz gerektirir; emülatörde null döner
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: "bilebilirsin", // EAS project ID ile değiştir
        });
        setPushToken(tokenData.data);
        console.log("[Push] Token:", tokenData.data);
      } catch {
        // Emülatör / Expo Go'da push token alınamaz — sorun değil
      }

      // Android için bildirim kanalı
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Bilebilirsin",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#0f172a",
        });
      }
    } catch (err) {
      console.warn("[Push] Kayıt hatası:", err);
    }
  }

  async function scheduleLocalNotification(
    title: string,
    body: string,
    delaySeconds = 1
  ) {
    if (!permissionGranted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger:
        delaySeconds > 0
          ? { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds }
          : null,
    });
  }

  return (
    <NotificationContext.Provider
      value={{
        pushToken,
        permissionGranted,
        scheduleLocalNotification,
        isPanelOpen,
        openNotificationPanel: () => setIsPanelOpen(true),
        closeNotificationPanel: () => setIsPanelOpen(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
