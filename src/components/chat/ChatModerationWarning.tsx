import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

type Props = {
  message: string | null;
};

export default function ChatModerationWarning({ message }: Props) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(translateYAnim, { toValue: 0, friction: 8, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 20, duration: 300, useNativeDriver: true })
      ]).start();
    }
  }, [message]);

  if (!message && opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) as unknown as number === 0) return null;

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [{ translateY: translateYAnim }],
        position: "absolute", bottom: 80, left: 16, right: 16, zIndex: 9999,
        backgroundColor: "rgba(220, 38, 38, 0.95)", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
      }}
    >
      <Ionicons name="warning" size={24} color="#ffffff" style={{ marginRight: 12 }} />
      <Text style={{ color: "#ffffff", fontSize: 14, fontWeight: "600", flex: 1, lineHeight: 20 }}>{message}</Text>
    </Animated.View>
  );
}