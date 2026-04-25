import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import PredictionCard from "../components/cards/PredictionCard";
import { useAppData } from "../context/AppDataContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useCoupon } from "../context/CouponContext";
import { usePrediction } from "../context/PredictionContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import type { PredictionItem, PredictionTag } from "../types";
import { formatTimeLeft } from "../utils/relativeTime";

export const homeFilterTabs = ["Tümü", "Futbol", "Basketbol", "E-Spor", "Magazin", "Finans", "Genel"];

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function HomePage() {
  const router = useRouter();
  const { questions, getLiveOdds, refreshQuestions } = usePrediction();
  const { selections, upsertSelection, openCouponPanel } = useCoupon();
  const { animationsEnabled, getMotionDuration } = useAppSettings();
  const { showFeedback } = useUIFeedback();
  const { globalMessages } = useAppData();

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [displayedTabIndex, setDisplayedTabIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const cardsTranslateX = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(1)).current;

  // Ticker (duyuru bandı)
  const announcements = globalMessages.filter((m) => m.isAnnouncement);
  const tickerText = announcements.map((a) => `${a.user}: ${a.text}`).join("    •    ");
  const tickerAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const tickerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (announcements.length === 0) return;

    const estimatedWidth = tickerText.length * 8.5;
    const slideDuration = Math.max(8000, estimatedWidth * 32);

    tickerAnim.setValue(SCREEN_WIDTH);
    tickerAnimRef.current?.stop();

    const anim = Animated.sequence([
      Animated.timing(tickerAnim, {
        toValue: -estimatedWidth,
        duration: slideDuration,
        useNativeDriver: true,
      }),
      Animated.timing(tickerAnim, {
        toValue: SCREEN_WIDTH,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.timing(tickerAnim, {
        toValue: -estimatedWidth,
        duration: slideDuration,
        useNativeDriver: true,
      }),
    ]);
    tickerAnimRef.current = anim;
    anim.start();

    return () => anim.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcements.length, tickerText]);

  const selectedTab = homeFilterTabs[selectedTabIndex];
  const displayedTab = homeFilterTabs[displayedTabIndex];

  useEffect(() => {
    if (displayedTabIndex === selectedTabIndex) return;

    if (!animationsEnabled) {
      setDisplayedTabIndex(selectedTabIndex);
      translateX.setValue(0);
      opacity.setValue(1);
      cardsTranslateX.setValue(0);
      cardsOpacity.setValue(1);
      return;
    }

    const direction = selectedTabIndex > displayedTabIndex ? 1 : -1;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: direction * -36,
        duration: getMotionDuration(220),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.08,
        duration: getMotionDuration(220),
        useNativeDriver: true,
      }),
      Animated.timing(cardsTranslateX, {
        toValue: direction * -38,
        duration: getMotionDuration(250),
        useNativeDriver: true,
      }),
      Animated.timing(cardsOpacity, {
        toValue: 0.05,
        duration: getMotionDuration(250),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDisplayedTabIndex(selectedTabIndex);

      translateX.setValue(direction * 40);
      opacity.setValue(0.08);
      cardsTranslateX.setValue(direction * 42);
      cardsOpacity.setValue(0.05);

      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: getMotionDuration(360),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: getMotionDuration(360),
          useNativeDriver: true,
        }),
        Animated.timing(cardsTranslateX, {
          toValue: 0,
          duration: getMotionDuration(420),
          useNativeDriver: true,
        }),
        Animated.timing(cardsOpacity, {
          toValue: 1,
          duration: getMotionDuration(420),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [
    selectedTabIndex,
    displayedTabIndex,
    translateX,
    opacity,
    cardsTranslateX,
    cardsOpacity,
    animationsEnabled,
    getMotionDuration,
  ]);

  const filteredQuestions = questions.filter((q) => {
    if (selectedTab === "Tümü") return true;
    return q.tags.includes(selectedTab);
  });

  const goToTab = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, homeFilterTabs.length - 1));
    if (clampedIndex === selectedTabIndex) return;
    setSelectedTabIndex(clampedIndex);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 20,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -35) {
          goToTab(selectedTabIndex + 1);
        } else if (gestureState.dx > 35) {
          goToTab(selectedTabIndex - 1);
        }
      },
    })
  ).current;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshQuestions();
    } finally {
      setRefreshing(false);
      showFeedback({
        type: "info",
        title: "Anasayfa yenilendi",
        message: "Tahmin havuzu güncellendi.",
      });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {announcements.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fffbeb",
            borderWidth: 1,
            borderColor: "#fbbf24",
            borderRadius: 10,
            height: 34,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <View
            style={{
              backgroundColor: "#fbbf24",
              height: "100%",
              paddingHorizontal: 8,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 4,
            }}
          >
            <Ionicons name="megaphone" size={13} color="#78350f" />
          </View>
          <View style={{ flex: 1, overflow: "hidden" }}>
            <Animated.Text
              numberOfLines={1}
              style={{
                color: "#78350f",
                fontWeight: "700",
                fontSize: 13,
                transform: [{ translateX: tickerAnim }],
              }}
            >
              {tickerText}
            </Animated.Text>
          </View>
        </View>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Pressable
          onPress={() => goToTab(selectedTabIndex - 1)}
          style={{
            width: 30,
            alignItems: "center",
            justifyContent: "center",
            opacity: selectedTabIndex === 0 ? 0.35 : 1,
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#64748b" />
        </Pressable>

        <View
          {...panResponder.panHandlers}
          style={{
            flex: 1,
            backgroundColor: "white",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            paddingVertical: 14,
            alignItems: "center",
            justifyContent: "center",
            marginHorizontal: 6,
            overflow: "hidden",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#94a3b8",
              marginBottom: 4,
            }}
          >
            KATEGORİ
          </Text>

          <Animated.Text
            style={{
              fontSize: 18,
              fontWeight: "800",
              color: "#0f172a",
              opacity,
              transform: [{ translateX }],
            }}
          >
            {displayedTab}
          </Animated.Text>
        </View>

        <Pressable
          onPress={() => goToTab(selectedTabIndex + 1)}
          style={{
            width: 30,
            alignItems: "center",
            justifyContent: "center",
            opacity: selectedTabIndex === homeFilterTabs.length - 1 ? 0.35 : 1,
          }}
        >
          <Ionicons name="chevron-forward" size={22} color="#64748b" />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#0f172a",
          }}
        >
          {selectedTab}
        </Text>

        <Text style={{ color: "#64748b", fontWeight: "700" }}>
          {filteredQuestions.length} içerik
        </Text>
      </View>

      <Animated.View
        style={{
          opacity: cardsOpacity,
          transform: [{ translateX: cardsTranslateX }],
        }}
      >
        {filteredQuestions.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="albums-outline" size={48} color="#cbd5e1" />
            <Text style={{ marginTop: 12, fontSize: 16, color: "#64748b", fontWeight: "600", textAlign: "center" }}>
              Bu kategoride henüz aktif bir tahmin bulunmuyor.
            </Text>
          </View>
        ) : (
          filteredQuestions.map((q) => {
          const liveOdds = getLiveOdds(q.id) ?? { yesOdd: 1.0, noOdd: 1.0 };
          const selected = selections.find((x) => x.predictionId === q.id);
          const item: PredictionItem = {
            id: q.id,
            category: q.category,
            timeLeft: formatTimeLeft(q.closesAt),
            title: q.title,
            description: q.description,
            longDescription: q.longDescription,
            votes: q.participantCount,
            comments: q.commentCount,
            yesOdd: liveOdds.yesOdd,
            noOdd: liveOdds.noOdd,
            accent: q.accent,
            image: q.image,
            tabs: q.tags as PredictionTag[],
          };

          return (
            <PredictionCard
              key={q.id}
              item={item}
              selectedChoice={selected?.choice}
              onCardPress={() => router.push(`/tahmin/${q.id}` as never)}
              onSelect={(choice: "EVET" | "HAYIR") => {
                upsertSelection({
                  predictionId: q.id,
                  title: q.title,
                  category: q.category,
                  choice,
                  odd: choice === "EVET" ? liveOdds.yesOdd : liveOdds.noOdd,
                });

                openCouponPanel();
              }}
            />
          );
        })
      )}
      </Animated.View>
    </ScrollView>
  );
}