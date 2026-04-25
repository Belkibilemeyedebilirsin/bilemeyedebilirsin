import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useAppData, type LiveTaskItem } from "../context/AppDataContext";
import { useAppSettings } from "../context/AppSettingsContext";
import { useUIFeedback } from "../context/UIFeedbackContext";
import type { TaskPeriod } from "../types";

const TAB_LABELS: { key: TaskPeriod; label: string; icon: string }[] = [
  { key: "daily", label: "Günlük", icon: "today-outline" },
  { key: "weekly", label: "Haftalık", icon: "calendar-outline" },
  { key: "seasonal", label: "Sezonluk", icon: "trophy-outline" },
];

const PERIOD_COLORS: Record<TaskPeriod, { bg: string; progress: string; badge: string }> = {
  daily: { bg: "#14b8a6", progress: "#14b8a6", badge: "#ccfbf1" },
  weekly: { bg: "#2563eb", progress: "#2563eb", badge: "#dbeafe" },
  seasonal: { bg: "#7c3aed", progress: "#7c3aed", badge: "#ede9fe" },
};

function TaskCard({
  task,
  onClaim,
  compactMode,
}: {
  task: LiveTaskItem;
  onClaim: (taskId: string) => void;
  compactMode: boolean;
}) {
  const progress = Math.min(task.current / task.target, 1);
  const isCompleted = task.current >= task.target;
  const canClaim = isCompleted && !task.claimed;
  const colors = PERIOD_COLORS[task.period];

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 22,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        padding: compactMode ? 12 : 16,
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
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text
            style={{
              fontSize: compactMode ? 17 : 18,
              fontWeight: "800",
              color: "#0f172a",
              marginBottom: 6,
            }}
          >
            {task.title}
          </Text>

          <Text style={{ color: "#475569", lineHeight: 22 }}>
            {task.description}
          </Text>
        </View>

        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <View
            style={{
              backgroundColor: isCompleted ? "#ccfbf1" : colors.badge,
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#0f766e", fontWeight: "800" }}>
              +{task.rewardTp} TP
            </Text>
          </View>
          {task.rewardKp ? (
            <View
              style={{
                backgroundColor: "#fef9c3",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: "#854d0e", fontWeight: "700", fontSize: 12 }}>
                +{task.rewardKp} KP
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={{
          backgroundColor: "#e2e8f0",
          height: 10,
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: isCompleted ? "#14b8a6" : colors.progress,
            borderRadius: 999,
          }}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#64748b", fontWeight: "700" }}>
          {task.current} / {task.target}
        </Text>

        <Pressable
          onPress={() => {
            if (canClaim) onClaim(task.id);
          }}
          style={{
            backgroundColor: task.claimed
              ? "#cbd5e1"
              : canClaim
              ? "#14b8a6"
              : "#ccfbf1",
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              color: task.claimed ? "#475569" : canClaim ? "#ffffff" : "#0f766e",
              fontWeight: "800",
            }}
          >
            {task.claimed ? "Toplandı" : "Topla"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function GorevlerPage() {
  const { tasks, claimTask } = useAppData();
  const { showFeedback } = useUIFeedback();
  const { compactMode } = useAppSettings();
  const [activeTab, setActiveTab] = useState<TaskPeriod>("daily");

  const filtered = tasks.filter((t) => t.period === activeTab);
  const completedCount = filtered.filter((t) => t.current >= t.target).length;
  const totalCount = filtered.length;

  const tabColor = PERIOD_COLORS[activeTab].bg;

  const handleClaim = (taskId: string) => {
    const result = claimTask(taskId);
    showFeedback({
      type: result.type,
      title: result.title,
      message: result.message,
      tpDelta: result.tpDelta,
      kpDelta: result.kpDelta,
      xpDelta: result.xpDelta,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8fafc" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      {/* Header banner */}
      <View
        style={{
          backgroundColor: tabColor,
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
          GÖREVLER
        </Text>

        <Text
          style={{
            color: "#ffffff",
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 16,
          }}
        >
          Görevlerini tamamla, ödüllerini topla
        </Text>

        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.16)",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: "#ffffff", fontSize: 12, marginBottom: 2 }}>
              Toplam
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {totalCount}
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
              Tamamlanan
            </Text>
            <Text style={{ color: "#ffffff", fontWeight: "800" }}>
              {completedCount}
            </Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#f1f5f9",
          borderRadius: 16,
          padding: 4,
          marginBottom: 16,
        }}
      >
        {TAB_LABELS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: isActive ? PERIOD_COLORS[tab.key].bg : "transparent",
              }}
            >
              <Ionicons
                name={tab.icon as any}
                size={15}
                color={isActive ? "#ffffff" : "#64748b"}
              />
              <Text
                style={{
                  color: isActive ? "#ffffff" : "#64748b",
                  fontWeight: "800",
                  fontSize: 13,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Task list */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <Ionicons name="checkmark-circle-outline" size={18} color="#334155" />
        <Text style={{ color: "#334155", fontWeight: "700", fontSize: 16 }}>
          {TAB_LABELS.find((t) => t.key === activeTab)?.label} Görevler
        </Text>
      </View>

      {filtered.length === 0 ? (
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            padding: 24,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#94a3b8", fontWeight: "700" }}>
            Bu periyotta görev bulunamadı.
          </Text>
        </View>
      ) : (
        filtered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClaim={handleClaim}
            compactMode={compactMode}
          />
        ))
      )}
    </ScrollView>
  );
}
