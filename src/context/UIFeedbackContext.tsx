import Ionicons from "@expo/vector-icons/Ionicons";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Dimensions, Text, View } from "react-native";
// @ts-ignore
import ConfettiCannon from "react-native-confetti-cannon";
import { useAppSettings } from "./AppSettingsContext";

type FeedbackType = "success" | "error" | "info";

type FeedbackPayload = {
  type: FeedbackType;
  title: string;
  message: string;
  tpDelta?: number;
  kpDelta?: number;
  xpDelta?: number;
};

type UIFeedbackContextType = {
  showFeedback: (payload: FeedbackPayload) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const UIFeedbackContext = createContext<UIFeedbackContextType | undefined>(
  undefined
);

export function UIFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getMotionDuration } = useAppSettings();
  const [feedback, setFeedback] = useState<(FeedbackPayload & { id: number }) | null>(null);

  const translateY = useRef(new Animated.Value(-28)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!feedback) return;

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: getMotionDuration(230),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: getMotionDuration(230),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: getMotionDuration(230),
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -18,
          duration: getMotionDuration(180),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: getMotionDuration(180),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: getMotionDuration(180),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFeedback(null);
        translateY.setValue(-28);
        opacity.setValue(0);
        scale.setValue(0.96);
      });
    }, 2500);

    return () => clearTimeout(timeout);
  }, [feedback, getMotionDuration, opacity, scale, translateY]);

  const value = useMemo(
    () => ({
      showFeedback: (payload: FeedbackPayload) => {
        setFeedback({
          ...payload,
          id: Date.now(),
        });
      },
    }),
    []
  );

  const bgColor =
    feedback?.type === "error"
      ? "#7f1d1d"
      : "#14b8a6";

  const iconName: keyof typeof Ionicons.glyphMap =
    feedback?.type === "success"
      ? "checkmark-circle"
      : feedback?.type === "error"
      ? "close-circle"
      : "information-circle";

  return (
    <UIFeedbackContext.Provider value={value}>
      {children}

      {feedback ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 56,
            left: 16,
            right: 16,
            zIndex: 999,
            opacity,
            transform: [{ translateY }, { scale }],
          }}
        >
          <View
            style={{
              backgroundColor: bgColor,
              borderRadius: 22,
              padding: 16,
              shadowColor: "#0f172a",
              shadowOpacity: 0.18,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
              }}
            >
              <Ionicons
                name={iconName}
                size={22}
                color="#ffffff"
                style={{ marginRight: 10, marginTop: 1 }}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 16,
                    fontWeight: "800",
                    marginBottom: 4,
                  }}
                >
                  {feedback.title}
                </Text>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.88)",
                    lineHeight: 21,
                  }}
                >
                  {feedback.message}
                </Text>

                {feedback.tpDelta || feedback.kpDelta || feedback.xpDelta ? (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    {feedback.tpDelta ? (
                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.14)",
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                          +{feedback.tpDelta} TP
                        </Text>
                      </View>
                    ) : null}

                    {feedback.kpDelta ? (
                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.14)",
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                          +{feedback.kpDelta} KP
                        </Text>
                      </View>
                    ) : null}

                    {feedback.xpDelta ? (
                      <View
                        style={{
                          backgroundColor: "rgba(255,255,255,0.14)",
                          borderRadius: 999,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                        }}
                      >
                        <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                          +{feedback.xpDelta} XP
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </Animated.View>
      ) : null}

    {/* Başarı anında (XP veya KP kazanıldığında) konfeti patlat */}
    {feedback?.type === "success" && (feedback.xpDelta || feedback.kpDelta) ? (
      <ConfettiCannon
        count={50}
        origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
        fallSpeed={2500}
        fadeOut
      />
    ) : null}
    </UIFeedbackContext.Provider>
  );
}

export function useUIFeedback() {
  const context = useContext(UIFeedbackContext);

  if (!context) {
    throw new Error("useUIFeedback must be used inside UIFeedbackProvider");
  }

  return context;
}