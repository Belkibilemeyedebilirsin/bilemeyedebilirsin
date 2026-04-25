import Ionicons from "@expo/vector-icons/Ionicons";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useAppData } from "../../context/AppDataContext";
import { useAuth } from "../../context/AuthContext";

type MenuRowProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
};

function MenuRow({ label, icon, active, onPress }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: active ? "#ecfeff" : "transparent",
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginBottom: 4,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? "#0f766e" : "#334155"}
        style={{ marginRight: 12 }}
      />
      <Text
        style={{
          color: active ? "#0f766e" : "#0f172a",
          fontWeight: "800",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CustomDrawerContent(
  props: DrawerContentComponentProps
) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    currentProfileAppearance,
    levelInfo,
    ownInternalId,
    streakCount,
    hasPass,
    tpBalance,
    kpBalance,
    isFeatureUnlocked,
  } = useAppData();

  const { currentUser } = useAuth();
  const isAdmin =
    currentUser?.role === "admin" || currentUser?.role === "moderator";

  const go = (path: string) => {
    router.push(path as never);
    props.navigation.closeDrawer();
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: 18,
      }}
      style={{ backgroundColor: "#ffffff" }}
    >
      <View
        style={{
          backgroundColor: currentProfileAppearance.themeColor,
          paddingHorizontal: 18,
          paddingTop: 24,
          paddingBottom: 18,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          marginBottom: 14,
        }}
      >
        <Pressable
          onPress={() => go("/profil")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              backgroundColor: currentProfileAppearance.frameColor,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#ffffff",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#0f172a",
                  fontWeight: "800",
                  fontSize: 19,
                }}
              >
                {currentProfileAppearance.avatar}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 21,
                fontWeight: "800",
                marginBottom: 4,
              }}
            >
              {currentUser?.displayName || currentUser?.username || "Oyuncu"}
            </Text>

            <Text
              style={{
                color: "#ffffff",
                opacity: 0.96,
                marginBottom: 4,
              }}
            >
              Seviye {levelInfo.level} • {currentProfileAppearance.title}
            </Text>

            <Text style={{ color: "#ffffff", opacity: 0.9 }}>
              ID: {ownInternalId}
            </Text>
          </View>
        </Pressable>

        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              height: 9,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.22)",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${levelInfo.progress * 100}%`,
                height: "100%",
                borderRadius: 999,
                backgroundColor: "#ffffff",
              }}
            />
          </View>

          <Text
            style={{
              color: "#ffffff",
              opacity: 0.95,
              fontSize: 12,
              marginTop: 6,
              fontWeight: "700",
            }}
          >
            XP {levelInfo.currentXp}/{levelInfo.nextLevelXp}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Pressable
            onPress={() => go("/tp-kazan")}
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              TP {tpBalance}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "900" }}>+</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => go("/kp-satin-al")}
            style={{
              flex: 1,
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              KP {kpBalance}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "rgba(255,255,255,0.22)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "900" }}>+</Text>
            </View>
          </Pressable>
        </View>

        {isFeatureUnlocked("premium_module") && (
        <Pressable
          onPress={() => go("/bilebilirsin-pass")}
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 13,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                color: "#0f172a",
                fontWeight: "800",
              }}
            >
              Bilebilirsin Pass
            </Text>

            <Text
              style={{
                color: hasPass ? "#2563eb" : "#14b8a6",
                fontWeight: "800",
                fontSize: 12,
              }}
            >
              {hasPass ? "Premium" : `${streakCount}/14`}
            </Text>
          </View>

          <Text
            style={{
              color: "#64748b",
              lineHeight: 20,
            }}
          >
            Günlük ödüller ve sezon akışı
          </Text>
        </Pressable>
        )}
      </View>

      <View style={{ paddingHorizontal: 12 }}>
        <MenuRow
          label="Görevler"
          icon="checkbox-outline"
          active={pathname === "/gorevler"}
          onPress={() => go("/gorevler")}
        />

        {isFeatureUnlocked("social_feed") && (
        <MenuRow
          label="Arena"
          icon="flame-outline"
          active={pathname === "/arena"}
          onPress={() => go("/arena")}
        />
        )}

        {isFeatureUnlocked("chat_rooms") && (
        <MenuRow
          label="Sohbet Odaları"
          icon="chatbubbles-outline"
          active={pathname === "/sohbet-odalari"}
          onPress={() => go("/sohbet-odalari")}
        />
        )}

        {isFeatureUnlocked("friends") && (
        <MenuRow
          label="Arkadaşlar"
          icon="people-outline"
          active={pathname === "/arkadaslar"}
          onPress={() => go("/arkadaslar")}
        />
        )}

        {isFeatureUnlocked("teams") && (
        <MenuRow
          label="Takımlar"
          icon="shield-half-outline"
          active={pathname === "/takimlar"}
          onPress={() => go("/takimlar")}
        />
        )}

        <MenuRow
          label="Mağaza"
          icon="bag-handle-outline"
          active={pathname === "/magaza"}
          onPress={() => go("/magaza")}
        />

        {isFeatureUnlocked("leaderboard") && (
        <MenuRow
          label="Sıralama"
          icon="podium-outline"
          active={pathname === "/siralama"}
          onPress={() => go("/siralama")}
        />
        )}

        <MenuRow
          label="Zaman Yolculuğu"
          icon="time-outline"
          active={pathname === "/zaman-yolculugu"}
          onPress={() => go("/zaman-yolculugu")}
        />

        {isFeatureUnlocked("auction") && (
        <MenuRow
          label="Açık Artırma"
          icon="hammer-outline"
          active={pathname === "/acik-artirma"}
          onPress={() => go("/acik-artirma")}
        />
        )}

        <MenuRow
          label="Ayarlar"
          icon="settings-outline"
          active={pathname === "/ayarlar"}
          onPress={() => go("/ayarlar")}
        />

        {isAdmin && (
          <MenuRow
            label="Admin Paneli"
            icon="shield-checkmark-outline"
            active={pathname.startsWith("/admin")}
            onPress={() => go("/admin")}
          />
        )}
      </View>
    </DrawerContentScrollView>
  );
}