"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { triggerRecalibrate } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import FertilityScoreRing from "@/components/dashboard/FertilityScoreRing";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
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
} from "lucide-react";

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

const JT_CONTENT: Record<
  string,
  {
    scoreLabel: string;
    week: string;
    emotionalLine: string;
    stageNow: string;
    stageNext: string;
    babyMilestone: string | null;
    nutrientName: string;
    nutrientBenefit: string;
    nutrientFoods: string[];
    hydration: string;
    hydrationTip: string;
    movementFocus: string;
    movementBenefit: string;
    sunUV: string;
    sunWindow: string;
    sunBody: string;
    dailyFocus: string;
  }
> = {
  trying_to_conceive: {
    scoreLabel: "Fertility Readiness",
    week: "Fertility Window: Days 11–15",
    emotionalLine:
      "This is where everything begins — your body is already preparing for something profound.",
    stageNow: "Fertility preparation · Cycle days 11–15",
    stageNext: "Fertile window opens — ovulation tracking active",
    babyMilestone: null,
    nutrientName: "Folate",
    nutrientBenefit:
      "Supports healthy egg development and prepares your body for conception.",
    nutrientFoods: ["Leafy greens", "Lentils", "Asparagus"],
    hydration: "~2.0L",
    hydrationTip:
      "Optimal hydration supports cervical mucus quality and hormonal balance.",
    movementFocus: "Gentle yoga & pelvic mobility",
    movementBenefit:
      "20–30 minutes opens the hips and supports uterine circulation — ideal during your fertile window.",
    sunUV: "Moderate",
    sunWindow: "11:30 – 12:30",
    sunBody:
      "15–20 minutes of midday sun supports vitamin D, which plays a direct role in ovarian function.",
    dailyFocus: "Leafy greens + gentle hip yoga",
  },
  currently_pregnant: {
    scoreLabel: "Pregnancy Optimization",
    week: "Week 15 — Second Trimester",
    emotionalLine:
      "You're in week 15 — your body is doing something extraordinary.",
    stageNow: "Second trimester · Week 15",
    stageNext: "Third trimester begins at week 28",
    babyMilestone: "Fingerprints are forming · Beginning to hear your voice",
    nutrientName: "Choline",
    nutrientBenefit: "Supports baby's brain and spinal cord development.",
    nutrientFoods: ["Eggs", "Lentils", "Salmon"],
    hydration: "~2.3L",
    hydrationTip:
      "Small, frequent intake improves absorption and reduces nausea.",
    movementFocus: "Gentle hip mobility",
    movementBenefit:
      "15–20 minutes improves circulation and reduces lower back strain.",
    sunUV: "Low",
    sunWindow: "12:10 – 13:00",
    sunBody:
      "15–20 minutes midday exposure supports vitamin D synthesis during week 15.",
    dailyFocus: "Iron-rich meals + light stretching",
  },
  postpartum: {
    scoreLabel: "Recovery Readiness",
    week: "Recovery · Week 8 Protocol",
    emotionalLine:
      "You've brought new life into the world — now it's your turn to be nourished.",
    stageNow: "Postpartum recovery · Week 8",
    stageNext: "Full movement clearance at 12 weeks",
    babyMilestone: null,
    nutrientName: "Iron",
    nutrientBenefit:
      "Restores blood levels after birth and supports your energy recovery.",
    nutrientFoods: ["Red meat", "Lentils", "Spinach"],
    hydration: "~2.5L",
    hydrationTip: "Higher hydration supports breastfeeding and tissue repair.",
    movementFocus: "Pelvic floor breathing",
    movementBenefit:
      "10 minutes of gentle breathwork activates your deep core and supports healing.",
    sunUV: "Low",
    sunWindow: "12:00 – 13:00",
    sunBody:
      "Morning light supports postpartum mood regulation and helps reset your sleep-wake rhythm.",
    dailyFocus: "Protein-rich meals + pelvic breathing",
  },
};

function getPregnancyTrimester(week: number) {
  if (week <= 12)
    return {
      name: "First Trimester",
      next: "Second trimester begins at week 13",
    };
  if (week <= 26)
    return {
      name: "Second Trimester",
      next: "Third trimester begins at week 27",
    };
  return {
    name: "Third Trimester",
    next:
      week >= 38 ? "Birth window approaching" : `${40 - week} weeks remaining`,
  };
}

function getPostpartumPhase(week: number) {
  if (week <= 2)
    return {
      name: "Immediate Recovery",
      next: "Hormone stabilisation begins at week 3",
    };
  if (week <= 6)
    return {
      name: "Acute Recovery",
      next: "6-week postnatal check approaching",
    };
  if (week <= 12)
    return {
      name: "Active Recovery",
      next: "Core reconnection phase at week 13",
    };
  return { name: "Rebuilding Phase", next: "Full integration and restoration" };
}

function getPregnancyNutrient(week: number) {
  if (week <= 4)
    return {
      name: "Folate",
      benefit: "Prevents neural tube defects — critical in the first 4 weeks.",
      foods: ["Spinach", "Avocado", "Lentils"],
    };
  if (week <= 8)
    return {
      name: "Choline",
      benefit: "Drives neural tube closure and early brain cell formation.",
      foods: ["Eggs", "Duck eggs", "Broccoli"],
    };
  if (week <= 12)
    return {
      name: "Folate & Iron",
      benefit:
        "DNA replication is at its peak — folate and iron are essential.",
      foods: ["Spinach", "Lentils", "Kiwi"],
    };
  if (week <= 16)
    return {
      name: "Calcium",
      benefit:
        "The skeleton is hardening — calcium drives bone mineralisation.",
      foods: ["Greek yogurt", "Sesame seeds", "Almonds"],
    };
  if (week <= 20)
    return {
      name: "DHA",
      benefit:
        "Brain synaptic connections are forming rapidly — DHA fuels wiring.",
      foods: ["Salmon", "Walnuts", "Chia seeds"],
    };
  if (week <= 24)
    return {
      name: "DHA & Iron",
      benefit:
        "Lung development and peak brain architecture — oxygen and fats.",
      foods: ["Salmon", "Beetroot", "Pumpkin seeds"],
    };
  if (week <= 28)
    return {
      name: "Vitamin A",
      benefit:
        "Baby's eyes are opening — vitamin A supports vision development.",
      foods: ["Sweet potatoes", "Mango", "Carrots"],
    };
  if (week <= 32)
    return {
      name: "Calcium & Vitamin D",
      benefit: "Bones are hardening rapidly — calcium and D are critical.",
      foods: ["Greek yogurt", "Salmon", "Mushrooms"],
    };
  if (week <= 36)
    return {
      name: "Magnesium",
      benefit: "Supports lung maturation and reduces cramps as birth nears.",
      foods: ["Pumpkin seeds", "Cashews", "Almonds"],
    };
  return {
    name: "Iron & Magnesium",
    benefit:
      "Dates support cervical ripening. Iron prepares for birth blood loss.",
    foods: ["Dates", "Spinach", "Salmon"],
  };
}
function getPostpartumNutrient(week: number) {
  if (week <= 2)
    return {
      name: "Iron",
      benefit: "Rebuilds blood lost during birth — critical in week 1–2.",
      foods: ["Red meat", "Lentils", "Spinach"],
    };
  if (week <= 6)
    return {
      name: "Iron & Protein",
      benefit: "Blood restoration and tissue repair — your body is rebuilding.",
      foods: ["Eggs", "Lentils", "Salmon"],
    };
  if (week <= 12)
    return {
      name: "DHA",
      benefit: "Enriches breast milk fats for baby brain development.",
      foods: ["Salmon", "Walnuts", "Chia seeds"],
    };
  return {
    name: "Protein",
    benefit: "Rebuilds muscle and supports sustained milk production.",
    foods: ["Eggs", "Greek yogurt", "Turkey"],
  };
}
// Add this above the component
const SKIN_DATA: Record<
  number,
  {
    name: string;
    multiplier: number;
    vitaminDRisk: string;
    babyRisk: string;
    minSummer: number;
    maxSummer: number;
    minWinter: number;
  }
> = {
  1: {
    name: "Very Fair",
    multiplier: 1,
    vitaminDRisk: "low-medium",
    babyRisk: "low",
    minSummer: 5,
    maxSummer: 10,
    minWinter: 60,
  },
  2: {
    name: "Fair",
    multiplier: 1.5,
    vitaminDRisk: "medium",
    babyRisk: "moderate",
    minSummer: 10,
    maxSummer: 15,
    minWinter: 90,
  },
  3: {
    name: "Medium",
    multiplier: 2,
    vitaminDRisk: "medium-high",
    babyRisk: "moderate",
    minSummer: 15,
    maxSummer: 25,
    minWinter: 90,
  },
  4: {
    name: "Olive",
    multiplier: 3,
    vitaminDRisk: "high",
    babyRisk: "high",
    minSummer: 25,
    maxSummer: 40,
    minWinter: 120,
  },
  5: {
    name: "Brown",
    multiplier: 5,
    vitaminDRisk: "very high",
    babyRisk: "high",
    minSummer: 40,
    maxSummer: 60,
    minWinter: 180,
  },
  6: {
    name: "Dark Brown",
    multiplier: 7,
    vitaminDRisk: "critical",
    babyRisk: "very high",
    minSummer: 60,
    maxSummer: 90,
    minWinter: 240,
  },
  7: {
    name: "Very Dark",
    multiplier: 8,
    vitaminDRisk: "critical",
    babyRisk: "very high",
    minSummer: 90,
    maxSummer: 120,
    minWinter: 300,
  },
};

function getSunGuidance(skinTypeStr: string | undefined, city: string) {
  const skinType = parseInt(skinTypeStr ?? "3");
  const skin = SKIN_DATA[skinType] ?? SKIN_DATA[3];
  const month = new Date().getMonth(); // 0-11
  const isWinter = month <= 2 || month >= 10; // Nov–Mar
  const isSummer = month >= 4 && month <= 8; // May–Sep
  const uvIndex = isSummer ? 6 : isWinter ? 1 : 3; // rough estimate by season
  const season = isWinter ? "winter" : isSummer ? "summer" : "spring/autumn";

  // Calculate minutes needed
  const baseMinutes = 10;
  const seasonFactor = isWinter ? 3 : 1;
  const uvFactor = 10 / uvIndex;
  const minutes = Math.round(
    baseMinutes * skin.multiplier * seasonFactor * uvFactor,
  );

  const window = isSummer
    ? "11:00 – 13:00"
    : isWinter
      ? "12:00 – 13:30"
      : "11:30 – 13:00";

  const urgency =
    skin.vitaminDRisk === "critical" || skin.vitaminDRisk === "very high"
      ? "Your skin type requires significantly more UV exposure to synthesise sufficient vitamin D."
      : skin.vitaminDRisk === "high"
        ? "Your skin type needs more daily sun exposure than average to maintain optimal vitamin D levels."
        : "Your skin type synthesises vitamin D efficiently — moderate daily exposure is sufficient.";

  const body = `${minutes} minutes of midday sun is recommended for ${skin.name} skin in ${city} during ${season}. ${urgency}`;

  const uvLabel =
    uvIndex <= 2
      ? "Low"
      : uvIndex <= 5
        ? "Moderate"
        : uvIndex <= 7
          ? "High"
          : "Very High";

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
export default function DashboardPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const router = useRouter();
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibrated, setRecalibrated] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!profile || loading)
    return <LoadingScreen message="Calibrating your protocol..." />;

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
          benefit:
            "Supports healthy egg development and prepares your body for conception.",
          foods: ["Leafy greens", "Lentils", "Asparagus"],
        };
  const d = {
    scoreLabel: isPreg
      ? "Pregnancy Optimization"
      : isPost
        ? "Recovery Readiness"
        : "Fertility Readiness",

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

    sunUV: "Moderate",
    sunWindow: "11:30 – 13:00",

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
  // const d = JT_CONTENT[jt] ?? JT_CONTENT.trying_to_conceive;
  const idx = STAGE_IDX[jt] ?? 1;
  const now = new Date();
  const h = now.getHours();
  const greeting =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
      icon: <Utensils size={14} />,
      items: protocol?.nutrition_plan
        ? protocol.nutrition_plan
            .split(".")
            .filter(Boolean)
            .map((s) => s.trim() + ".")
        : ["Focus on folate-rich foods and healthy fats today"],
    },
    {
      key: "Supplements",
      icon: <Pill size={14} />,
      items: protocol?.supplements
        ? protocol.supplements.split(",").map((s) => s.trim())
        : ["Prenatal Vitamin", "Omega-3", "Vitamin D"],
    },
    {
      key: "Movement",
      icon: <Activity size={14} />,
      items: protocol?.movement
        ? [protocol.movement]
        : ["30 minutes gentle movement"],
    },
    {
      key: "Avoid Today",
      icon: <AlertCircle size={14} />,
      items: protocol?.avoid_today
        ? [protocol.avoid_today]
        : ["Avoid excessive caffeine and processed foods"],
    },
  ];

  const connBg = (i: number) => {
    if (i < idx) return `linear-gradient(to right,${SUCCESS},${GOLD})`;
    if (i === idx)
      return `linear-gradient(to right,${GOLD},rgba(180,155,120,0.2))`;
    return "rgba(180,155,120,0.2)";
  };

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between px-6 pt-6">
        <div className="flex-1 pr-4">
          <p className="text-2xs text-muted mb-1 tracking-wide">{dateStr}</p>
          <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight">
            {greeting}, {profile.first_name || "there"}
          </h1>
          <p className="font-serif italic text-md text-secondary leading-relaxed mt-2.5">
            {protocol?.fertility_tip || d.emotionalLine}
          </p>
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-pill"
            style={{ background: "rgba(212,176,106,0.12)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span className="text-2xs text-gold font-medium tracking-wide">
              {d.week}
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center cursor-pointer shrink-0 mt-1"
        >
          <User size={18} className="text-secondary" />
        </button>
      </div>

      {/* ── Journey progress ── */}
      <div className="px-6 mt-5">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-4">
            Your Journey
          </p>
          {/* Dots + connectors */}
          <div className="flex items-center">
            {STAGES.flatMap((_, i) => {
              const past = i < idx;
              const cur = i === idx;
              const dotSize = cur ? 16 : 10;
              const els: React.ReactNode[] = [
                <div
                  key={`d${i}`}
                  className="shrink-0 flex justify-center"
                  style={{ width: cur ? 24 : 16 }}
                >
                  <div
                    style={{
                      width: dotSize,
                      height: dotSize,
                      borderRadius: "50%",
                      background: past ? SUCCESS : cur ? GOLD : "transparent",
                      border: `2px solid ${past ? SUCCESS : cur ? GOLD : "rgba(180,155,120,0.35)"}`,
                      boxShadow: cur
                        ? "0 0 0 5px rgba(212,176,106,0.18)"
                        : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {past && <Check size={6} color="#fff" strokeWidth={3} />}
                  </div>
                </div>,
              ];
              if (i < 4)
                els.push(
                  <div
                    key={`c${i}`}
                    className="flex-1 h-px"
                    style={{ background: connBg(i) }}
                  />,
                );
              return els;
            })}
          </div>
          {/* Labels */}
          <div className="flex mt-2.5">
            {STAGES.map((stage, i) => {
              const past = i < idx;
              const cur = i === idx;
              return (
                <div key={i} className="flex-1 text-center">
                  <p
                    style={{
                      fontSize: 9,
                      fontWeight: cur ? 600 : 400,
                      color: cur ? GOLD : past ? SUCCESS : "#9A9094",
                      lineHeight: 1.3,
                    }}
                  >
                    {stage.label}
                  </p>
                  <p
                    style={{
                      fontSize: 8,
                      color: "#9A9094",
                      fontStyle: "italic",
                      marginTop: 2,
                      lineHeight: 1.2,
                    }}
                  >
                    {stage.emotional}
                  </p>
                </div>
              );
            })}
          </div>
          {/* Now / Next */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex">
              <div className="flex-1 pr-3">
                <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                  Now
                </p>
                <p className="text-sm text-primary font-medium leading-snug">
                  {d.stageNow}
                </p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 pl-3">
                <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                  What's next
                </p>
                <p className="text-sm text-secondary leading-snug">
                  {d.stageNext}
                </p>
              </div>
            </div>
            {(d.babyMilestone || protocol?.baby_focus) && (
              <div
                className="mt-3 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
                style={{ background: "rgba(212,176,106,0.08)" }}
              >
                <Sparkles size={14} color={GOLD} />
                <p className="font-serif italic text-sm text-secondary leading-snug">
                  {protocol?.baby_focus || d.babyMilestone}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Score ── */}
      <div className="px-6 mt-4">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
          <div className="flex flex-col items-center py-1">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-5">
              {d.scoreLabel}
            </p>
            <FertilityScoreRing score={profile.fertility_score || 0} />
            <p className="font-serif italic text-base text-gold mt-4 text-center leading-relaxed">
              {protocol?.female_risk_summary ||
                "Your body is building something extraordinary."}
            </p>
          </div>
        </div>
      </div>

      {/* ── AI Protocol accordion ── */}
      <div className="px-6 mt-4">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-primary tracking-tight">
                Your Protocol for Today
              </h3>
              <p className="text-2xs text-muted mt-0.5">
                AI-generated · Personalized for you
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(212,176,106,0.12)" }}
            >
              <Brain size={18} color={GOLD} />
            </div>
          </div>
          {sections.map((sec, i) => (
            <div
              key={sec.key}
              className={
                i < sections.length - 1
                  ? "mb-4 pb-4 border-b border-border"
                  : ""
              }
            >
              <button
                onClick={() =>
                  setExpanded(expanded === sec.key ? null : sec.key)
                }
                className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer p-0"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-section flex items-center justify-center">
                    <span style={{ color: GOLD }}>{sec.icon}</span>
                  </div>
                  <span className="text-base font-medium text-primary tracking-tight">
                    {sec.key}
                  </span>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted transition-transform duration-200"
                  style={{
                    transform: expanded === sec.key ? "rotate(90deg)" : "none",
                  }}
                />
              </button>
              {expanded === sec.key && (
                <div className="pt-3 pl-9">
                  {sec.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 mb-2">
                      <div className="w-1 h-1 rounded-full bg-gold mt-1.5 shrink-0" />
                      <span className="text-sm text-secondary leading-snug">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="mt-4">
            <button
              onClick={handleRecalibrate}
              disabled={recalibrating}
              className="w-full rounded-2xl py-3.5 flex items-center justify-center gap-2 transition-all"
              style={{
                background: recalibrated
                  ? "rgba(31,122,90,0.08)"
                  : "rgba(212,176,106,0.1)",
                border: `1.5px solid ${recalibrated ? SUCCESS : GOLD}`,
                cursor: recalibrating ? "not-allowed" : "pointer",
              }}
            >
              {recalibrating ? (
                <>
                  <div className="spin">
                    <Loader size={16} color={GOLD} />
                  </div>
                  <span className="text-base font-medium text-secondary">
                    Analyzing your current state…
                  </span>
                </>
              ) : recalibrated ? (
                <span
                  className="text-base font-medium"
                  style={{ color: SUCCESS }}
                >
                  Protocol updated
                </span>
              ) : (
                <>
                  <RotateCcw size={16} color={GOLD} />
                  <span className="text-base font-medium text-gold">
                    Recalibrate Protocol
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Sunlight ── */}
      {/* ── Sunlight ── */}
      {(() => {
        const sun = getSunGuidance(
          profile.skin_type,
          profile.city || "your location",
        );
        return (
          <div className="px-6 mt-4">
            <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
              <div className="flex gap-3.5 items-start">
                <div className="relative shrink-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 40%,rgba(212,176,106,0.22),rgba(212,176,106,0.06))",
                      border: "1px solid rgba(212,176,106,0.2)",
                    }}
                  >
                    <Sun size={22} color={GOLD} />
                  </div>
                  <div
                    className="absolute -inset-1 rounded-[18px] pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle,rgba(212,176,106,0.12),transparent 70%)",
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin size={11} className="text-muted" />
                    <span className="text-2xs text-muted">
                      {profile.city || "Your location"}
                    </span>
                    <span className="text-2xs text-muted">·</span>
                    <span className="text-2xs text-muted">
                      UV: {sun.uvIndex}
                    </span>
                    <span className="text-2xs text-muted">·</span>
                    <span className="text-2xs text-muted">
                      {sun.skinName} skin
                    </span>
                  </div>
                  <h4 className="text-md font-semibold text-primary mb-1">
                    Sunlight Guidance
                  </h4>
                  <div className="flex items-baseline gap-1 mb-2.5">
                    <span className="text-2xs text-muted">
                      Best window today:
                    </span>
                    <span className="text-base font-semibold text-primary tracking-tight">
                      {sun.window}
                    </span>
                    <span className="text-2xs text-muted ml-1">
                      · {sun.minutes} min
                    </span>
                  </div>
                  <p
                    className="text-sm text-secondary leading-relaxed font-serif italic pl-2.5"
                    style={{ borderLeft: "2px solid rgba(212,176,106,0.3)" }}
                  >
                    {sun.body}
                  </p>
                  {/* Vitamin D risk badge — only shown for higher risk skin types */}
                  {sun.isHighRisk && (
                    <div
                      className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl"
                      style={{
                        background: "rgba(194,107,46,0.07)",
                        border: "1px solid rgba(194,107,46,0.2)",
                      }}
                    >
                      <span className="text-warning text-xs shrink-0">⚠</span>
                      <div>
                        <p className="text-2xs text-warning font-semibold uppercase tracking-widest mb-0.5">
                          Vitamin D risk: {sun.vitaminDRisk}
                        </p>
                        <p className="text-2xs text-warning leading-relaxed">
                          Baby development: {sun.babyRisk}. Consider
                          supplementing with D3 year-round.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Nutrition focus ── */}
      <div className="px-6 mt-4">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
          <div className="flex gap-3.5 items-start">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: "rgba(31,122,90,0.08)",
                border: "1px solid rgba(31,122,90,0.15)",
              }}
            >
              <Leaf size={20} color={SUCCESS} />
            </div>
            <div className="flex-1">
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Today's Nutrient Focus
              </p>
              <h4 className="text-2xl font-semibold text-primary tracking-tight mb-1.5">
                {d.nutrientName}
              </h4>
              <p className="text-sm text-secondary leading-relaxed font-serif italic mb-3.5">
                {protocol?.nutrition_plan || d.nutrientBenefit}
              </p>
              <div className="flex gap-2 flex-wrap">
                {d.nutrientFoods.map((food, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-section rounded-pill"
                  >
                    <div
                      className="w-1 h-1 rounded-full"
                      style={{ background: SUCCESS }}
                    />
                    <span className="text-sm text-primary font-medium">
                      {food}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3.5">
                <button
                  onClick={() => router.push("/nutrition")}
                  className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                >
                  <span className="text-2xs text-muted font-medium">
                    View full nutrition plan
                  </span>
                  <ChevronRight size={13} className="text-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hydration ── */}
      <div className="px-6 mt-4">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card flex gap-3.5 items-center">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(74,144,196,0.08)",
              border: "1px solid rgba(74,144,196,0.15)",
            }}
          >
            <Droplets size={20} color={BLUE} />
          </div>
          <div className="flex-1">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
              Hydration Target
            </p>
            <h4 className="text-3xl font-semibold text-primary tracking-tight mb-1">
              {d.hydration}
            </h4>
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {d.hydrationTip}
            </p>
          </div>
        </div>
      </div>

      {/* ── Movement ── */}
      <div className="px-6 mt-4">
        <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
          <div className="flex gap-3.5 items-start">
            <div className="relative w-11 h-11 shrink-0">
              <svg
                width="44"
                height="44"
                viewBox="0 0 44 44"
                className="absolute inset-0"
              >
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="rgba(31,122,90,0.12)"
                  strokeWidth="2"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke={SUCCESS}
                  strokeWidth="2"
                  strokeDasharray="60 60"
                  strokeDashoffset="10"
                  strokeLinecap="round"
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                  }}
                />
              </svg>
              <div
                className="absolute inset-1.5 rounded-full flex items-center justify-center"
                style={{ background: "rgba(31,122,90,0.08)" }}
              >
                <Activity size={16} color={SUCCESS} />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Focus Today
              </p>
              <h4 className="text-xl font-semibold text-primary tracking-tight mb-1.5">
                {protocol?.movement
                  ? protocol.movement.split(" ").slice(0, 6).join(" ") +
                    (protocol.movement.split(" ").length > 6 ? "…" : "")
                  : d.movementFocus}
              </h4>
              <p className="text-sm text-secondary leading-relaxed font-serif italic">
                {protocol?.movement || d.movementBenefit}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Baby card (pregnant only) ── */}
      {jt === "currently_pregnant" && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-3xl p-5 border border-border shadow-card">
            <div className="flex gap-3.5 items-start">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(212,176,106,0.08)",
                  border: "1px solid rgba(212,176,106,0.18)",
                }}
              >
                <Brain size={22} color={GOLD} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-primary">
                    Baby This Week
                  </h4>
                  <span
                    className="text-2xs font-semibold text-gold px-2 py-1 rounded-pill"
                    style={{ background: "rgba(212,176,106,0.12)" }}
                  >
                    Week 15
                  </span>
                </div>
                <p className="text-sm text-secondary leading-relaxed font-serif italic mb-3.5">
                  {protocol?.baby_focus ||
                    "The brain is growing rapidly. Synaptic connections forming at an extraordinary rate. Your DHA intake is directly fueling this development."}
                </p>
                <div className="flex gap-2">
                  {[
                    ["~125g", "Estimated weight"],
                    ["16cm", "Crown to heel"],
                    ["Brain", "Focus system"],
                  ].map(([v, l], i) => (
                    <div
                      key={i}
                      className="flex-1 bg-section rounded-xl p-2.5 text-center"
                    >
                      <div className="text-md font-semibold text-primary">
                        {v}
                      </div>
                      <div className="text-2xs text-muted mt-0.5 leading-tight">
                        {l}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Daily focus summary ── */}
      <div className="px-6 mt-4">
        <div
          className="rounded-3xl p-4.5 flex items-center gap-3.5 p-3"
          style={{
            background:
              "linear-gradient(135deg,rgba(212,176,106,0.1),rgba(180,155,120,0.06))",
            border: "1px solid rgba(212,176,106,0.22)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 "
            style={{ background: "rgba(212,176,106,0.15)" }}
          >
            <Sparkles size={17} color={GOLD} />
          </div>
          <div className="flex-1">
            <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
              Your focus today
            </p>
            <p className="text-md font-medium text-primary font-serif italic leading-snug">
              {protocol?.fertility_tip
                ? protocol.fertility_tip.split(".")[0] + "."
                : d.dailyFocus}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
