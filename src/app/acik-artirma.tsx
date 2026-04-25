import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAppData } from "../context/AppDataContext";
import { useAuction } from "../context/AuctionContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import { formatTimeLeft } from "../utils/relativeTime";

export default function AcikArtirmaPage() {
  const { auctions, userStates, placeBid, getMinIncrement } = useAuction();
  const { showFeedback } = useUIFeedback();
  const { currentProfileAppearance } = useAppData();

  const auctionItems = auctions.filter((a) => a.status === "active");

  const [selectedAuctionId, setSelectedAuctionId] = useState<string | null>(null);
  const [bidValue, setBidValue] = useState("");

  const selectedItem = auctionItems.find((item) => item.id === selectedAuctionId);

  const handleSubmitBid = async () => {
    if (!selectedItem) return;

    const numericBid = Number(bidValue.replace(",", "."));
    const result = await placeBid(selectedItem.id, numericBid);

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
    });

    if (result.ok) {
      setSelectedAuctionId(null);
      setBidValue("");
    }
  };

  return (
    <>
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
            AÇIK ARTIRMA
          </Text>

          <Text
            style={{
              color: "#ffffff",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 10,
            }}
          >
            Canlı teklif alanı
          </Text>

          <Text style={{ color: "#ffffff", lineHeight: 22 }}>
            Minimum giriş 100 TP. Son teklifin üzerine en az 50 TP ekleyerek artırabilirsin.
          </Text>
        </View>

        {auctionItems.map((item) => (
          <View
            key={item.id}
            style={{
              backgroundColor: "white",
              borderRadius: 22,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 20,
                backgroundColor: item.accent,
                marginBottom: 14,
              }}
            />

            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              {item.name}
            </Text>

            <Text style={{ color: "#64748b", marginBottom: 12 }}>
              {item.category}
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12 }}>Bitiş</Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>{formatTimeLeft(item.endsAt)}</Text>
              </View>

              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12 }}>Son teklif</Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>{item.currentBid} TP</Text>
              </View>

              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                }}
              >
                <Text style={{ color: "#64748b", fontSize: 12 }}>Min yeni teklif</Text>
                <Text style={{ color: "#0f172a", fontWeight: "800" }}>{getMinIncrement(item.id)} TP</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setSelectedAuctionId(item.id);
                setBidValue(String(getMinIncrement(item.id)));
              }}
              style={{
                backgroundColor: currentProfileAppearance.themeColor,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                Teklif Ver
              </Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.35)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 24,
              padding: 18,
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: "#0f172a",
                marginBottom: 10,
              }}
            >
              Teklif Ver
            </Text>

            <Text style={{ color: "#475569", lineHeight: 22, marginBottom: 12 }}>
              {selectedItem?.name}
            </Text>

            <Text style={{ color: "#64748b", marginBottom: 8 }}>
              Son teklif: {selectedItem?.currentBid} TP
            </Text>

            <Text style={{ color: "#64748b", marginBottom: 12 }}>
              Minimum yeni teklif: {selectedItem ? getMinIncrement(selectedItem.id) : 0} TP
            </Text>

            <TextInput
              value={bidValue}
              onChangeText={setBidValue}
              keyboardType="numeric"
              placeholder="Teklif tutarı"
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: "#f8fafc",
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 14,
                paddingHorizontal: 14,
                paddingVertical: 13,
                color: "#0f172a",
                marginBottom: 14,
              }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => {
                  setSelectedAuctionId(null);
                  setBidValue("");
                }}
                style={{
                  flex: 1,
                  backgroundColor: "#e2e8f0",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#334155", fontWeight: "800" }}>Vazgeç</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitBid}
                style={{
                  flex: 1,
                  backgroundColor: "#14b8a6",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                  Teklifi Onayla
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}