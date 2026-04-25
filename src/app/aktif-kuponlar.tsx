import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAppData } from "../context/AppDataContext";
import { useCoupon } from "../context/CouponContext";
import type { CouponRecord, CouponSelectionRecord } from "../types";

function StatusBadge({ status }: { status: CouponRecord["status"] }) {
  const isWon = status === "Kazandı";
  const isLost = status === "Kaybetti";

  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: isWon ? "#dcfce7" : isLost ? "#fee2e2" : "#eff6ff",
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          color: isWon ? "#166534" : isLost ? "#991b1b" : "#1d4ed8",
        }}
      >
        {status}
      </Text>
    </View>
  );
}

function RecordCard({
  item,
  expanded,
  onToggle,
}: {
  item: CouponRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isWon = item.status === "Kazandı";
  const isLost = item.status === "Kaybetti";

  return (
    <Pressable
      onPress={onToggle}
      style={{
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: 16,
        marginBottom: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              fontSize: 17,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            {item.type}
          </Text>
          <Text style={{ color: "#64748b" }}>{item.playedAt}</Text>
        </View>

        <StatusBadge status={item.status} />
      </View>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
            Tahmin adedi
          </Text>
          <Text style={{ color: "#0f172a", fontWeight: "800" }}>
            {item.selections.length}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
            Kupon tutarı
          </Text>
          <Text style={{ color: "#0f172a", fontWeight: "800" }}>
            {item.stake.toFixed(2)} TP
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#f8fafc",
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: "#64748b", fontSize: 12, marginBottom: 2 }}>
            Toplam oran
          </Text>
          <Text style={{ color: "#0f172a", fontWeight: "800" }}>
            {item.totalOdds.toFixed(2)}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: isWon ? "#f0fdf4" : isLost ? "#fef2f2" : "#eff6ff",
          borderRadius: 14,
          padding: 14,
          marginBottom: expanded ? 14 : 0,
        }}
      >
        <Text
          style={{
            color: isWon ? "#166534" : isLost ? "#991b1b" : "#1d4ed8",
            marginBottom: 4,
          }}
        >
          Maksimum Kazanç
        </Text>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: isWon ? "#166534" : isLost ? "#991b1b" : "#1d4ed8",
          }}
        >
          {item.maxWin.toFixed(2)} TP
        </Text>
      </View>

      {expanded ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            paddingTop: 14,
          }}
        >
          {item.selections.map((selection: CouponSelectionRecord) => (
            <View
              key={selection.id}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                {selection.title}
              </Text>

              <Text style={{ color: "#64748b", marginBottom: 8 }}>
                {selection.category}
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
                    backgroundColor:
                      selection.choice === "EVET" ? "#dcfce7" : "#fee2e2",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color:
                        selection.choice === "EVET" ? "#166534" : "#991b1b",
                    }}
                  >
                    {selection.choice}
                  </Text>
                </View>

                <Text
                  style={{
                    color: "#0f172a",
                    fontSize: 16,
                    fontWeight: "800",
                  }}
                >
                  {selection.odd.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}

          <View
            style={{
              marginTop: 6,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#64748b", fontWeight: "700" }}>
              Detay açık
            </Text>
            <Ionicons name="chevron-up" size={18} color="#64748b" />
          </View>
        </View>
      ) : (
        <View
          style={{
            marginTop: 4,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#2563eb", fontWeight: "700" }}>
            Detayı aç
          </Text>
          <Ionicons name="chevron-down" size={18} color="#2563eb" />
        </View>
      )}
    </Pressable>
  );
}

type TabKey = "aktif" | "gecmis";

export default function KuponlarPage() {
  const { selections, totalOdds, stakeTp, arenaNote } = useCoupon();
  const { activeCouponRecords, currentProfileAppearance } = useAppData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("aktif");

  const activeRecords = activeCouponRecords.filter((r) => r.status === "Aktif");
  const pastRecords = activeCouponRecords.filter((r) => r.status !== "Aktif");

  const numericStake = Number(stakeTp.replace(",", "."));
  const validStake = Number.isFinite(numericStake) ? numericStake : 0;
  const possibleWin = validStake > 0 ? validStake * totalOdds : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: 16,
        }}
      >
        Kuponlar
      </Text>

      {/* Sekme seçici */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#f1f5f9",
          borderRadius: 14,
          padding: 4,
          marginBottom: 20,
        }}
      >
        {(["aktif", "gecmis"] as TabKey[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => {
              setTab(key);
              setExpandedId(null);
            }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 11,
              alignItems: "center",
              backgroundColor: tab === key ? "#ffffff" : "transparent",
            }}
          >
            <Text
              style={{
                fontWeight: "700",
                fontSize: 14,
                color: tab === key ? "#0f172a" : "#64748b",
              }}
            >
              {key === "aktif" ? "Aktif Kuponlarım" : "Geçmiş Kuponlarım"}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "aktif" ? (
        <>
          {/* Hazırlanan kupon kartı */}
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
              HAZIRLANAN KUPON
            </Text>

            <Text
              style={{
                color: "#ffffff",
                fontSize: 22,
                fontWeight: "800",
                marginBottom: 14,
              }}
            >
              {selections.length <= 1 ? "Tekli Tahmin" : "Kupon"}
            </Text>

            {selections.length === 0 ? (
              <Text style={{ color: "#ffffff", lineHeight: 22 }}>
                Şu anda hazırlanan bir seçim yok. Anasayfadan seçim yapınca burada da özetini göreceksin.
              </Text>
            ) : (
              <>
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
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
                      Seçim
                    </Text>
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                      {selections.length}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
                      Toplam oran
                    </Text>
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                      {totalOdds.toFixed(2)}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  >
                    <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
                      Tutar
                    </Text>
                    <Text style={{ color: "#ffffff", fontWeight: "800" }}>
                      {validStake.toFixed(2)} TP
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: "rgba(255,255,255,0.16)",
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: arenaNote ? 12 : 0,
                  }}
                >
                  <Text style={{ color: "#ffffff", marginBottom: 4 }}>
                    Olası Kazanç
                  </Text>
                  <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "800" }}>
                    {possibleWin.toFixed(2)} TP
                  </Text>
                </View>

                {arenaNote ? (
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.16)",
                      borderRadius: 16,
                      padding: 14,
                    }}
                  >
                    <Text style={{ color: "#ffffff", marginBottom: 4 }}>
                      Arena açıklaması
                    </Text>
                    <Text style={{ color: "#ffffff", lineHeight: 22 }}>
                      {arenaNote}
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 12,
            }}
          >
            Aktif Kayıtlar
          </Text>

          {activeRecords.length === 0 ? (
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#0f172a",
                  marginBottom: 6,
                }}
              >
                Henüz aktif kayıt yok
              </Text>
              <Text style={{ color: "#64748b", lineHeight: 22 }}>
                Bas Rahatla ile kupon oluşturunca burada görünecek.
              </Text>
            </View>
          ) : (
            activeRecords.map((item: CouponRecord) => (
              <RecordCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === item.id ? null : item.id))
                }
              />
            ))
          )}
        </>
      ) : (
        <>
          {pastRecords.length === 0 ? (
            <View
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "#e5e7eb",
                padding: 16,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#0f172a", marginBottom: 6 }}>
                Henüz geçmiş kupon yok
              </Text>
              <Text style={{ color: "#64748b", lineHeight: 22 }}>
                Sonuçlanan kuponlar burada görünecek.
              </Text>
            </View>
          ) : (
            pastRecords.map((item: CouponRecord) => (
              <RecordCard
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === item.id ? null : item.id))
                }
              />
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}
