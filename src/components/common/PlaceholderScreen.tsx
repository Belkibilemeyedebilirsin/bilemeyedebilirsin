import { Text, View } from "react-native";

type PlaceholderScreenProps = {
  title: string;
  subtitle?: string;
};

export default function PlaceholderScreen({
  title,
  subtitle,
}: PlaceholderScreenProps) {
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
      <Text
        style={{
          fontSize: 28,
          fontWeight: "800",
          color: "#0f172a",
          marginBottom: 10,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          fontSize: 15,
          color: "#475569",
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        {subtitle ?? "Bu ekranın detay tasarımını birazdan kuracağız."}
      </Text>
    </View>
  );
}