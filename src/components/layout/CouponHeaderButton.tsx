import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { useCoupon } from "../../context/CouponContext";

export default function CouponHeaderButton() {
  const { selectionCount, openCouponPanel } = useCoupon();

  return (
    <Pressable onPress={openCouponPanel} style={{ marginRight: 16 }}>
      <View>
        <Ionicons name="ticket-outline" size={24} color="#111827" />
        {selectionCount > 0 ? (
          <View
            style={{
              position: "absolute",
              right: -8,
              top: -8,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#2563eb",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {selectionCount}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}