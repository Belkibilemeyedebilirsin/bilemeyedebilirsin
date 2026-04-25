import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { useCoupon } from "../../context/CouponContext";

export default function HomeHeaderActions() {
  const { openCouponPanel, selections } = useCoupon();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginRight: 8,
      }}
    >
      <Pressable
        onPress={openCouponPanel}
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#f8fafc",
          borderWidth: 1,
          borderColor: "#e5e7eb",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="ticket-outline" size={19} color="#0f172a" />

        {selections.length > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 19,
              height: 19,
              borderRadius: 999,
              backgroundColor: "#14b8a6",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 11,
                fontWeight: "800",
              }}
            >
              {selections.length}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}