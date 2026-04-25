import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { useAppData } from "../../context/AppDataContext";
import { useNotifications } from "../../context/NotificationContext";

export default function HeaderLeftControls() {
  const navigation = useNavigation();
  const { unreadNotificationCount } = useAppData();
  const { openNotificationPanel } = useNotifications();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,
      }}
    >
      <Pressable
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 6,
        }}
      >
        <Ionicons name="menu" size={24} color="#0f172a" />
      </Pressable>

      <Pressable
        onPress={openNotificationPanel}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 4,
        }}
      >
        <Ionicons name="notifications-outline" size={22} color="#0f172a" />

        {unreadNotificationCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#ef4444",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 10,
                fontWeight: "800",
              }}
            >
              {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}