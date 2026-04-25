import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, Pressable, Text, View } from "react-native";
import { useAppSettings } from "../../context/AppSettingsContext";
import type { CouponChoice } from "../../context/CouponContext";
import type { PredictionItem } from "../../types";

type Props = {
  item: PredictionItem;
  selectedChoice?: CouponChoice;
  onCardPress: () => void;
  onSelect: (choice: CouponChoice) => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
};

export default function PredictionCard({
  item,
  selectedChoice,
  onCardPress,
  onSelect,
  expanded = false,
  onToggleExpand,
}: Props) {
  const { compactMode, dataSaver } = useAppSettings();

  const yesSelected = selectedChoice === "EVET";
  const noSelected = selectedChoice === "HAYIR";

  const cardPadding = compactMode ? 12 : 16;
  const imageHeight = dataSaver ? 112 : compactMode ? 156 : 188;

  return (
    <Pressable
      onPress={onCardPress}
      style={{
        backgroundColor: "white",
        borderRadius: 22,
        overflow: "hidden",
        marginBottom: compactMode ? 12 : 18,
        borderWidth: 1,
        borderColor: "#e5e7eb",
      }}
    >
      <View style={{ position: "relative" }}>
        {dataSaver ? (
          <View
            style={{
              width: "100%",
              height: imageHeight,
              backgroundColor: "#dbeafe",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="image-outline" size={30} color="#1d4ed8" />
            <Text
              style={{
                marginTop: 8,
                fontWeight: "700",
                color: "#1d4ed8",
              }}
            >
              Veri tasarrufu açık
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.image }}
            resizeMode="cover"
            style={{
              width: "100%",
              height: imageHeight,
              backgroundColor: "#e2e8f0",
            }}
          />
        )}

        <View
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            backgroundColor: "rgba(255,255,255,0.94)",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 12 }}>
            {item.category}
          </Text>
        </View>

        <View
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            backgroundColor: "rgba(15,23,42,0.58)",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 12 }}>
            {item.timeLeft}
          </Text>
        </View>
      </View>

      <View style={{ padding: cardPadding }}>
        <Text
          style={{
            color: "#0f172a",
            fontSize: compactMode ? 19 : 21,
            fontWeight: "800",
            lineHeight: compactMode ? 25 : 28,
            marginBottom: 8,
          }}
        >
          {item.title}
        </Text>

        <Text
          style={{
            color: "#475569",
            fontSize: 14,
            lineHeight: 21,
            marginBottom: 16,
          }}
        >
          {item.description}
        </Text>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSelect("EVET");
            }}
            style={{
              flex: 1,
              paddingVertical: compactMode ? 12 : 14,
              borderRadius: 14,
              backgroundColor: yesSelected ? "#16a34a" : "#f0fdf4",
              borderWidth: 1.5,
              borderColor: yesSelected ? "#16a34a" : "#86efac",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: yesSelected ? "#ffffff" : "#166534",
                marginBottom: 4,
                fontWeight: "700",
              }}
            >
              EVET
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: yesSelected ? "#ffffff" : "#166534",
              }}
            >
              {item.yesOdd.toFixed(2)}
            </Text>
          </Pressable>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onSelect("HAYIR");
            }}
            style={{
              flex: 1,
              paddingVertical: compactMode ? 12 : 14,
              borderRadius: 14,
              backgroundColor: noSelected ? "#dc2626" : "#fef2f2",
              borderWidth: 1.5,
              borderColor: noSelected ? "#dc2626" : "#fca5a5",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: noSelected ? "#ffffff" : "#991b1b",
                marginBottom: 4,
                fontWeight: "700",
              }}
            >
              HAYIR
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: noSelected ? "#ffffff" : "#991b1b",
              }}
            >
              {item.noOdd.toFixed(2)}
            </Text>
          </Pressable>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="people-outline" size={15} color="#64748b" />
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {item.votes}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={15}
                color="#64748b"
              />
              <Text style={{ color: "#64748b", fontSize: 13 }}>
                {item.comments}
              </Text>
            </View>
          </View>

          {onToggleExpand ? (
            <Pressable
              onPress={(e) => { e.stopPropagation(); onToggleExpand(); }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 13 }}>
                  {expanded ? "Kapat" : "Detaylar"}
                </Text>
                <Ionicons
                  name={expanded ? "chevron-up" : "chevron-down"}
                  size={14}
                  color="#2563eb"
                />
              </View>
            </Pressable>
          ) : (
            <Text style={{ color: "#2563eb", fontWeight: "700", fontSize: 13 }}>
              Detaya Git
            </Text>
          )}
        </View>

        {expanded && item.longDescription ? (
          <View
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTopWidth: 1,
              borderTopColor: "#e5e7eb",
            }}
          >
            <Text
              style={{
                color: "#334155",
                lineHeight: 22,
                fontSize: 14,
              }}
            >
              {item.longDescription}
            </Text>

            {item.tabs && item.tabs.length > 0 ? (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 12,
                }}
              >
                {item.tabs.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: "#f1f5f9",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ color: "#475569", fontSize: 12, fontWeight: "600" }}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}