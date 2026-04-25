import { useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import Svg, {
  Circle,
  Line,
  Polygon,
  Text as SvgText,
} from "react-native-svg";
import { getUserById } from "../../data/mockUsers";

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

export default function KullaniciProfilPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = getUserById(id);

  if (!user) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#f8fafc",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#0f172a" }}>
          Kullanıcı bulunamadı
        </Text>
      </View>
    );
  }

  const gridRings = [outerRadius / 3, (outerRadius / 3) * 2, outerRadius];
  const dataPoints = user.stats.map((stat, index) =>
    getPoint(index, outerRadius * (stat.value / 100))
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View
        style={{
          backgroundColor: "#14b8a6",
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              backgroundColor: user.frameColor,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
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
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#0f172a" }}>
                {user.avatar}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: user.titleColor,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: "#ffffff", fontWeight: "800", fontSize: 11 }}>
                {user.title}
              </Text>
            </View>

            <Text
              style={{
                color: "#ffffff",
                fontSize: 24,
                fontWeight: "800",
                marginBottom: 4,
              }}
            >
              {user.name}
            </Text>

            <Text style={{ color: "#ffffff", lineHeight: 21 }}>{user.bio}</Text>
          </View>
        </View>

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
              Seviye {user.level}
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
              %{user.winRate} oran
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "white",
          borderRadius: 22,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          padding: 16,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: "800",
            color: "#0f172a",
            marginBottom: 14,
          }}
        >
          Kullanıcı İstatistikleri
        </Text>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <View
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#64748b", fontSize: 12 }}>Kazanma oranı</Text>
            <Text style={{ color: "#0f172a", fontWeight: "800" }}>
              %{user.winRate}
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
            <Text style={{ color: "#64748b", fontSize: 12 }}>Toplam tahmin</Text>
            <Text style={{ color: "#0f172a", fontWeight: "800" }}>
              {user.totalPredictions}
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
            <Text style={{ color: "#64748b", fontSize: 12 }}>Toplam kupon</Text>
            <Text style={{ color: "#0f172a", fontWeight: "800" }}>
              {user.totalCoupons}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#0f172a",
          borderRadius: 22,
          padding: 18,
          marginBottom: 18,
        }}
      >
        <Text
          style={{
            color: "#94a3b8",
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          MODEL VİTRİNİ
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 12,
          }}
        >
          3D Model Prototip Alanı
        </Text>

        <View
          style={{
            height: 260,
            borderRadius: 20,
            backgroundColor: "#111827",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              bottom: 26,
              width: 170,
              height: 24,
              borderRadius: 999,
              backgroundColor: "rgba(20,184,166,0.28)",
            }}
          />

          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#fde68a",
                marginBottom: 8,
              }}
            />
            <View
              style={{
                width: 74,
                height: 90,
                borderRadius: 22,
                backgroundColor: user.frameColor,
                marginBottom: 6,
              }}
            />
            <View style={{ flexDirection: "row", gap: 22 }}>
              <View
                style={{
                  width: 18,
                  height: 84,
                  borderRadius: 10,
                  backgroundColor: "#99f6e4",
                }}
              />
              <View
                style={{
                  width: 18,
                  height: 84,
                  borderRadius: 10,
                  backgroundColor: "#99f6e4",
                }}
              />
            </View>
          </View>
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
          Bu kullanıcının kategori bazlı gücü burada görünüyor.
        </Text>

        <Svg width={size} height={size}>
          {gridRings.map((ring) => (
            <Polygon
              key={ring}
              points={toPointString(
                user.stats.map((_, index) => getPoint(index, ring))
              )}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          ))}

          {user.stats.map((_, index) => {
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

          {user.stats.map((stat, index) => {
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
    </ScrollView>
  );
}