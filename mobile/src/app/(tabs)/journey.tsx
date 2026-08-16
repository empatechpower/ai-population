import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Sparkles } from "lucide-react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { getJourneyPhases, getMilestones, createJourneyPhase, createMilestone } from "@/lib/data";
import { triggerGenerateJourney } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const PURPLE = "#667EEA";

function getPregnancyPhaseLabel(week: number) {
  if (week <= 12) return { phase: "First Trimester", color: SUCCESS };
  if (week <= 26) return { phase: "Second Trimester", color: GOLD };
  return { phase: "Third Trimester", color: "#E07B5F" };
}

function getPostpartumPhaseLabel(week: number) {
  if (week <= 6) return { phase: "Acute Recovery", color: PURPLE };
  if (week <= 12) return { phase: "Active Recovery", color: "#8E7FE8" };
  return { phase: "Integration Phase", color: GOLD };
}

function getBabySize(week: number) {
  const sizes: Record<number, { size: string; weight: string }> = {
    4: { size: "Poppy seed", weight: "<1g" },
    6: { size: "Lentil", weight: "~1g" },
    8: { size: "Raspberry", weight: "~1g" },
    10: { size: "Strawberry", weight: "~4g" },
    12: { size: "Lime", weight: "~14g" },
    14: { size: "Lemon", weight: "~43g" },
    16: { size: "Avocado", weight: "~100g" },
    18: { size: "Sweet potato", weight: "~190g" },
    20: { size: "Banana", weight: "~300g" },
    24: { size: "Ear of corn", weight: "~600g" },
    28: { size: "Eggplant", weight: "~1kg" },
    32: { size: "Squash", weight: "~1.7kg" },
    36: { size: "Romaine lettuce", weight: "~2.7kg" },
    40: { size: "Watermelon", weight: "~3.4kg" },
  };
  const keys = Object.keys(sizes).map(Number).sort((a, b) => a - b);
  const closest = keys.reduce((p, c) => (Math.abs(c - week) < Math.abs(p - week) ? c : p));
  return sizes[closest];
}

function RoadmapIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.6}>
      <Circle cx={5} cy={22} r={2.2} />
      <Circle cx={14} cy={13} r={2.2} />
      <Circle cx={23} cy={5} r={2.2} />
      <Path d="M6.5 20.5 C9 17 11.5 15 11.8 14.5" strokeLinecap="round" />
      <Path d="M16.2 11.5 C18.5 9 21 6.5 21.2 6.8" strokeLinecap="round" />
    </Svg>
  );
}

function GrowthIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.6}>
      <Path d="M4 22 C7 18 10 16 13 17 C16 18 19 13 24 7" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={9} cy={19} r={1.6} />
      <Circle cx={14} cy={17} r={1.6} />
      <Circle cx={19} cy={13} r={1.6} />
    </Svg>
  );
}

function AfterBirthIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth={1.6}>
      <Path d="M4 19 Q14 8 24 19" strokeLinecap="round" />
      <Line x1={4} y1={22} x2={24} y2={22} />
      <Line x1={9} y1={19} x2={9} y2={22} />
      <Line x1={19} y1={19} x2={19} y2={22} />
      <Circle cx={14} cy={5} r={2.2} />
      <Line x1={14} y1={7.4} x2={14} y2={10} />
    </Svg>
  );
}

export default function JourneyScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();

  const [phases, setPhases] = useState<any[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [generating, setGenerating] = useState(false);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || loading) return;
    if (hasGenerated.current) return;
    loadJourney();
  }, [profile, loading]);

  async function loadJourney() {
    try {
      const uid = getUserId() ?? profile!._id;
      const existingPhases = await getJourneyPhases();

      if (existingPhases.length > 0) {
        const withMilestones = await Promise.all(
          existingPhases.map(async (p: any) => ({ ...p, milestones: await getMilestones(p._id) })),
        );
        setPhases(withMilestones);
        setLoadingJourney(false);
        return;
      }

      hasGenerated.current = true;
      setGenerating(true);

      try {
        const parsed = await triggerGenerateJourney(uid);
        const aiPhases = parsed.phases || [];

        const createdPhases = await Promise.all(
          aiPhases.map(async (p: any) => {
            const phaseId = await createJourneyPhase({
              protocol: protocol?._id ?? "",
              phase_number: p.phase_number,
              title: p.title,
              week_range: p.week_range,
              status: p.status,
            });
            const milestones = await Promise.all(
              (p.milestones || []).map((m: any) =>
                createMilestone({
                  phase: phaseId,
                  week_label: m.week_label,
                  title: m.title,
                  summary: m.summary,
                  status: m.status,
                  what_happening: m.what_happening,
                  focus_goals: JSON.stringify(m.focus_goals || []),
                  actions: JSON.stringify(m.actions || []),
                }).then((mid) => ({
                  _id: mid,
                  week_label: m.week_label,
                  title: m.title,
                  summary: m.summary,
                  status: m.status,
                  what_happening: m.what_happening,
                  focus_goals: JSON.stringify(m.focus_goals || []),
                  actions: JSON.stringify(m.actions || []),
                })),
              ),
            );

            return {
              _id: phaseId,
              phase_number: p.phase_number,
              title: p.title,
              week_range: p.week_range,
              status: p.status,
              milestones,
            };
          }),
        );

        setPhases(createdPhases);
      } catch (parseErr) {
        console.error("Failed to parse journey AI response:", parseErr);
      }

      setLoadingJourney(false);
      setGenerating(false);
    } catch (err) {
      console.error(err);
      setLoadingJourney(false);
      setGenerating(false);
    }
  }

  if (!profile || loading) return <LoadingScreen message="Loading your journey…" />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const week = profile.current_week ?? 0;
  const isPregnant = jt === "currently_pregnant";
  const isPostpartum = jt === "postpartum";

  const phaseLabel = isPregnant
    ? getPregnancyPhaseLabel(week)
    : isPostpartum
      ? getPostpartumPhaseLabel(week)
      : null;

  const progress = isPregnant ? week / 40 : isPostpartum ? Math.min(week / 52, 1) : 0.05;

  const weekLabel = isPregnant
    ? `Week ${week} of 40`
    : isPostpartum
      ? `Week ${week} postpartum`
      : "Your journey starts here";

  const babySize = isPregnant && week > 0 ? getBabySize(week) : null;
  const currentPhase = phases.find((p) => p.status === "current");
  const circ = 2 * Math.PI * 23;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      {/* Header */}
      <View className="px-6 pt-6">
        <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1.5">
          Journey
        </Text>
        <Text className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {jt === "trying_to_conceive" ? "Your Path to Conception" : isPregnant ? "Your Pregnancy" : "Your Recovery"}
        </Text>
        {protocol?.fertility_tip && (
          <Text className="font-serif italic text-sm text-secondary leading-relaxed">
            {protocol.fertility_tip}
          </Text>
        )}
      </View>

      {/* Progress strip */}
      <View className="px-6 mt-5">
        <View className="bg-card rounded-[22px] p-5 border border-border">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1 pr-3">
              <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                {isPregnant ? "Pregnancy Progress" : isPostpartum ? "Recovery Progress" : "Fertility Journey"}
              </Text>
              <Text className="text-lg font-semibold text-primary">{weekLabel}</Text>
              {phaseLabel && (
                <Text className="text-xs mt-0.5 font-medium" style={{ color: phaseLabel.color }}>
                  {phaseLabel.phase}
                </Text>
              )}
            </View>
            <View style={{ width: 56, height: 56 }}>
              <Svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: [{ rotate: "-90deg" }] }}>
                <Circle cx={28} cy={28} r={23} fill="none" stroke="rgba(180,155,120,0.18)" strokeWidth={4} />
                <Circle
                  cx={28}
                  cy={28}
                  r={23}
                  fill="none"
                  stroke={phaseLabel?.color ?? GOLD}
                  strokeWidth={4}
                  strokeDasharray={`${progress * circ} ${circ}`}
                  strokeLinecap="round"
                />
              </Svg>
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-xs font-bold text-primary">{Math.round(progress * 100)}%</Text>
              </View>
            </View>
          </View>

          {currentPhase && (
            <View className="flex-row mt-3 pt-3 border-t border-border">
              <View className="flex-1 pr-3">
                <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Now</Text>
                <Text className="text-sm text-primary font-medium leading-snug">{currentPhase.title}</Text>
              </View>
              <View className="w-px bg-border" />
              <View className="flex-1 pl-3">
                <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">Phase</Text>
                <Text className="text-sm text-secondary leading-snug">{currentPhase.week_range}</Text>
              </View>
            </View>
          )}

          {protocol?.baby_focus && (
            <View
              className="mt-3 flex-row items-start gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{ backgroundColor: "rgba(212,176,106,0.07)" }}
            >
              <Sparkles size={12} color={GOLD} />
              <Text className="text-sm text-secondary leading-relaxed font-serif italic flex-1">
                {protocol.baby_focus}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Baby size card */}
      {isPregnant && babySize && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-[22px] p-5 border border-border">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-primary">Baby at Week {week}</Text>
              <Text
                className="text-2xs font-semibold text-gold px-2.5 py-1 rounded-pill"
                style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
              >
                Week {week}
              </Text>
            </View>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic mb-3">
              {protocol?.baby_focus || `About the size of a ${babySize.size.toLowerCase()}, weighing ${babySize.weight}.`}
            </Text>
            <View className="flex-row gap-2">
              {[
                ["🍐", babySize.size, "Size"],
                ["⚖️", babySize.weight, "Weight"],
                ["🧠", week >= 20 ? "Developing" : "Forming", "Focus"],
              ].map(([emoji, value, label], i) => (
                <View key={i} className="flex-1 bg-section rounded-xl p-2.5 items-center">
                  <Text className="text-base mb-0.5">{emoji}</Text>
                  <Text className="text-xs font-semibold text-primary">{value}</Text>
                  <Text className="text-2xs text-muted mt-0.5">{label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Feature cards */}
      <View className="px-6 mt-5 gap-4">
        {/* Primary journey card */}
        <View
          className="bg-card rounded-[22px] overflow-hidden border"
          style={{ borderColor: "rgba(212,176,106,0.35)" }}
        >
          <View className="p-5">
            <View className="flex-row items-start justify-between mb-3.5">
              <View
                className="rounded-2xl items-center justify-center"
                style={{ width: 52, height: 52, backgroundColor: "rgba(212,176,106,0.12)" }}
              >
                <RoadmapIcon color={GOLD} />
              </View>
              <Text
                className="text-2xs font-semibold text-gold px-2.5 py-1 rounded-pill"
                style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
              >
                {jt === "trying_to_conceive" ? "Active" : isPregnant ? `Week ${week}` : `Week ${week} postpartum`}
              </Text>
            </View>
            <Text className="text-lg font-semibold text-primary tracking-tight mb-1.5">
              {jt === "trying_to_conceive" ? "Way to Baby" : isPregnant ? "Pregnancy Roadmap" : "Recovery Roadmap"}
            </Text>
            <Text className="text-sm text-secondary leading-relaxed mb-4">
              {loadingJourney
                ? generating
                  ? "Generating your personalized roadmap…"
                  : "Loading your roadmap…"
                : phases.length > 0
                  ? `${phases.filter((p) => p.status === "completed").length} of ${phases.length} phases complete`
                  : jt === "trying_to_conceive"
                    ? "Step-by-step fertility roadmap with personalized milestones and weekly goals."
                    : isPregnant
                      ? "Week-by-week pregnancy guide personalized to your profile."
                      : "Phase-by-phase recovery plan personalized to your birth and lifestyle."}
            </Text>
            <View className="h-1 bg-border rounded-full overflow-hidden mb-1">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress * 100}%`, backgroundColor: GOLD }}
              />
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/journey/protocol")}
            className="w-full py-3.5 flex-row items-center justify-between px-5"
            style={{ backgroundColor: GOLD }}
          >
            <Text className="text-sm font-semibold text-white">
              {loadingJourney
                ? generating
                  ? "Generating…"
                  : "Loading…"
                : jt === "trying_to_conceive"
                  ? "View Roadmap"
                  : isPregnant
                    ? "View Protocol"
                    : "View Recovery Plan"}
            </Text>
            <ArrowRight size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Baby / recovery card */}
        <View className="bg-card rounded-[22px] overflow-hidden border border-border">
          <View className="p-5">
            <View className="flex-row items-start justify-between mb-3.5">
              <View
                className="rounded-2xl items-center justify-center"
                style={{ width: 52, height: 52, backgroundColor: "rgba(168,185,165,0.15)" }}
              >
                <GrowthIcon color={SUCCESS} />
              </View>
              {!jt.includes("conceive") && phaseLabel && (
                <Text
                  className="text-2xs font-semibold px-2.5 py-1 rounded-pill"
                  style={{ backgroundColor: `${phaseLabel.color}15`, color: phaseLabel.color }}
                >
                  {phaseLabel.phase}
                </Text>
              )}
            </View>
            <Text className="text-lg font-semibold text-primary tracking-tight mb-1.5">
              {isPregnant ? "Baby Development" : isPostpartum ? "Your Recovery" : "Baby Development"}
            </Text>
            <Text className="text-sm text-secondary leading-relaxed">
              {protocol?.baby_focus ||
                (isPregnant
                  ? `At week ${week}, your baby is growing and developing rapidly.`
                  : isPostpartum
                    ? `Week ${week} postpartum — focus on gentle recovery and restoration.`
                    : "Your lifestyle choices now directly impact future embryo quality.")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push(isPregnant ? "/journey/pregnancy" : "/journey/protocol")}
            className="flex-row items-center gap-1.5 px-5 pb-5"
          >
            <Text className="text-sm font-semibold text-gold">
              {isPostpartum ? "Recovery protocols" : isPregnant ? "Week detail" : "Learn more"}
            </Text>
            <ArrowRight size={14} color={GOLD} />
          </Pressable>
        </View>

        {/* After birth card */}
        <View
          className="bg-card rounded-[22px] overflow-hidden border border-border"
          style={{ opacity: !isPostpartum ? 0.65 : 1 }}
        >
          <View className="p-5">
            <View className="flex-row items-start justify-between mb-3.5">
              <View
                className="rounded-2xl items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: isPostpartum ? "rgba(212,176,106,0.12)" : "rgba(180,155,120,0.1)",
                }}
              >
                <AfterBirthIcon color={isPostpartum ? GOLD : "#B4A090"} />
              </View>
              {!isPostpartum && (
                <Text className="text-2xs text-muted px-2.5 py-1 rounded-pill bg-section">After birth</Text>
              )}
            </View>
            <Text className="text-lg font-semibold text-primary tracking-tight mb-1.5">After Birth</Text>
            <Text className="text-sm text-secondary leading-relaxed">
              {isPostpartum
                ? "Postpartum recovery, hormonal restoration, breastfeeding guidance and newborn care."
                : "Postpartum recovery protocols unlock after birth."}
            </Text>
            {isPostpartum && (
              <Pressable
                onPress={() => router.push("/journey/recovery")}
                className="flex-row items-center gap-1.5 mt-4"
              >
                <Text className="text-sm font-semibold text-gold">Explore postpartum</Text>
                <ArrowRight size={14} color={GOLD} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
