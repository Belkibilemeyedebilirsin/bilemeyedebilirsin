import type { ReactNode } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";
import { useAppData, type StoreItem } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { usePrediction } from "../context/PredictionContext";
import { useUIFeedback } from "../context/UIFeedbackContext";

const size = 250;
const center = size / 2;
const outerRadius = 80;

function getPoint(index: number, radius: number) {
  const angle = -Math.PI / 2 + index * ((Math.PI * 2) / 6);
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function toPointString(points: { x: number; y: number }[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export default function ProfilPage() {
  const {
    tpBalance,
    kpBalance,
    levelInfo,
    ownInternalId,
    currentProfileAppearance,
    storeCatalog,
    ownedStoreItemIds,
    equippedStoreItems,
    equipStoreItem,
    acceptedFriendIds,
    streakCount,
    careerStats,
  } = useAppData();

  const profileHeaderColor = currentProfileAppearance.themeColor;

  const { stats: predictionStats, userStakes, questions } = usePrediction();
  const { showFeedback } = useUIFeedback();
  const { signOut, currentUser } = useAuth();

  const titleItems = storeCatalog.filter((item) => item.category === "title");
  const avatarItems = storeCatalog.filter((item) => item.category === "avatar");
  const frameItems = storeCatalog.filter((item) => item.category === "frame");
  const backgroundItems = storeCatalog.filter((item) => item.category === "background");
  const badgeItems = storeCatalog.filter((item) => item.category === "badge");
  const entryEffectItems = storeCatalog.filter((item) => item.category === "entry_effect");
  const themeItems = storeCatalog.filter((item) => item.category === "theme");
  const messageStyleItems = storeCatalog.filter((item) => item.category === "message_style");
  const bannerItems = storeCatalog.filter((item) => item.category === "banner");

  // Kullanıcı tahmin yaptıkça şekillenen 6gen uzmanlık haritası
  const catCounts: Record<string, number> = {};
  userStakes.forEach((stake, qId) => {
    const q = questions.find((x) => x.id === qId);
    if (q) {
      catCounts[q.category] = (catCounts[q.category] || 0) + 1;
    }
  });
  
  const calcVal = (cat: string) => Math.min(100, (catCounts[cat] || 0) * 15);

  const stats = [
    { label: "Futbol", value: calcVal("Futbol") },
    { label: "Basketbol", value: calcVal("Basketbol") },
    { label: "E-Spor", value: calcVal("E-Spor") },
    { label: "Tenis", value: calcVal("Tenis") },
    { label: "Genel", value: calcVal("Genel") },
    { label: "Ekonomi", value: calcVal("Ekonomi") },
  ];

  const dataPoints = stats.map((stat, index) =>
    getPoint(index, outerRadius * (stat.value / 100))
  );

  const achievements = [
    {
      id: "a1",
      title: "Seri Koruyucu",
      reward: "Ödül: Keskin Ünvan",
      current: Math.min(streakCount, 14),
      target: 14,
    },
    {
      id: "a2",
      title: "Seviye Yükselişi",
      reward: "Ödül: Arena Komutanı Ünvanı",
      current: Math.min(levelInfo.level, 7),
      target: 7,
    },
    {
      id: "a3",
      title: "Koleksiyoncu",
      reward: "Ödül: Altın Çerçeve",
      current: Math.max(0, Math.min(ownedStoreItemIds.length - 9, 10)),
      target: 10,
    },
    {
      id: "a4",
      title: "Topluluk Oyuncusu",
      reward: "Ödül: Mavi Rozet",
      current: Math.min(acceptedFriendIds.length, 5),
      target: 5,
    },
  ];

  const handleEquip = (item: StoreItem) => {
    if (!ownedStoreItemIds.includes(item.id)) return;

    const result = equipStoreItem(item.id);

    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
    });
  };

  const renderStoreChip = (
    item: StoreItem,
    active: boolean,
    locked: boolean,
    content: ReactNode
  ) => (
    <Pressable
      key={item.id}
      onPress={() => handleEquip(item)}
      style={{
        opacity: locked ? 0.62 : 1,
      }}
    >
      <View
        style={{
          minWidth: 96,
          backgroundColor: active ? "#ecfeff" : "#f8fafc",
          borderWidth: 1,
          borderColor: active ? "#14b8a6" : "#e5e7eb",
          borderRadius: 16,
          padding: 12,
          alignItems: "center",
          position: "relative",
        }}
      >
        {content}

        <Text
          style={{
            color: "#0f172a",
            fontWeight: "800",
            fontSize: 12,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {item.name}
        </Text>

        {locked ? (
          <View
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "#0f172a",
              borderRadius: 999,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "800" }}>
              Kilitli
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: currentProfileAppearance.themeAppBgColor }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* ── Profil Kartı (Discord benzeri banner) ─────────────── */}
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          marginBottom: 18,
        }}
      >
        {/* Banner alanı */}
        <View
          style={{
            height: 110,
            backgroundColor: currentProfileAppearance.bannerColor ?? profileHeaderColor,
          }}
        />

        {/* İçerik alanı */}
        <View style={{ backgroundColor: profileHeaderColor, paddingHorizontal: 18, paddingBottom: 18 }}>
          {/* Avatar + isim satırı — avatar bannerın üstüne taşıyor */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              marginTop: -33,
              marginBottom: 10,
            }}
          >
            <View
              style={{
                width: 66,
                height: 66,
                borderRadius: 33,
                backgroundColor: currentProfileAppearance.frameColor,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
                borderWidth: 3,
                borderColor: profileHeaderColor,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: "#ffffff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>
                  {currentProfileAppearance.avatar}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text
                style={{
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: "800",
                  marginBottom: 2,
                }}
              >
            {currentUser?.displayName || currentUser?.username || "Oyuncu"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                Seviye {levelInfo.level} • {currentProfileAppearance.title}
              </Text>
            </View>
          </View>

          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginBottom: 12 }}>
            ID: {ownInternalId}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                TP {tpBalance}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.16)",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "700" }}>
                KP {kpBalance}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Bannerlar ─────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Bannerlar
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {bannerItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.bannerId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 72,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: item.color ?? "#e2e8f0",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: item.color ? "#ffffff" : "#64748b", fontSize: 10 }}>
                  {item.previewText ?? "BNR"}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          Ünvanlar
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {titleItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.titleId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <Text
                style={{
                  color: "#0f172a",
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                ÜNVAN
              </Text>
            )
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          Avatarlar
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {avatarItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.avatarId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor:
                    equippedStoreItems.avatarId === item.id ? "#14b8a6" : "#ffffff",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#0f172a" }}>
                  {item.previewText ?? item.name[0]}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          Çerçeveler
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {frameItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.frameId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: item.color ?? "#14b8a6",
                }}
              />
            )
          )}
        </View>
      </View>

      {/* ── Arka Planlar ─────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Arka Planlar
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {backgroundItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.backgroundId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: item.color ?? "#f8fafc",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#0f172a", fontSize: 10 }}>
                  {item.previewText ?? "BG"}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* ── Rozetler ──────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Rozetler
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {badgeItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.badgeId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: item.color ?? "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.previewText ?? "🔵"}</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* ── Giriş Efektleri ───────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Giriş Efektleri
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {entryEffectItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.entryEffectId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 23,
                  backgroundColor: item.color ?? "#f1f5f9",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 20 }}>{item.previewText ?? "✨"}</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* ── Temalar ───────────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Temalar
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {themeItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.themeId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: item.color ?? "#14b8a6",
                }}
              />
            )
          )}
        </View>
      </View>

      {/* ── Mesaj Stilleri ────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 18,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 12 }}>
          Mesaj Stilleri
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {messageStyleItems.map((item) =>
            renderStoreChip(
              item,
              equippedStoreItems.messageStyleId === item.id,
              !ownedStoreItemIds.includes(item.id),
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: item.color ?? "#f1f5f9",
                  borderWidth: 1,
                  borderColor: "#e5e7eb",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#0f172a" }}>
                  {item.previewText ?? "Aa"}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: 6,
          }}
        >
          Kullanıcı Uzmanlık Haritası
        </Text>

        <Text
          style={{
            color: "#64748b",
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 14,
          }}
        >
          Kategori bazlı performans burada görünüyor.
        </Text>

        <Svg width={size} height={size}>
          {[outerRadius / 3, (outerRadius / 3) * 2, outerRadius].map((ring) => (
            <Polygon
              key={ring}
              points={toPointString(stats.map((_, index) => getPoint(index, ring)))}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          {stats.map((_, index) => {
            const point = getPoint(index, outerRadius);
            return (
              <Line
                key={`line-${index}`}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            );
          })}

          <Polygon
            points={toPointString(dataPoints)}
            fill="rgba(20,184,166,0.22)"
            stroke="#14b8a6"
            strokeWidth="3"
          />

          {dataPoints.map((point, index) => (
            <Circle
              key={`dot-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#14b8a6"
            />
          ))}

          {stats.map((stat, index) => {
            const labelPoint = getPoint(index, outerRadius + 22);
            return (
              <SvgText
                key={`label-${index}`}
                x={labelPoint.x}
                y={labelPoint.y + 4}
                fontSize="11"
                fontWeight="700"
                fill="#475569"
                textAnchor="middle"
              >
                {stat.label}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* ── Bu Sezon İstatistikleri ───────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", flex: 1 }}>
            Tahmin İstatistikleri
          </Text>
          <View
            style={{
              backgroundColor: "#ecfeff",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#0f766e", fontWeight: "800", fontSize: 11 }}>
              BU SEZON
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { label: "Sorular", value: predictionStats.totalQuestions.toString(), color: "#2563eb" },
            { label: "Yatırılan TP", value: predictionStats.totalStaked.toLocaleString(), color: "#7c3aed" },
            { label: "Kazanılan TP", value: predictionStats.totalWon.toLocaleString(), color: "#16a34a" },
            { label: "Kaybedilen TP", value: predictionStats.totalLost.toLocaleString(), color: "#dc2626" },
            {
              label: "Kazanma Oranı",
              value: predictionStats.totalQuestions > 0
                ? `%${Math.round(predictionStats.winRate * 100)}`
                : "—",
              color: "#0f766e",
            },
            {
              label: "K/Z",
              value: predictionStats.profitLoss >= 0
                ? `+${predictionStats.profitLoss}`
                : `${predictionStats.profitLoss}`,
              color: predictionStats.profitLoss >= 0 ? "#16a34a" : "#dc2626",
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 14,
                padding: 12,
                minWidth: "45%",
                flex: 1,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                {stat.label.toUpperCase()}
              </Text>
              <Text style={{ color: stat.color, fontSize: 18, fontWeight: "800" }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Kariyer İstatistikleri ────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
          <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", flex: 1 }}>
            Kariyer İstatistikleri
          </Text>
          <View
            style={{
              backgroundColor: "#fef9c3",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#a16207", fontWeight: "800", fontSize: 11 }}>
              TÜM ZAMANLAR
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            {
              label: "Sezon Sayısı",
              value: careerStats.totalSeasons.toString(),
              color: "#2563eb",
            },
            {
              label: "Toplam Soru",
              value: (careerStats.allTimeQuestions + predictionStats.totalQuestions).toLocaleString(),
              color: "#7c3aed",
            },
            {
              label: "Toplam Yatırım",
              value: (careerStats.allTimeStaked + predictionStats.totalStaked).toLocaleString(),
              color: "#0f766e",
            },
            {
              label: "Toplam Kazanç",
              value: (careerStats.allTimeWon + predictionStats.totalWon).toLocaleString(),
              color: "#16a34a",
            },
            {
              label: "En İyi Oran",
              value: `%${Math.round(careerStats.bestWinRate * 100)}`,
              color: "#f59e0b",
            },
            {
              label: "En İyi Sezon KP",
              value: careerStats.bestSeasonKp.toLocaleString(),
              color: "#dc2626",
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 14,
                padding: 12,
                minWidth: "45%",
                flex: 1,
              }}
            >
              <Text style={{ color: "#94a3b8", fontSize: 11, fontWeight: "700", marginBottom: 4 }}>
                {stat.label.toUpperCase()}
              </Text>
              <Text style={{ color: stat.color, fontSize: 18, fontWeight: "800" }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Hesap İşlemleri ─────────────────────────────────────── */}
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 16,
          gap: 12,
        }}
      >
        <Text style={{ color: "#0f172a", fontSize: 20, fontWeight: "800", marginBottom: 4 }}>
          Hesap
        </Text>

        <Pressable
          onPress={() => {
            if (Platform.OS === "web") {
              if (window.confirm("Oturumu kapatmak istediğine emin misin?")) {
                signOut();
              }
            } else {
              Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğine emin misin?", [
                { text: "İptal", style: "cancel" },
                { text: "Çıkış Yap", style: "destructive", onPress: () => signOut() },
              ]);
            }
          }}
          style={{
            backgroundColor: "#f1f5f9",
            borderRadius: 14,
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Text style={{ color: "#0f172a", fontWeight: "700", fontSize: 15, flex: 1 }}>
            Çıkış Yap
          </Text>
          <Text style={{ color: "#64748b", fontSize: 18 }}>→</Text>
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          Başarımlar
        </Text>

        {achievements.map((item) => {
          const progress = Math.min(1, item.current / item.target);
          const completed = item.current >= item.target;

          return (
            <View
              key={item.id}
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: 18,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#0f172a",
                  fontWeight: "800",
                  marginBottom: 4,
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  color: "#64748b",
                  marginBottom: 10,
                }}
              >
                {item.reward}
              </Text>

              <View
                style={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "#e2e8f0",
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    width: `${progress * 100}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: completed ? "#14b8a6" : "#2563eb",
                  }}
                />
              </View>

              <Text
                style={{
                  color: completed ? "#0f766e" : "#475569",
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                {item.current}/{item.target} {completed ? "• Tamamlandı" : ""}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}