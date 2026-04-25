import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";
import type { AppNotification } from "../../context/AppDataContext";
import { useAppData } from "../../context/AppDataContext";
import { useNotifications } from "../../context/NotificationContext";
import type { NotificationType } from "../../types";
import { formatRelativeTime } from "../../utils/relativeTime";

type NotifMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
};

function getNotifMeta(type: NotificationType): NotifMeta {
  switch (type) {
    case "settlement":
      return { icon: "trophy-outline", color: "#d97706", bg: "#fef3c7" };
    case "new_question":
      return { icon: "add-circle-outline", color: "#2563eb", bg: "#dbeafe" };
    case "message":
      return { icon: "chatbubble-ellipses-outline", color: "#7c3aed", bg: "#ede9fe" };
    case "friend":
      return { icon: "person-add-outline", color: "#16a34a", bg: "#dcfce7" };
    case "auction":
      return { icon: "pricetag-outline", color: "#dc2626", bg: "#fee2e2" };
    case "team":
      return { icon: "people-outline", color: "#0891b2", bg: "#cffafe" };
    case "task":
      return { icon: "checkmark-circle-outline", color: "#059669", bg: "#d1fae5" };
    default:
      return { icon: "notifications-outline", color: "#64748b", bg: "#f1f5f9" };
  }
}

function navigateToTarget(
  router: ReturnType<typeof useRouter>,
  target: AppNotification["target"]
) {
  switch (target.screen) {
    case "zaman-yolculugu":
      router.navigate({
        pathname: "/zaman-yolculugu",
        params: { focusId: target.focusId ?? "" },
      } as never);
      break;
    case "genel-sohbet":
      router.navigate({
        pathname: "/genel-sohbet",
        params: { tab: target.tab ?? "genel", userId: target.userId ?? "" },
      } as never);
      break;
    case "tahmin":
      router.navigate(`/tahmin/${target.predictionId}` as never);
      break;
    case "acik-artirma":
      router.navigate("/acik-artirma" as never);
      break;
    case "arkadaslar":
      router.navigate("/arkadaslar" as never);
      break;
    case "takimlar":
      router.navigate("/takimlar" as never);
      break;
    case "gorevler":
      router.navigate("/gorevler" as never);
      break;
    default:
      break;
  }
}

const SWIPE_THRESHOLD = 72;
const ACTION_WIDTH = 72;

function NotifCard({
  item,
  onPress,
  onDelete,
  onMarkRead,
}: {
  item: AppNotification;
  onPress: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
}) {
  const meta = getNotifMeta(item.type);
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, gs) =>
        Math.abs(gs.dx) > 8 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderGrant: () => {
        isSwiping.current = true;
      },
      onPanResponderMove: (_e, gs) => {
        if (gs.dx > 0 && item.isRead) return;
        translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_e, gs) => {
        isSwiping.current = false;
        if (gs.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -300,
            duration: 200,
            useNativeDriver: true,
          }).start(onDelete);
        } else if (gs.dx > SWIPE_THRESHOLD && !item.isRead) {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start(onMarkRead);
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isSwiping.current = false;
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const leftBg = translateX.interpolate({
    inputRange: [-ACTION_WIDTH, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const rightBg = translateX.interpolate({
    inputRange: [0, ACTION_WIDTH],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={{ marginBottom: 8 }}>
      <View
        style={{
          position: "absolute",
          top: 0, bottom: 0, left: 0, right: 0,
          borderRadius: 16,
          flexDirection: "row",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        {!item.isRead && (
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: "#10b981",
              alignItems: "flex-start",
              justifyContent: "center",
              paddingLeft: 16,
              opacity: rightBg,
            }}
          >
            <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Okundu</Text>
          </Animated.View>
        )}

        <Animated.View
          style={{
            position: "absolute",
            right: 0, top: 0, bottom: 0,
            width: ACTION_WIDTH,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 16,
            opacity: leftBg,
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Sil</Text>
        </Animated.View>
      </View>

      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <Pressable
          onPress={() => {
            if (!isSwiping.current) onPress();
          }}
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 12,
            backgroundColor: item.isRead ? "#f8fafc" : "#f0f9ff",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: item.isRead ? "#e5e7eb" : "#bae6fd",
            padding: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: meta.bg,
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Ionicons name={meta.icon} size={20} color={meta.color} />
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <Text
                style={{ color: "#0f172a", fontWeight: "800", fontSize: 13, flex: 1 }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {!item.isRead && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#3b82f6",
                    marginLeft: 8,
                    flexShrink: 0,
                  }}
                />
              )}
            </View>

            <Text
              style={{ color: "#475569", fontSize: 12, lineHeight: 18 }}
              numberOfLines={2}
            >
              {item.message}
            </Text>

            <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 4 }}>
              {formatRelativeTime({ createdAt: item.createdAt })}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function NotificationPanel() {
  const router = useRouter();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
  } = useAppData();
  const { isPanelOpen, closeNotificationPanel } = useNotifications();

  const [mounted, setMounted] = useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isPanelOpen) {
      setMounted(true);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [isPanelOpen, mounted, opacityAnim, scaleAnim]);

  if (!mounted && !isPanelOpen) {
    return null;
  }

  const handleNotifPress = (item: AppNotification) => {
    markNotificationRead(item.id);
    closeNotificationPanel();
    setTimeout(() => navigateToTarget(router, item.target), 150);
  };

  return (
    <Modal
      visible={mounted || isPanelOpen}
      transparent={true}
      animationType="none"
      onRequestClose={closeNotificationPanel}
      statusBarTranslucent
    >
      <Animated.View style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.12)", opacity: opacityAnim }}>
        <Pressable
          onPress={closeNotificationPanel}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />

        <Animated.View
          style={{
            position: "absolute",
            top: 70,
            left: 12,
            width: 360,
            maxWidth: "94%",
            transform: [
              { scale: scaleAnim },
              { translateY: scaleAnim.interpolate({ inputRange: [0.8, 1], outputRange: [-30, 0] }) },
              { translateX: scaleAnim.interpolate({ inputRange: [0.8, 1], outputRange: [-40, 0] }) }
            ]
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: "#ffffff",
              transform: [{ rotate: "45deg" }],
              alignSelf: "flex-start",
              marginLeft: 50,
              marginBottom: -9,
              zIndex: 2,
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
            }}
          />

          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 28,
              padding: 16,
              maxHeight: 540,
              shadowColor: "#0f172a",
              shadowOpacity: 0.22,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 14,
              zIndex: 3,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800" }}>Bildirimler</Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <Pressable onPress={markAllNotificationsRead}>
                  <Text style={{ color: "#14b8a6", fontWeight: "700", fontSize: 13 }}>Tümünü Oku</Text>
                </Pressable>
                <Pressable onPress={closeNotificationPanel}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 6 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="notifications-off-outline" size={40} color="#cbd5e1" />
                  <Text style={{ color: "#94a3b8", marginTop: 12, fontWeight: "600" }}>Bildirim yok</Text>
                </View>
              ) : (
                notifications.map((item) => (
                  <NotifCard
                    key={item.id}
                    item={item}
                    onPress={() => handleNotifPress(item)}
                    onDelete={() => deleteNotification(item.id)}
                    onMarkRead={() => markNotificationRead(item.id)}
                  />
                ))
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}