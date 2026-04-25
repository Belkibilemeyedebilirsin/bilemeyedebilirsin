import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useAppData } from "../../context/AppDataContext";
import { useAppSettings } from "../../context/AppSettingsContext";
import { useCoupon } from "../../context/CouponContext";
import { useUIFeedback } from "../../context/UIFeedbackContext";

export default function RightCouponPanel() {
  const {
    isCouponPanelOpen,
    closeCouponPanel,
    selections,
    totalOdds,
    stakeTp,
    setStakeTp,
    arenaNote,
    setArenaNote,
    clearSelections,
    removeSelection,
  } = useCoupon();

  const { placeCoupon, shareCouponToArena, isFeatureUnlocked } = useAppData();
  const { showFeedback } = useUIFeedback();
  const { getMotionDuration } = useAppSettings();

  const [mounted, setMounted] = useState(false);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const panelTranslateX = useRef(new Animated.Value(420)).current;
  const shareAnim = useRef(new Animated.Value(0)).current;
  const [isPlaced, setIsPlaced] = useState(false);
  const canShareToArena = isFeatureUnlocked("social_feed");

  useEffect(() => {
    if (isCouponPanelOpen) {
      setMounted(true);
      overlayOpacity.setValue(0);
      panelTranslateX.setValue(420);

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: getMotionDuration(220),
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslateX, {
            toValue: 0,
            duration: getMotionDuration(280),
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: getMotionDuration(180),
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslateX, {
          toValue: 420,
          duration: getMotionDuration(240),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [
    isCouponPanelOpen,
    mounted,
    overlayOpacity,
    panelTranslateX,
    getMotionDuration,
  ]);

  const handleClose = () => {
    closeCouponPanel();
    if (isPlaced) {
      setTimeout(() => {
        clearSelections();
        setIsPlaced(false);
        shareAnim.setValue(0);
      }, 300);
    }
  };

  const handleClear = () => {
    clearSelections();
    setIsPlaced(false);
    shareAnim.setValue(0);
  };

  const numericStake = Number(stakeTp.replace(",", "."));
  const validStake = Number.isFinite(numericStake) ? numericStake : 0;
  const possibleWin = validStake > 0 ? validStake * totalOdds : 0;

  if (!mounted && !isCouponPanelOpen) {
    return null;
  }

  const handlePlaceCoupon = async () => {
    const result = await placeCoupon({
      selections,
      stake: validStake,
      totalOdds,
    });

    if (!result.ok) {
      showFeedback({
        type: "error",
        title: result.title,
        message: result.message,
      });
      return;
    }

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      xpDelta: result.xpDelta,
    });

    setIsPlaced(true);
    Animated.timing(shareAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleShareCoupon = () => {
    const result = shareCouponToArena({
      selections,
      stake: validStake,
      totalOdds,
      note: arenaNote,
    });

    if (!result.ok) {
      showFeedback({
        type: "error",
        title: result.title,
        message: result.message,
      });
      return;
    }

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      xpDelta: result.xpDelta,
    });

    handleClose();
  };

  return (
    <Modal
      visible={mounted || isCouponPanelOpen}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Animated.View
          style={{
            flex: 1,
            opacity: overlayOpacity,
          }}
        >
          <Pressable
            onPress={handleClose}
            style={{ flex: 1, backgroundColor: "rgba(15,23,42,0.35)" }}
          />
        </Animated.View>

        <Animated.View
          style={{
            width: "82%",
            backgroundColor: "#ffffff",
            paddingTop: 18,
            borderTopLeftRadius: 24,
            borderBottomLeftRadius: 24,
            borderLeftWidth: 1,
            borderLeftColor: "#e5e7eb",
            transform: [{ translateX: panelTranslateX }],
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "800",
                  color: "#0f172a",
                }}
              >
                {selections.length <= 1 ? "Tekli Tahmin" : "Kupon"}
              </Text>
              <Text style={{ color: "#64748b", marginTop: 4 }}>
                {selections.length} seçim
              </Text>
            </View>

            <Pressable
              onPress={handleClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "#f1f5f9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={20} color="#0f172a" />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
          >
            {selections.length === 0 ? (
              <View
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#0f172a",
                    marginBottom: 8,
                  }}
                >
                  Henüz seçim eklenmedi
                </Text>
                <Text style={{ color: "#475569", lineHeight: 22 }}>
                  Anasayfadan EVET veya HAYIR seçerek kuponunu oluşturmaya başla.
                </Text>
              </View>
            ) : (
              <>
                {selections.map((item) => (
                  <View
                    key={item.predictionId}
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: "#e5e7eb",
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 16,
                          fontWeight: "700",
                          color: "#0f172a",
                          paddingRight: 10,
                        }}
                      >
                        {item.title}
                      </Text>

                    {!isPlaced && (
                      <Pressable
                        onPress={() => removeSelection(item.predictionId)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: "#fef2f2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#dc2626" />
                      </Pressable>
                    )}
                    </View>

                    <Text style={{ color: "#64748b", marginBottom: 6 }}>
                      {item.category}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor:
                            item.choice === "EVET" ? "#dcfce7" : "#fee2e2",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color:
                              item.choice === "EVET" ? "#166534" : "#991b1b",
                          }}
                        >
                          {item.choice}
                        </Text>
                      </View>

                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "800",
                          color: "#0f172a",
                        }}
                      >
                        {item.odd.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))}

                <View
                  style={{
                    backgroundColor: "#f8fafc",
                    borderRadius: 20,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                    marginTop: 4,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: "#334155",
                      marginBottom: 10,
                    }}
                  >
                    Kupon Özeti
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#475569" }}>Tip</Text>
                    <Text style={{ fontWeight: "700", color: "#0f172a" }}>
                      {selections.length <= 1 ? "Tekli Tahmin" : "Kupon"}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: "#475569" }}>Toplam oran</Text>
                    <Text style={{ fontWeight: "800", color: "#0f172a" }}>
                      {totalOdds.toFixed(2)}
                    </Text>
                  </View>

                  {!isPlaced ? (
                    <>
                      <Text
                        style={{
                          marginTop: 8,
                          marginBottom: 8,
                          color: "#334155",
                          fontWeight: "700",
                        }}
                      >
                        Kupon Tutarı (TP)
                      </Text>

                      <TextInput
                        value={stakeTp}
                        onChangeText={setStakeTp}
                        keyboardType="numeric"
                        placeholder="Örn. 150"
                        placeholderTextColor="#94a3b8"
                        style={{
                          backgroundColor: "#ffffff",
                          borderWidth: 1,
                          borderColor: "#cbd5e1",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 13,
                          fontSize: 16,
                          color: "#0f172a",
                          marginBottom: 12,
                        }}
                      />

                      <View
                        style={{
                          backgroundColor: "#eff6ff",
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 14,
                        }}
                      >
                        <Text style={{ color: "#1e3a8a", marginBottom: 6 }}>
                          Olası Kazanç
                        </Text>
                        <Text
                          style={{
                            color: "#1d4ed8",
                            fontSize: 22,
                            fontWeight: "800",
                          }}
                        >
                          {possibleWin.toFixed(2)} TP
                        </Text>
                      </View>

                      <Pressable
                        onPress={handlePlaceCoupon}
                        style={{
                          backgroundColor: "#14b8a6",
                          borderRadius: 14,
                          paddingVertical: 14,
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}
                        >
                          Bas Rahatla
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={handleClear}
                        style={{
                          alignItems: "center",
                          paddingVertical: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ef4444",
                            fontWeight: "700",
                          }}
                        >
                          Seçimleri Temizle
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Animated.View
                      style={{
                        opacity: shareAnim,
                        transform: [
                          {
                            translateY: shareAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [15, 0],
                            }),
                          },
                        ],
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#ecfdf5",
                          borderRadius: 14,
                          padding: 14,
                          marginBottom: 16,
                          borderWidth: 1,
                          borderColor: "#a7f3d0",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                      >
                        <Text style={{ color: "#065f46", fontSize: 16, fontWeight: "800", marginBottom: 4 }}>
                          ✅ Kupon Oynandı
                        </Text>
                        <Text style={{ color: "#059669", fontWeight: "600" }}>
                          {validStake.toFixed(2)} TP yatırıldı
                        </Text>
                      </View>

                      {canShareToArena && (
                        <>
                          <Text
                            style={{
                              marginBottom: 8,
                              color: "#334155",
                              fontWeight: "700",
                            }}
                          >
                            Arena'da Paylaş (İsteğe Bağlı)
                          </Text>

                          <TextInput
                            value={arenaNote}
                            onChangeText={setArenaNote}
                            multiline
                            placeholder="Kuponunu paylaşırken görünecek kısa açıklamayı yaz..."
                            placeholderTextColor="#94a3b8"
                            style={{
                              minHeight: 96,
                              backgroundColor: "#ffffff",
                              borderWidth: 1,
                              borderColor: "#cbd5e1",
                              borderRadius: 14,
                              paddingHorizontal: 14,
                              paddingTop: 12,
                              fontSize: 15,
                              color: "#0f172a",
                              textAlignVertical: "top",
                              marginBottom: 12,
                            }}
                          />

                          <Pressable
                            onPress={handleShareCoupon}
                            style={{
                              backgroundColor: "#0ea5a4",
                              borderRadius: 14,
                              paddingVertical: 14,
                              alignItems: "center",
                              marginBottom: 12,
                            }}
                          >
                            <Text
                              style={{ color: "#ffffff", fontWeight: "800", fontSize: 16 }}
                            >
                              Kuponu Paylaş
                            </Text>
                          </Pressable>
                        </>
                      )}

                      <Pressable
                        onPress={handleClose}
                        style={{
                          alignItems: "center",
                          paddingVertical: 10,
                        }}
                      >
                        <Text
                          style={{
                            color: "#64748b",
                            fontWeight: "700",
                          }}
                        >
                          Kapat
                        </Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}