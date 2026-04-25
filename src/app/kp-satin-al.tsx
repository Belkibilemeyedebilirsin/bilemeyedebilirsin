import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { GAME_CONFIG } from "../config/gameConfig";
import { useAppData } from "../context/AppDataContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import type { KpPackageId } from "../types";

// Paket renk ve ikon eşlemeleri
const PACKAGE_META: Record<
  KpPackageId,
  { color: string; badgeColor: string; icon: keyof typeof Ionicons.glyphMap; tag?: string }
> = {
  starter:  { color: "#0ea5e9", badgeColor: "#e0f2fe", icon: "star-outline" },
  standard: { color: "#14b8a6", badgeColor: "#ccfbf1", icon: "flash-outline", tag: "Popüler" },
  value:    { color: "#8b5cf6", badgeColor: "#ede9fe", icon: "diamond-outline", tag: "İyi Fiyat" },
  mega:     { color: "#f59e0b", badgeColor: "#fef3c7", icon: "trophy-outline", tag: "En İyi Değer" },
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Tamamlandı",
  failed:    "Engellendi",
  refunded:  "İade Edildi",
};
const STATUS_COLOR: Record<string, string> = {
  completed: "#16a34a",
  failed:    "#dc2626",
  refunded:  "#6366f1",
};
const STATUS_BG: Record<string, string> = {
  completed: "#dcfce7",
  failed:    "#fee2e2",
  refunded:  "#e0e7ff",
};

const FRAUD_LABEL: Record<string, string> = {
  rapid_purchase:        "Hızlı ardışık alım",
  daily_limit_exceeded:  "Günlük limit aşıldı",
  daily_kp_cap_exceeded: "Günlük KP üst sınırı",
  duplicate_package:     "Aynı paket tekrarı",
};

export default function KpSatinAlPage() {
  const { kpBalance, kpPurchaseRecords, paymentLogs, purchaseKpPackage, requestKpRefund } =
    useAppData();
  const { showFeedback } = useUIFeedback();

  const packages = GAME_CONFIG.kpStore.packages;

  const handleBuy = (packageId: KpPackageId) => {
    const result = purchaseKpPackage(packageId);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      kpDelta: result.kpDelta,
    });
  };

  const handleRefund = (recordId: string) => {
    const result = requestKpRefund(recordId);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      kpDelta: result.kpDelta,
    });
  };

  const sortedRecords = [...kpPurchaseRecords].sort(
    (a, b) => b.purchasedAt - a.purchasedAt
  );

  const totalAttempts = paymentLogs.length;
  const successCount  = paymentLogs.filter((l) => l.status === "success").length;
  const failedCount   = paymentLogs.filter((l) => l.status === "failed").length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* ── Başlık kartı ──────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#0f172a",
          borderRadius: 24,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.6)",
            fontWeight: "700",
            fontSize: 12,
            letterSpacing: 1,
            marginBottom: 8,
          }}
        >
          KP SATIN AL
        </Text>
        <Text
          style={{
            color: "#ffffff",
            fontSize: 22,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          Kalıcı Puan Paketleri
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", lineHeight: 21, marginBottom: 16 }}>
          KP ile mağazadan kozmetik satın alabilir, sohbet odası açabilir ve özel içeriklere
          erişebilirsin. KP sezon sıfırlanmasından etkilenmez.
        </Text>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
            alignSelf: "flex-start",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Ionicons name="wallet-outline" size={16} color="#facc15" />
          <Text style={{ color: "#facc15", fontWeight: "800" }}>
            Mevcut KP: {kpBalance}
          </Text>
        </View>
      </View>

      {/* ── Paket kartları ────────────────────────────────────── */}
      <Text style={{ color: "#334155", fontWeight: "700", fontSize: 15, marginBottom: 12 }}>
        Paketler
      </Text>

      {packages.map((pkg) => {
        const meta = PACKAGE_META[pkg.id as KpPackageId];
        const totalKp = pkg.kpBase + pkg.bonusKp;

        return (
          <View
            key={pkg.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 22,
              borderWidth: 1.5,
              borderColor: meta.color + "44",
              padding: 18,
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: meta.badgeColor,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                }}
              >
                <Ionicons name={meta.icon} size={24} color={meta.color} />
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}
                >
                  <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 16 }}>
                    {pkg.label}
                  </Text>
                  {meta.tag && (
                    <View
                      style={{
                        backgroundColor: meta.badgeColor,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                      }}
                    >
                      <Text style={{ color: meta.color, fontWeight: "800", fontSize: 11 }}>
                        {meta.tag}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800" }}>
                    {totalKp} KP
                  </Text>
                  {pkg.bonusKp > 0 && (
                    <View
                      style={{
                        backgroundColor: "#dcfce7",
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}
                    >
                      <Text style={{ color: "#16a34a", fontWeight: "700", fontSize: 11 }}>
                        +{pkg.bonusKp} bonus
                      </Text>
                    </View>
                  )}
                </View>

                {pkg.bonusKp > 0 && (
                  <Text style={{ color: "#94a3b8", fontSize: 12, marginTop: 2 }}>
                    {pkg.kpBase} KP + {pkg.bonusKp} KP bonus
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => handleBuy(pkg.id as KpPackageId)}
              style={{
                backgroundColor: meta.color,
                borderRadius: 14,
                paddingVertical: 13,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Ionicons name="card-outline" size={16} color="#ffffff" />
              <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 14 }}>
                {pkg.mockPriceTl.toFixed(2)} TL — Satın Al
              </Text>
            </Pressable>
          </View>
        );
      })}

      {/* ── Ödeme özeti ───────────────────────────────────────── */}
      {totalAttempts > 0 && (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              marginBottom: 12,
              gap: 8,
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={17} color="#334155" />
            <Text style={{ color: "#334155", fontWeight: "700", fontSize: 15 }}>
              Ödeme Özeti
            </Text>
          </View>

          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              padding: 16,
              marginBottom: 20,
              flexDirection: "row",
              gap: 16,
            }}
          >
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Toplam</Text>
              <Text style={{ color: "#0f172a", fontWeight: "800", fontSize: 18 }}>
                {totalAttempts}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#f1f5f9" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Başarılı</Text>
              <Text style={{ color: "#16a34a", fontWeight: "800", fontSize: 18 }}>
                {successCount}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#f1f5f9" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>Engellendi</Text>
              <Text style={{ color: "#dc2626", fontWeight: "800", fontSize: 18 }}>
                {failedCount}
              </Text>
            </View>
          </View>
        </>
      )}

      {/* ── Satın alma geçmişi ───────────────────────────────── */}
      {sortedRecords.length > 0 && (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <Ionicons name="receipt-outline" size={17} color="#334155" />
            <Text style={{ color: "#334155", fontWeight: "700", fontSize: 15 }}>
              Satın Alma Geçmişi
            </Text>
          </View>

          {sortedRecords.map((record) => {
            const pkg = packages.find((p) => p.id === record.packageId);
            const meta = PACKAGE_META[record.packageId];
            const dateStr = new Date(record.purchasedAt).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View
                key={record.id}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  padding: 14,
                  marginBottom: 10,
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: meta.badgeColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 14 }}>
                        {pkg?.label ?? record.packageId}
                      </Text>
                      <Text style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>
                        {dateStr}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: STATUS_BG[record.status] ?? "#f1f5f9",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        color: STATUS_COLOR[record.status] ?? "#64748b",
                        fontWeight: "800",
                        fontSize: 11,
                      }}
                    >
                      {STATUS_LABEL[record.status] ?? record.status}
                    </Text>
                  </View>
                </View>

                {record.status === "completed" && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: record.isRefundEligible ? 10 : 0,
                    }}
                  >
                    <Text style={{ color: "#475569", fontSize: 13 }}>
                      {record.kpGranted} KP eklendi
                    </Text>
                    <Text style={{ color: "#94a3b8", fontSize: 12 }}>
                      {record.mockPriceTl.toFixed(2)} TL
                    </Text>
                  </View>
                )}

                {record.fraudFlags.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    {record.fraudFlags.map((flag) => (
                      <View
                        key={flag}
                        style={{
                          backgroundColor: "#fef2f2",
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 8,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Ionicons name="warning-outline" size={11} color="#dc2626" />
                        <Text style={{ color: "#dc2626", fontSize: 11, fontWeight: "700" }}>
                          {FRAUD_LABEL[flag] ?? flag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {record.isRefundEligible && record.status === "completed" && (
                  <Pressable
                    onPress={() => handleRefund(record.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#e2e8f0",
                      borderRadius: 12,
                      paddingVertical: 9,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <Ionicons name="return-up-back-outline" size={15} color="#64748b" />
                    <Text style={{ color: "#64748b", fontWeight: "700", fontSize: 13 }}>
                      İade Talep Et
                    </Text>
                  </Pressable>
                )}

                {record.status === "refunded" && (
                  <Text style={{ color: "#6366f1", fontSize: 12, fontStyle: "italic" }}>
                    İade edildi —{" "}
                    {record.refundRequestedAt
                      ? new Date(record.refundRequestedAt).toLocaleString("tr-TR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Text>
                )}
              </View>
            );
          })}
        </>
      )}

      {/* ── Fraud / limit bilgi notu ─────────────────────────── */}
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          backgroundColor: "#fffbeb",
          borderRadius: 14,
          padding: 14,
          marginTop: 4,
          borderWidth: 1,
          borderColor: "#fde68a",
        }}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color="#b45309"
          style={{ marginTop: 1 }}
        />
        <Text style={{ color: "#92400e", fontSize: 12, lineHeight: 19, flex: 1 }}>
          Günde en fazla {GAME_CONFIG.kpStore.fraud.maxPurchasesPerDay} alım ve{" "}
          {GAME_CONFIG.kpStore.fraud.maxKpPerDay.toLocaleString("tr-TR")} KP edinim limiti
          geçerlidir. İadeler satın alım tarihinden itibaren 24 saat içinde yapılabilir.
        </Text>
      </View>
    </ScrollView>
  );
}
