import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Check, Leaf, ArrowRight, Sparkles } from "lucide-react-native";

import { getMilestone } from "@/lib/data";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const MUTED = "#9A9094";

interface MilestoneDetail {
  _id: string;
  title: string;
  summary: string;
  week_label: string;
  status: string;
  what_happening: string;
  focus_goals: string;
  actions: string;
  phase_title?: string;
}

function safeParseArray(str: string): string[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const config =
    {
      completed: { label: "Completed", bg: `${SUCCESS}15`, color: SUCCESS },
      current: { label: "In Progress", bg: "rgba(212,176,106,0.15)", color: GOLD },
      upcoming: { label: "Upcoming", bg: "#EDE8DF", color: MUTED },
    }[status] ?? { label: status, bg: "#EDE8DF", color: MUTED };

  return (
    <Text
      className="text-2xs font-semibold px-2.5 py-1 rounded-pill"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </Text>
  );
}

export default function MilestoneDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [milestone, setMilestone] = useState<MilestoneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMilestone(id);
        if (!data) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setMilestone(data);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <LoadingScreen message="Loading milestone…" />;

  if (notFound || !milestone) {
    return (
      <View className="flex-1 bg-bg items-center justify-center gap-4 px-6">
        <Text className="text-sm text-muted text-center">Milestone not found.</Text>
        <Pressable onPress={() => router.push("/journey/protocol")}>
          <Text className="text-sm font-semibold text-gold">← Back to roadmap</Text>
        </Pressable>
      </View>
    );
  }

  const focusGoals = safeParseArray(milestone.focus_goals);
  const actions = safeParseArray(milestone.actions);

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="px-6 pt-5">
        <Pressable onPress={() => router.push("/journey/protocol")} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={18} color={MUTED} />
          <Text className="text-sm text-muted">Back to roadmap</Text>
        </Pressable>

        <View className="flex-row items-center gap-2 mb-2">
          <Text className="text-2xs text-muted bg-section px-2.5 py-1 rounded-pill">{milestone.week_label}</Text>
          <StatusBadge status={milestone.status} />
        </View>

        <Text className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {milestone.title}
        </Text>
        <Text className="text-sm text-secondary leading-relaxed">{milestone.summary}</Text>
      </View>

      <View className="px-6 mt-5">
        <View
          className="bg-card rounded-[22px] p-5"
          style={{
            borderWidth: 1,
            borderColor:
              milestone.status === "current"
                ? "rgba(212,176,106,0.45)"
                : milestone.status === "completed"
                  ? `${SUCCESS}30`
                  : "rgba(180,155,120,0.18)",
          }}
        >
          <View className="flex-row items-center gap-3.5">
            <View
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  milestone.status === "completed"
                    ? `${SUCCESS}15`
                    : milestone.status === "current"
                      ? "rgba(212,176,106,0.15)"
                      : "#EDE8DF",
                borderWidth: 2,
                borderColor:
                  milestone.status === "completed" ? SUCCESS : milestone.status === "current" ? GOLD : "rgba(180,155,120,0.35)",
              }}
            >
              {milestone.status === "completed" ? (
                <Check size={18} color={SUCCESS} />
              ) : (
                <View
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: milestone.status === "current" ? GOLD : "rgba(180,155,120,0.5)" }}
                />
              )}
            </View>
            <View>
              <Text className="text-base font-semibold text-primary">
                {milestone.status === "completed"
                  ? "Milestone Completed"
                  : milestone.status === "current"
                    ? "Active Milestone"
                    : "Upcoming Milestone"}
              </Text>
              <Text className="text-xs text-muted mt-0.5">
                {milestone.week_label}
                {milestone.phase_title ? ` · ${milestone.phase_title}` : ""}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {milestone.what_happening && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <View className="flex-row items-start gap-2.5 mb-3">
              <Sparkles size={14} color={GOLD} />
              <Text className="text-2xs text-gold uppercase tracking-widest font-semibold">What's happening</Text>
            </View>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic">
              {milestone.what_happening}
            </Text>
          </View>
        </View>
      )}

      {focusGoals.length > 0 && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">Focus Goals</Text>
            <View className="gap-2.5">
              {focusGoals.map((goal, i) => (
                <View key={i} className="flex-row items-start gap-2.5 px-3.5 py-3 bg-section rounded-xl">
                  <Leaf size={12} color={GOLD} />
                  <Text className="text-sm text-primary leading-snug flex-1">{goal}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {actions.length > 0 && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">Actions</Text>
            <View className="gap-2">
              {actions.map((action, i) => (
                <View
                  key={i}
                  className="flex-row items-start gap-2.5 px-3.5 py-3 bg-elevated rounded-xl border border-border"
                >
                  <View
                    className="w-5 h-5 rounded-full items-center justify-center mt-0.5"
                    style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
                  >
                    <Text className="text-2xs font-bold text-gold">{i + 1}</Text>
                  </View>
                  <Text className="text-sm text-primary leading-snug flex-1">{action}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      <View className="px-6 mt-5">
        <Pressable
          onPress={() => router.push("/journey/protocol")}
          className="py-3.5 rounded-2xl flex-row items-center justify-center gap-2"
          style={{ backgroundColor: GOLD }}
        >
          <Text className="text-sm font-semibold text-white">Back to Roadmap</Text>
          <ArrowRight size={15} color="#fff" />
        </Pressable>
      </View>
    </ScrollView>
  );
}
