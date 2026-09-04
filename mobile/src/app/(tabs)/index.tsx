import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Sun,
  Droplets,
  Pill,
  Activity,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  Loader,
  Brain,
  Utensils,
  User,
  Check,
  Leaf,
  MapPin,
  Sparkles,
} from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { triggerRecalibrate } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import { setupDailyReminders } from "@/lib/notifications";
import FertilityScoreRing from "@/components/dashboard/FertilityScoreRing";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const BLUE = "#4A90C4";

const STAGES = [
  { label: "Prepare", emotional: "Foundation" },
  { label: "Conceive", emotional: "The Spark" },
  { label: "Grow", emotional: "Becoming" },
  { label: "Birth", emotional: "Arrival" },
  { label: "Bloom", emotional: "Flourishing" },
];
const STAGE_IDX: Record<string, number> = {
  trying_to_conceive: 1,
  currently_pregnant: 2,
  postpartum: 4,
};

function getPregnancyTrimester(week: number) {
  if (week <= 12) return { name: "First Trimester", next: "Second trimester begins at week 13" };
  if (week <= 26) return { name: "Second Trimester", next: "Third trimester begins at week 27" };
  return {
    name: "Third Trimester",
    next: week >= 38 ? "Birth window approaching" : `${40 - week} weeks remaining`,
  };
}

function getPostpartumPhase(week: number) {
  if (week <= 2) return { name: "Immediate Recovery", next: "Hormone stabilisation begins at week 3" };
  if (week <= 6) return { name: "Acute Recovery", next: "6-week postnatal check approaching" };
  if (week <= 12) return { name: "Active Recovery", next: "Core reconnection phase at week 13" };
  return { name: "Rebuilding Phase", next: "Full integration and restoration" };
}

function getPregnancyNutrient(week: number) {
  if (week <= 4) return { name: "Folate", benefit: "Prevents neural tube defects — critical in the first 4 weeks.", foods: ["Spinach", "Avocado", "Lentils"] };
  if (week <= 8) return { name: "Choline", benefit: "Drives neural tube closure and early brain cell formation.", foods: ["Eggs", "Duck eggs", "Broccoli"] };
  if (week <= 12) return { name: "Folate & Iron", benefit: "DNA replication is at its peak — folate and iron are essential.", foods: ["Spinach", "Lentils", "Kiwi"] };
  if (week <= 16) return { name: "Calcium", benefit: "The skeleton is hardening — calcium drives bone mineralisation.", foods: ["Greek yogurt", "Sesame seeds", "Almonds"] };
  if (week <= 20) return { name: "DHA", benefit: "Brain synaptic connections are forming rapidly — DHA fuels wiring.", foods: ["Salmon", "Walnuts", "Chia seeds"] };
  if (week <= 24) return { name: "DHA & Iron", benefit: "Lung development and peak brain architecture — oxygen and fats.", foods: ["Salmon", "Beetroot", "Pumpkin seeds"] };
  if (week <= 28) return { name: "Vitamin A", benefit: "Baby's eyes are opening — vitamin A supports vision development.", foods: ["Sweet potatoes", "Mango", "Carrots"] };
  if (week <= 32) return { name: "Calcium & Vitamin D", benefit: "Bones are hardening rapidly — calcium and D are critical.", foods: ["Greek yogurt", "Salmon", "Mushrooms"] };
  if (week <= 36) return { name: "Magnesium", benefit: "Supports lung maturation and reduces cramps as birth nears.", foods: ["Pumpkin seeds", "Cashews", "Almonds"] };
  return { name: "Iron & Magnesium", benefit: "Dates support cervical ripening. Iron prepares for birth blood loss.", foods: ["Dates", "Spinach", "Salmon"] };
}

function getPostpartumNutrient(week: number) {
  if (week <= 2) return { name: "Iron", benefit: "Rebuilds blood lost during birth — critical in week 1–2.", foods: ["Red meat", "Lentils", "Spinach"] };
  if (week <= 6) return { name: "Iron & Protein", benefit: "Blood restoration and tissue repair — your body is rebuilding.", foods: ["Eggs", "Lentils", "Salmon"] };
  if (week <= 12) return { name: "DHA", benefit: "Enriches breast milk fats for baby brain development.", foods: ["Salmon", "Walnuts", "Chia seeds"] };
  return { name: "Protein", benefit: "Rebuilds muscle and supports sustained milk production.", foods: ["Eggs", "Greek yogurt", "Turkey"] };
}

const SKIN_DATA: Record<
  number,
  { name: string; multiplier: number; vitaminDRisk: string; babyRisk: string }
> = {
  1: { name: "Very Fair", multiplier: 1, vitaminDRisk: "low-medium", babyRisk: "low" },
  2: { name: "Fair", multiplier: 1.5, vitaminDRisk: "medium", babyRisk: "moderate" },
  3: { name: "Medium", multiplier: 2, vitaminDRisk: "medium-high", babyRisk: "moderate" },
  4: { name: "Olive", multiplier: 3, vitaminDRisk: "high", babyRisk: "high" },
  5: { name: "Brown", multiplier: 5, vitaminDRisk: "very high", babyRisk: "high" },
  6: { name: "Dark Brown", multiplier: 7, vitaminDRisk: "critical", babyRisk: "very high" },
  7: { name: "Very Dark", multiplier: 8, vitaminDRisk: "critical", babyRisk: "very high" },
};

function getSunGuidance(skinTypeStr: string | undefined, city: string) {
  const skinType = parseInt(skinTypeStr ?? "3");
  const skin = SKIN_DATA[skinType] ?? SKIN_DATA[3];
  const month = new Date().getMonth();
  const isWinter = month <= 2 || month >= 10;
  const isSummer = month >= 4 && month <= 8;
  const uvIndex = isSummer ? 6 : isWinter ? 1 : 3;
  const season = isWinter ? "winter" : isSummer ? "summer" : "spring/autumn";

  const baseMinutes = 10;
  const seasonFactor = isWinter ? 3 : 1;
  const uvFactor = 10 / uvIndex;
  const minutes = Math.round(baseMinutes * skin.multiplier * seasonFactor * uvFactor);

  const window = isSummer ? "11:00 – 13:00" : isWinter ? "12:00 – 13:30" : "11:30 – 13:00";

  const urgency =
    skin.vitaminDRisk === "critical" || skin.vitaminDRisk === "very high"
      ? "Your skin type requires significantly more UV exposure to synthesise sufficient vitamin D."
      : skin.vitaminDRisk === "high"
        ? "Your skin type needs more daily sun exposure than average to maintain optimal vitamin D levels."
        : "Your skin type synthesises vitamin D efficiently — moderate daily exposure is sufficient.";

  const body = `${minutes} minutes of midday sun is recommended for ${skin.name} skin in ${city} during ${season}. ${urgency}`;

  const uvLabel = uvIndex <= 2 ? "Low" : uvIndex <= 5 ? "Moderate" : uvIndex <= 7 ? "High" : "Very High";

  return {
    skinName: skin.name,
    minutes,
    window,
    uvIndex: uvLabel,
    body,
    vitaminDRisk: skin.vitaminDRisk,
    babyRisk: skin.babyRisk,
    isHighRisk: ["high", "very high", "critical"].includes(skin.vitaminDRisk),
  };
}

export default function DashboardScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibrated, setRecalibrated] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Covers users who onboarded before daily reminders existed — a no-op
  // for everyone else, since requestPermissionsAsync() doesn't re-prompt
  // once already granted/denied and scheduling is idempotent.
  useEffect(() => {
    setupDailyReminders().catch(() => {});
  }, []);

  if (!profile || loading) return <LoadingScreen message="Calibrating your protocol..." />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const week = profile.current_week ?? 0;
  const isPreg = jt === "currently_pregnant";
  const isPost = jt === "postpartum";
  const trimester = isPreg ? getPregnancyTrimester(week) : null;
  const ppPhase = isPost ? getPostpartumPhase(week) : null;
  const nutrient = isPreg
    ? getPregnancyNutrient(week)
    : isPost
      ? getPostpartumNutrient(week)
      : {
          name: "Folate",
          benefit: "Supports healthy egg development and prepares your body for conception.",
          foods: ["Leafy greens", "Lentils", "Asparagus"],
        };

  const d = {
    scoreLabel: isPreg ? "Pregnancy Optimization" : isPost ? "Recovery Readiness" : "Fertility Readiness",
    week: isPreg
      ? week > 0
        ? `Week ${week} — ${trimester?.name ?? ""}`
        : "Pregnancy"
      : isPost
        ? week > 0
          ? `Week ${week} Postpartum — ${ppPhase?.name ?? ""}`
          : "Postpartum Recovery"
        : "Fertility Window",
    emotionalLine:
      protocol?.fertility_tip ||
      (isPreg
        ? `You are in week ${week} — your body is doing something extraordinary.`
        : isPost
          ? "You've brought new life into the world — now it's your turn to be nourished."
          : "This is where everything begins — your body is already preparing for something profound."),
    stageNow: isPreg
      ? trimester
        ? `${trimester.name} · Week ${week}`
        : "Your pregnancy"
      : isPost
        ? ppPhase
          ? `${ppPhase.name} · Week ${week} postpartum`
          : "Postpartum recovery"
        : "Fertility preparation · Tracking active",
    stageNext: isPreg
      ? (trimester?.next ?? "Continuing your pregnancy journey")
      : isPost
        ? (ppPhase?.next ?? "Progressive recovery")
        : "Fertile window — ovulation tracking active",
    babyMilestone: protocol?.baby_focus ?? null,
    nutrientName: nutrient.name,
    nutrientBenefit: protocol?.nutrition_plan ?? nutrient.benefit,
    nutrientFoods: nutrient.foods,
    hydration: isPost ? "~2.5–3.0L" : isPreg ? "~2.3L" : "~2.0L",
    hydrationTip: isPost
      ? "Higher hydration supports breastfeeding — blood volume determines milk quality."
      : isPreg
        ? "Small, frequent intake improves absorption and reduces nausea."
        : "Optimal hydration supports cervical mucus quality and hormonal balance.",
    movementFocus:
      protocol?.movement ||
      (isPreg
        ? week <= 12
          ? "Gentle yoga & breathwork"
          : week <= 26
            ? "Prenatal yoga & walking"
            : "Pelvic floor & gentle walking"
        : isPost
          ? week <= 2
            ? "Rest only"
            : week <= 6
              ? "Diaphragmatic breathing"
              : week <= 12
                ? "Pelvic floor + gentle walking"
                : "Progressive movement"
          : "Gentle yoga & pelvic mobility"),
    movementBenefit: isPost
      ? week <= 6
        ? "Gentle breathwork activates the deep core safely and supports pelvic floor recovery."
        : "Progressive movement supports circulation, hormone regulation, and milk production."
      : isPreg
        ? "20–30 minutes of appropriate movement improves circulation and reduces discomfort."
        : "20–30 minutes opens the hips and supports uterine circulation.",
    sunBody: isPost
      ? "Morning light resets your circadian rhythm, supports postpartum mood, and regulates the baby's sleep-wake cycle through your milk."
      : isPreg
        ? `Midday sun supports vitamin D synthesis at week ${week} — essential for baby bone development.`
        : "15–20 minutes of midday sun supports vitamin D, which plays a direct role in ovarian function.",
    dailyFocus: protocol?.fertility_tip?.trim()
      ? protocol.fertility_tip.split(".")[0]
      : isPost
        ? "Iron-rich meals + pelvic breathing"
        : isPreg
          ? `${nutrient.name} focus + gentle movement`
          : "Leafy greens + gentle hip yoga",
  };

  const idx = STAGE_IDX[jt] ?? 1;
  const now = new Date();
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  async function handleRecalibrate() {
    setRecalibrating(true);
    setRecalibrated(false);
    try {
      const uid = getUserId();
      if (uid) await triggerRecalibrate(uid);
    } catch {}
    setTimeout(() => {
      setRecalibrating(false);
      setRecalibrated(true);
    }, 2200);
  }

  const sections = [
    {
      key: "Nutrition Focus",
      icon: <Utensils size={14} color={GOLD} />,
      items: protocol?.nutrition_plan
        ? protocol.nutrition_plan.split(".").filter(Boolean).map((s) => s.trim() + ".")
        : ["Focus on folate-rich foods and healthy fats today"],
    },
    {
      key: "Supplements",
      icon: <Pill size={14} color={GOLD} />,
      items: protocol?.supplements
        ? protocol.supplements.split(",").map((s) => s.trim())
        : ["Prenatal Vitamin", "Omega-3", "Vitamin D"],
    },
    {
      key: "Movement",
      icon: <Activity size={14} color={GOLD} />,
      items: protocol?.movement ? [protocol.movement] : ["30 minutes gentle movement"],
    },
    {
      key: "Avoid Today",
      icon: <AlertCircle size={14} color={GOLD} />,
      items: protocol?.avoid_today ? [protocol.avoid_today] : ["Avoid excessive caffeine and processed foods"],
    },
  ];

  function connColor(i: number) {
    if (i < idx) return SUCCESS;
    if (i === idx) return GOLD;
    return "rgba(180,155,120,0.2)";
  }

  const sun = getSunGuidance(profile.skin_type, profile.city || "your location");

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      {/* Greeting */}
      <View className="flex-row items-start justify-between px-6 pt-6">
        <View className="flex-1 pr-4">
          <Text className="text-2xs text-muted mb-1 tracking-wide">{dateStr}</Text>
          <Text className="text-3xl font-medium text-primary tracking-tight leading-tight">
            {greeting}, {profile.first_name || "there"}
          </Text>
          <Text className="font-serif italic text-md text-secondary leading-relaxed mt-2.5">
            {protocol?.fertility_tip || d.emotionalLine}
          </Text>
          <View
            className="flex-row items-center self-start gap-1.5 mt-3 px-3 py-1 rounded-pill"
            style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
          >
            <View className="w-1.5 h-1.5 rounded-full bg-gold" />
            <Text className="text-2xs text-gold font-medium tracking-wide">{d.week}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-card border border-border items-center justify-center mt-1"
        >
          <User size={18} color="#7B7268" />
        </Pressable>
      </View>

      {/* Journey progress */}
      <View className="px-6 mt-5">
        <View className="bg-card rounded-3xl p-5 border border-border">
          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-4">
            Your Journey
          </Text>
          <View className="flex-row items-center">
            {STAGES.map((_, i) => {
              const past = i < idx;
              const cur = i === idx;
              const dotSize = cur ? 16 : 10;
              return (
                <View key={i} className="flex-row items-center flex-1">
                  <View
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: dotSize / 2,
                      backgroundColor: past ? SUCCESS : cur ? GOLD : "transparent",
                      borderWidth: 2,
                      borderColor: past ? SUCCESS : cur ? GOLD : "rgba(180,155,120,0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {past && <Check size={6} color="#fff" strokeWidth={3} />}
                  </View>
                  {i < STAGES.length - 1 && (
                    <View style={{ flex: 1, height: 1, backgroundColor: connColor(i) }} />
                  )}
                </View>
              );
            })}
          </View>
          <View className="flex-row mt-2.5">
            {STAGES.map((stage, i) => {
              const past = i < idx;
              const cur = i === idx;
              return (
                <View key={i} className="flex-1 items-center">
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: cur ? "600" : "400",
                      color: cur ? GOLD : past ? SUCCESS : "#9A9094",
                    }}
                  >
                    {stage.label}
                  </Text>
                  <Text style={{ fontSize: 8, color: "#9A9094", fontStyle: "italic", marginTop: 2 }}>
                    {stage.emotional}
                  </Text>
                </View>
              );
            })}
          </View>
          <View className="mt-4 pt-4 border-t border-border flex-row">
            <View className="flex-1 pr-3">
              <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Now
              </Text>
              <Text className="text-sm text-primary font-medium leading-snug">{d.stageNow}</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 pl-3">
              <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                What's next
              </Text>
              <Text className="text-sm text-secondary leading-snug">{d.stageNext}</Text>
            </View>
          </View>
          {(d.babyMilestone || protocol?.baby_focus) && (
            <View
              className="mt-3 flex-row items-center gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{ backgroundColor: "rgba(212,176,106,0.08)" }}
            >
              <Sparkles size={14} color={GOLD} />
              <Text className="font-serif italic text-sm text-secondary leading-snug flex-1">
                {protocol?.baby_focus || d.babyMilestone}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Score */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border items-center py-1">
          <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-5">
            {d.scoreLabel}
          </Text>
          <FertilityScoreRing score={profile.fertility_score || 0} />
          <Text className="font-serif italic text-base text-gold mt-4 text-center leading-relaxed">
            {protocol?.female_risk_summary || "Your body is building something extraordinary."}
          </Text>
        </View>
      </View>

      {/* AI Protocol accordion */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border">
          <View className="flex-row items-center justify-between mb-5">
            <View>
              <Text className="text-lg font-semibold text-primary tracking-tight">
                Your Protocol for Today
              </Text>
              <Text className="text-2xs text-muted mt-0.5">AI-generated · Personalized for you</Text>
            </View>
            <View
              className="w-9 h-9 rounded-xl items-center justify-center"
              style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
            >
              <Brain size={18} color={GOLD} />
            </View>
          </View>
          {sections.map((sec, i) => (
            <View
              key={sec.key}
              className={i < sections.length - 1 ? "mb-4 pb-4 border-b border-border" : ""}
            >
              <Pressable
                onPress={() => setExpanded(expanded === sec.key ? null : sec.key)}
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5">
                  <View className="w-7 h-7 rounded-lg bg-section items-center justify-center">
                    {sec.icon}
                  </View>
                  <Text className="text-base font-medium text-primary tracking-tight">{sec.key}</Text>
                </View>
                <ChevronRight
                  size={16}
                  color="#9A9094"
                  style={{ transform: [{ rotate: expanded === sec.key ? "90deg" : "0deg" }] }}
                />
              </Pressable>
              {expanded === sec.key && (
                <View className="pt-3 pl-9">
                  {sec.items.map((item, j) => (
                    <View key={j} className="flex-row items-start gap-2 mb-2">
                      <View className="w-1 h-1 rounded-full bg-gold mt-1.5" />
                      <Text className="text-sm text-secondary leading-snug flex-1">{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
          <Pressable
            onPress={handleRecalibrate}
            disabled={recalibrating}
            className="mt-4 rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
            style={{
              backgroundColor: recalibrated ? "rgba(31,122,90,0.08)" : "rgba(212,176,106,0.1)",
              borderWidth: 1.5,
              borderColor: recalibrated ? SUCCESS : GOLD,
            }}
          >
            {recalibrating ? (
              <>
                <Loader size={16} color={GOLD} />
                <Text className="text-base font-medium text-secondary">Analyzing your current state…</Text>
              </>
            ) : recalibrated ? (
              <Text className="text-base font-medium" style={{ color: SUCCESS }}>
                Protocol updated
              </Text>
            ) : (
              <>
                <RotateCcw size={16} color={GOLD} />
                <Text className="text-base font-medium text-gold">Recalibrate Protocol</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      {/* Sunlight */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border flex-row gap-3.5 items-start">
          <View
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "rgba(212,176,106,0.12)", borderWidth: 1, borderColor: "rgba(212,176,106,0.2)" }}
          >
            <Sun size={22} color={GOLD} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 mb-1.5 flex-wrap">
              <MapPin size={11} color="#9A9094" />
              <Text className="text-2xs text-muted">{profile.city || "Your location"}</Text>
              <Text className="text-2xs text-muted">·</Text>
              <Text className="text-2xs text-muted">UV: {sun.uvIndex}</Text>
              <Text className="text-2xs text-muted">·</Text>
              <Text className="text-2xs text-muted">{sun.skinName} skin</Text>
            </View>
            <Text className="text-md font-semibold text-primary mb-1">Sunlight Guidance</Text>
            <View className="flex-row items-baseline gap-1 mb-2.5 flex-wrap">
              <Text className="text-2xs text-muted">Best window today:</Text>
              <Text className="text-base font-semibold text-primary tracking-tight">{sun.window}</Text>
              <Text className="text-2xs text-muted ml-1">· {sun.minutes} min</Text>
            </View>
            <Text
              className="text-sm text-secondary leading-relaxed font-serif italic pl-2.5"
              style={{ borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.3)" }}
            >
              {sun.body}
            </Text>
            {sun.isHighRisk && (
              <View
                className="mt-3 flex-row items-start gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: "rgba(194,107,46,0.07)", borderWidth: 1, borderColor: "rgba(194,107,46,0.2)" }}
              >
                <Text className="text-warning text-xs">⚠</Text>
                <View className="flex-1">
                  <Text className="text-2xs text-warning font-semibold uppercase tracking-widest mb-0.5">
                    Vitamin D risk: {sun.vitaminDRisk}
                  </Text>
                  <Text className="text-2xs text-warning leading-relaxed">
                    Baby development: {sun.babyRisk}. Consider supplementing with D3 year-round.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Nutrition focus */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border flex-row gap-3.5 items-start">
          <View
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "rgba(31,122,90,0.08)", borderWidth: 1, borderColor: "rgba(31,122,90,0.15)" }}
          >
            <Leaf size={20} color={SUCCESS} />
          </View>
          <View className="flex-1">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
              Today's Nutrient Focus
            </Text>
            <Text className="text-2xl font-semibold text-primary tracking-tight mb-1.5">
              {d.nutrientName}
            </Text>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic mb-3.5">
              {protocol?.nutrition_plan || d.nutrientBenefit}
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              {d.nutrientFoods.map((food, i) => (
                <View key={i} className="flex-row items-center gap-1.5 px-3 py-1.5 bg-section rounded-pill">
                  <View className="w-1 h-1 rounded-full" style={{ backgroundColor: SUCCESS }} />
                  <Text className="text-sm text-primary font-medium">{food}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => router.push("/nutrition")}
              className="flex-row items-center gap-1 self-end mt-3.5"
            >
              <Text className="text-2xs text-muted font-medium">View full nutrition plan</Text>
              <ChevronRight size={13} color="#9A9094" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Hydration */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border flex-row gap-3.5 items-center">
          <View
            className="w-11 h-11 rounded-2xl items-center justify-center"
            style={{ backgroundColor: "rgba(74,144,196,0.08)", borderWidth: 1, borderColor: "rgba(74,144,196,0.15)" }}
          >
            <Droplets size={20} color={BLUE} />
          </View>
          <View className="flex-1">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
              Hydration Target
            </Text>
            <Text className="text-3xl font-semibold text-primary tracking-tight mb-1">{d.hydration}</Text>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic">{d.hydrationTip}</Text>
          </View>
        </View>
      </View>

      {/* Movement */}
      <View className="px-6 mt-4">
        <View className="bg-card rounded-3xl p-5 border border-border flex-row gap-3.5 items-start">
          <View className="w-11 h-11">
            <Svg width={44} height={44} style={{ position: "absolute" }}>
              <Circle cx={22} cy={22} r={19} fill="none" stroke="rgba(31,122,90,0.12)" strokeWidth={2} />
              <Circle
                cx={22}
                cy={22}
                r={19}
                fill="none"
                stroke={SUCCESS}
                strokeWidth={2}
                strokeDasharray="60 60"
                strokeDashoffset={10}
                strokeLinecap="round"
                rotation={-90}
                origin="22, 22"
              />
            </Svg>
            <View
              className="absolute rounded-full items-center justify-center"
              style={{ top: 6, left: 6, right: 6, bottom: 6, backgroundColor: "rgba(31,122,90,0.08)" }}
            >
              <Activity size={16} color={SUCCESS} />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
              Focus Today
            </Text>
            <Text className="text-xl font-semibold text-primary tracking-tight mb-1.5">
              {protocol?.movement
                ? protocol.movement.split(" ").slice(0, 6).join(" ") +
                  (protocol.movement.split(" ").length > 6 ? "…" : "")
                : d.movementFocus}
            </Text>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic">
              {protocol?.movement || d.movementBenefit}
            </Text>
          </View>
        </View>
      </View>

      {/* Baby card (pregnant only) */}
      {jt === "currently_pregnant" && (
        <View className="px-6 mt-4">
          <View className="bg-card rounded-3xl p-5 border border-border flex-row gap-3.5 items-start">
            <View
              className="w-11 h-11 rounded-2xl items-center justify-center"
              style={{ backgroundColor: "rgba(212,176,106,0.08)", borderWidth: 1, borderColor: "rgba(212,176,106,0.18)" }}
            >
              <Brain size={22} color={GOLD} />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-md font-semibold text-primary">Baby This Week</Text>
                <Text
                  className="text-2xs font-semibold text-gold px-2 py-1 rounded-pill"
                  style={{ backgroundColor: "rgba(212,176,106,0.12)" }}
                >
                  Week {week || 15}
                </Text>
              </View>
              <Text className="text-sm text-secondary leading-relaxed font-serif italic mb-3.5">
                {protocol?.baby_focus ||
                  "The brain is growing rapidly. Synaptic connections forming at an extraordinary rate. Your DHA intake is directly fueling this development."}
              </Text>
              <View className="flex-row gap-2">
                {[
                  ["~125g", "Estimated weight"],
                  ["16cm", "Crown to heel"],
                  ["Brain", "Focus system"],
                ].map(([v, l], i) => (
                  <View key={i} className="flex-1 bg-section rounded-xl p-2.5 items-center">
                    <Text className="text-md font-semibold text-primary">{v}</Text>
                    <Text className="text-2xs text-muted mt-0.5 text-center leading-tight">{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Daily focus summary */}
      <View className="px-6 mt-4">
        <View
          className="rounded-3xl p-4 flex-row items-center gap-3.5"
          style={{ backgroundColor: "rgba(212,176,106,0.08)", borderWidth: 1, borderColor: "rgba(212,176,106,0.22)" }}
        >
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: "rgba(212,176,106,0.15)" }}
          >
            <Sparkles size={17} color={GOLD} />
          </View>
          <View className="flex-1">
            <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
              Your focus today
            </Text>
            <Text className="text-md font-medium text-primary font-serif italic leading-snug">
              {protocol?.fertility_tip ? protocol.fertility_tip.split(".")[0] + "." : d.dailyFocus}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
