import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { getWeekDetail, createWeekDetail } from "@/lib/data";
import { triggerGenerateWeekDetail } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const MUTED = "#9A9094";

function getTrimesterMeta(week: number) {
  if (week <= 12)
    return { label: "First Trimester", range: "Weeks 1–12", color: SUCCESS, next: "Second trimester begins at week 13" };
  if (week <= 26)
    return { label: "Second Trimester", range: "Weeks 13–26", color: GOLD, next: "Third trimester begins at week 27" };
  return {
    label: "Third Trimester",
    range: "Weeks 27–40",
    color: "#E07B5F",
    next: week >= 38 ? "Birth window — baby is ready" : `${40 - week} weeks remaining`,
  };
}

export default function PregnancyScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();

  const [weekDetail, setWeekDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [generating, setGenerating] = useState(false);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || loading) return;
    if (hasGenerated.current) return;
    loadWeekDetail();
  }, [profile, loading]);

  function parseAI(raw: string) {
    if (!raw) throw new Error("Empty AI response");
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }

  function isValidObject(obj: any) {
    return obj && typeof obj === "object" && Object.keys(obj).length > 0;
  }

  async function loadWeekDetail() {
    if (hasGenerated.current) return;

    const week = profile!.current_week ?? 0;
    const uid = getUserId() ?? profile!._id;

    try {
      const existing = await getWeekDetail(week);

      if (isValidObject(existing)) {
        setWeekDetail(existing);
        setLoadingDetail(false);
        return;
      }

      hasGenerated.current = true;
      setGenerating(true);

      const parsed = await triggerGenerateWeekDetail();

      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid AI structure");
      }

      const id = await createWeekDetail({
        week_number: week,
        trimester: parsed.trimester ?? "",
        baby_milestone: parsed.baby_milestone ?? "",
        nutrition_focus: parsed.nutrition_focus ?? "",
        movement_focus: parsed.movement_focus ?? "",
        supplements: parsed.supplements ?? "",
        appointments: JSON.stringify(parsed.appointments ?? []),
        avoid_today: parsed.avoid_today ?? "",
        job_note: parsed.job_note ?? "",
      });

      setWeekDetail({
        _id: id,
        week_number: week,
        trimester: parsed.trimester ?? "",
        baby_milestone: parsed.baby_milestone ?? "",
        nutrition_focus: parsed.nutrition_focus ?? "",
        movement_focus: parsed.movement_focus ?? "",
        supplements: parsed.supplements ?? "",
        appointments: JSON.stringify(parsed.appointments ?? []),
        avoid_today: parsed.avoid_today ?? "",
        job_note: parsed.job_note ?? "",
      });
    } catch (err) {
      console.error("loadWeekDetail error:", err);
    } finally {
      setLoadingDetail(false);
      setGenerating(false);
    }
  }

  if (!profile || loading) return <LoadingScreen message="Loading pregnancy protocol…" />;

  const week = profile.current_week ?? 0;
  const trimester = getTrimesterMeta(week);
  const progress = week / 40;

  const trimesters = [
    { label: "First Trimester", range: "Weeks 1–12", start: 1, end: 12 },
    { label: "Second Trimester", range: "Weeks 13–26", start: 13, end: 26 },
    { label: "Third Trimester", range: "Weeks 27–40", start: 27, end: 40 },
  ].map((t) => ({
    ...t,
    status: week > t.end ? "completed" : week >= t.start ? "current" : "upcoming",
  }));

  function getAppointments(): string[] {
    if (!weekDetail?.appointments) return [];
    try {
      return JSON.parse(weekDetail.appointments);
    } catch {
      return [];
    }
  }

  function getSupplements(): string[] {
    const src = weekDetail?.supplements || protocol?.supplements || "";
    return src.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  if (loadingDetail) {
    return (
      <LoadingScreen message={generating ? `Generating your week ${week} protocol…` : "Loading…"} />
    );
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="px-6 pt-5">
        <Pressable onPress={() => router.push("/journey")} className="flex-row items-center gap-1 mb-4">
          <ChevronLeft size={18} color={MUTED} />
          <Text className="text-sm text-muted">Back</Text>
        </Pressable>
        <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
          {weekDetail?.trimester ?? trimester.label}
        </Text>
        <Text className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          Week {week} Protocol
        </Text>
        <Text className="text-sm text-secondary leading-relaxed">
          AI-generated and personalized to your profile, job, and current week.
        </Text>
      </View>

      <View className="px-6 mt-5">
        <View className="bg-card rounded-[22px] p-5 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Pregnancy Progress
              </Text>
              <Text className="text-lg font-semibold text-primary">Week {week} of 40</Text>
              <Text className="text-xs font-medium mt-0.5" style={{ color: trimester.color }}>
                {weekDetail?.trimester ?? trimester.label}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-semibold text-primary">{Math.round(progress * 100)}%</Text>
              <Text className="text-2xs text-muted">complete</Text>
            </View>
          </View>
          <View className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
            <View className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: GOLD }} />
          </View>
          <Text className="text-xs text-muted">{trimester.next}</Text>
        </View>
      </View>

      {(weekDetail?.baby_milestone || protocol?.baby_focus) && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <View className="flex-row items-start gap-2.5 mb-3">
              <Sparkles size={14} color={GOLD} />
              <Text className="text-2xs text-gold uppercase tracking-widest font-semibold">
                Baby at Week {week}
              </Text>
            </View>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic">
              {weekDetail?.baby_milestone || protocol?.baby_focus}
            </Text>
          </View>
        </View>
      )}

      {weekDetail?.job_note && (
        <View className="px-6 mt-4">
          <View
            className="flex-row items-start gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
          >
            <Sparkles size={13} color={GOLD} />
            <View className="flex-1">
              <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
                Your job this week
              </Text>
              <Text className="text-sm text-secondary leading-relaxed font-serif italic">{weekDetail.job_note}</Text>
            </View>
          </View>
        </View>
      )}

      <View className="px-6 mt-5">
        <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          Trimester Roadmap
        </Text>
        <View className="gap-2.5">
          {trimesters.map((t) => {
            const color = t.status === "completed" ? SUCCESS : t.status === "current" ? GOLD : MUTED;
            return (
              <View
                key={t.label}
                className="bg-card rounded-[18px] p-4"
                style={{
                  borderWidth: 1,
                  borderColor: t.status === "current" ? "rgba(212,176,106,0.45)" : "rgba(180,155,120,0.18)",
                  opacity: t.status === "upcoming" ? 0.6 : 1,
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{
                      backgroundColor:
                        t.status === "completed" ? `${SUCCESS}15` : t.status === "current" ? "rgba(212,176,106,0.15)" : "#EDE8DF",
                      borderWidth: 2,
                      borderColor: color,
                    }}
                  >
                    {t.status === "completed" ? (
                      <Check size={14} color={SUCCESS} />
                    ) : (
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: t.status === "current" ? GOLD : MUTED }} />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-primary">{t.label}</Text>
                    <Text className="text-2xs text-muted">{t.range}</Text>
                  </View>
                  {t.status === "current" && (
                    <Text
                      className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                      style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
                    >
                      Active
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View className="px-6 mt-5 gap-3">
        <View className="bg-card rounded-[22px] p-5 border border-border">
          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Nutrition This Week
          </Text>
          <Text className="text-sm text-secondary leading-relaxed font-serif italic">
            {weekDetail?.nutrition_focus || protocol?.nutrition_plan || "Loading nutrition guidance…"}
          </Text>
        </View>

        {getSupplements().length > 0 && (
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Supplements for Week {week}
            </Text>
            <View className="gap-2">
              {getSupplements().map((s, i) => (
                <View key={i} className="flex-row items-center gap-2.5 px-3.5 py-2.5 bg-section rounded-xl">
                  <View className="w-1.5 h-1.5 rounded-full bg-gold" />
                  <Text className="text-sm text-primary">{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View className="bg-card rounded-[22px] p-5 border border-border">
          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Movement This Week
          </Text>
          <Text className="text-sm text-secondary leading-relaxed font-serif italic">
            {weekDetail?.movement_focus || protocol?.movement || "Loading movement guidance…"}
          </Text>
        </View>

        {(weekDetail?.avoid_today || protocol?.avoid_today) && (
          <View
            className="flex-row items-start gap-2 px-3.5 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(194,107,46,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(194,107,46,0.3)" }}
          >
            <Text className="text-warning text-xs">⚠</Text>
            <View className="flex-1">
              <Text className="text-2xs text-warning uppercase tracking-widest font-semibold mb-1">
                Avoid This Week
              </Text>
              <Text className="text-sm leading-snug" style={{ color: "#C26B2E" }}>
                {weekDetail?.avoid_today || protocol?.avoid_today}
              </Text>
            </View>
          </View>
        )}

        {getAppointments().length > 0 && (
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Appointments & Checks
            </Text>
            <View className="gap-2">
              {getAppointments().map((a, i) => (
                <View key={i} className="flex-row items-start gap-2.5">
                  <ChevronRight size={14} color={GOLD} />
                  <Text className="text-sm text-secondary flex-1">{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Pressable
          onPress={() => {
            hasGenerated.current = false;
            setLoadingDetail(true);
            loadWeekDetail();
          }}
          className="py-3.5 rounded-2xl items-center"
          style={{ borderWidth: 1, borderColor: "rgba(212,176,106,0.35)" }}
        >
          <Text className="text-sm font-semibold text-gold">Regenerate for Week {week}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
