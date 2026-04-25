import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAppData, type StoreCategory, type StoreItem } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";

const tabs: { label: string; value: StoreCategory }[] = [
  { label: "Ünvan", value: "title" },
  { label: "Avatar", value: "avatar" },
  { label: "Çerçeve", value: "frame" },
  { label: "Banner", value: "banner" },
  { label: "Arka Plan", value: "background" },
  { label: "Rozet", value: "badge" },
  { label: "Efekt", value: "entry_effect" },
  { label: "Tema", value: "theme" },
  { label: "Mesaj Stili", value: "message_style" },
  { label: "Model", value: "model" },
  { label: "Kostüm", value: "costume" },
];

export default function MagazaPage() {
  const {
    kpBalance,
    storeCatalog,
    ownedStoreItemIds,
    equippedStoreItems,
    purchaseStoreItem,
    equipStoreItem,
    currentProfileAppearance,
  } = useAppData();
  const { showFeedback } = useUIFeedback();

  const [activeTab, setActiveTab] = useState<StoreCategory>("title");

  const items = useMemo(
    () => storeCatalog.filter((item) => item.category === activeTab),
    [storeCatalog, activeTab]
  );

  const handleBuy = (itemId: string) => {
    const result = purchaseStoreItem(itemId);

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });
  };

  const handleEquip = (itemId: string) => {
    const result = equipStoreItem(itemId);

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });
  };

  const isEquipped = (item: StoreItem) => {
    if (item.category === "title") return equippedStoreItems.titleId === item.id;
    if (item.category === "avatar") return equippedStoreItems.avatarId === item.id;
    if (item.category === "frame") return equippedStoreItems.frameId === item.id;
    if (item.category === "background") return equippedStoreItems.backgroundId === item.id;
    if (item.category === "badge") return equippedStoreItems.badgeId === item.id;
    if (item.category === "entry_effect") return equippedStoreItems.entryEffectId === item.id;
    if (item.category === "theme") return equippedStoreItems.themeId === item.id;
    if (item.category === "message_style") return equippedStoreItems.messageStyleId === item.id;
    if (item.category === "banner") return equippedStoreItems.bannerId === item.id;
    return false;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View
        style={{
          backgroundColor: currentProfileAppearance.themeColor,
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.78)",
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          MAĞAZA
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 8,
          }}
        >
          Kozmetik ve profil içerikleri
        </Text>

        <Text style={{ color: "#ffffff", lineHeight: 22 }}>
          KP bakiyen: {kpBalance}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {tabs.map((tab) => {
          const active = tab.value === activeTab;

          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={{
                backgroundColor: active ? currentProfileAppearance.themeColor : "#ffffff",
                borderWidth: 1,
                borderColor: active ? currentProfileAppearance.themeColor : "#e5e7eb",
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Text
                style={{
                  color: active ? "#ffffff" : "#334155",
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {items.map((item) => {
        const owned = ownedStoreItemIds.includes(item.id);
        const equipped = isEquipped(item);

        return (
          <View
            key={item.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  width: item.category === "banner" ? 80 : 56,
                  height: item.category === "banner" ? 36 : 56,
                  borderRadius: item.category === "banner" ? 8 : 28,
                  backgroundColor: item.color ?? "#ecfeff",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Text style={{ fontWeight: "800", color: item.category === "banner" && item.color ? "#ffffff" : "#0f172a", fontSize: 11 }}>
                  {item.previewText ?? item.name[0]}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#0f172a",
                    fontSize: 17,
                    fontWeight: "800",
                    marginBottom: 4,
                  }}
                >
                  {item.name}
                </Text>
                <Text style={{ color: "#64748b" }}>{item.priceKp} KP</Text>
              </View>
            </View>

            {!owned ? (
              <Pressable
                onPress={() => handleBuy(item.id)}
                style={{
                  backgroundColor: currentProfileAppearance.themeColor,
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                  Satın Al
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => handleEquip(item.id)}
                style={{
                  backgroundColor: equipped ? "#cbd5e1" : "#1d4ed8",
                  borderRadius: 14,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color: equipped ? "#475569" : "#ffffff",
                    fontWeight: "800",
                  }}
                >
                  {equipped ? "Kullanılıyor" : "Kullan"}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}