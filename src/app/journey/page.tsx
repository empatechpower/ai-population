"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import {
  getJourneyPhases,
  getMilestones,
  createJourneyPhase,
  createMilestone,
} from "@/lib/data";
import { triggerGenerateJourney } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronRight, ArrowRight, Sparkles } from "lucide-react";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const PURPLE = "#667EEA";

// ── Static helpers — used for display only, not for milestone logic ──

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
  const keys = Object.keys(sizes)
    .map(Number)
    .sort((a, b) => a - b);
  const closest = keys.reduce((p, c) =>
    Math.abs(c - week) < Math.abs(p - week) ? c : p,
  );
  return sizes[closest];
}

function RoadmapIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="5" cy="22" r="2.2" />
      <circle cx="14" cy="13" r="2.2" />
      <circle cx="23" cy="5" r="2.2" />
      <path d="M6.5 20.5 C9 17 11.5 15 11.8 14.5" />
      <path d="M16.2 11.5 C18.5 9 21 6.5 21.2 6.8" />
    </svg>
  );
}
function GrowthIcon({ color, size = 28 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 22 C7 18 10 16 13 17 C16 18 19 13 24 7" />
      <circle cx="9" cy="19" r="1.6" />
      <circle cx="14" cy="17" r="1.6" />
      <circle cx="19" cy="13" r="1.6" />
    </svg>
  );
}
function AfterBirthIcon({
  color,
  size = 28,
}: {
  color: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19 Q14 8 24 19" />
      <line x1="4" y1="22" x2="24" y2="22" />
      <line x1="9" y1="19" x2="9" y2="22" />
      <line x1="19" y1="19" x2="19" y2="22" />
      <circle cx="14" cy="5" r="2.2" />
      <line x1="14" y1="7.4" x2="14" y2="10" />
    </svg>
  );
}

export default function JourneyPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const router = useRouter();

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

      // 1. Check if phases already exist for this user
      const existingPhases = await getJourneyPhases();

      if (existingPhases.length > 0) {
        // Load milestones for each phase
        const withMilestones = await Promise.all(
          existingPhases.map(async (p: any) => ({
            ...p,
            milestones: await getMilestones(p._id),
          })),
        );
        setPhases(withMilestones);
        setLoadingJourney(false);
        return;
      }

      // 2. Nothing exists — trigger AI generation
      hasGenerated.current = true;
      setGenerating(true);

      const res = await triggerGenerateJourney(uid);

      // 3. Parse AI response and create records in Bubble
      try {
        const parsed = JSON.parse(res.response.results);
        const aiPhases = parsed.phases || [];

        const createdPhases = await Promise.all(
          aiPhases.map(async (p: any) => {
            // Create the phase record
            const phaseId = await createJourneyPhase({
              // user: uid,
              protocol: protocol?._id ?? "",
              phase_number: p.phase_number,
              title: p.title,
              week_range: p.week_range,
              status: p.status,
            });
            console.log("Created phase:", phaseId);
            // Create all milestone records for this phase
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
  console.log("phase", phases);
  if (!profile || loading)
    return <LoadingScreen message="Loading your journey…" />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const week = profile.current_week ?? 0;

  const isPregnant = jt === "currently_pregnant";
  const isPostpartum = jt === "postpartum";

  const phaseLabel = isPregnant
    ? getPregnancyPhaseLabel(week)
    : isPostpartum
      ? getPostpartumPhaseLabel(week)
      : null;

  const progress = isPregnant
    ? week / 40
    : isPostpartum
      ? Math.min(week / 52, 1)
      : 0.05;

  const weekLabel = isPregnant
    ? `Week ${week} of 40`
    : isPostpartum
      ? `Week ${week} postpartum`
      : "Your journey starts here";

  const babySize = isPregnant && week > 0 ? getBabySize(week) : null;

  // Current phase from AI data
  const currentPhase = phases.find((p) => p.status === "current");

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1.5">
          Journey
        </p>
        <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {jt === "trying_to_conceive"
            ? "Your Path to Conception"
            : isPregnant
              ? "Your Pregnancy"
              : "Your Recovery"}
        </h1>
        {protocol?.fertility_tip && (
          <p className="font-serif italic text-sm text-secondary leading-relaxed">
            {protocol.fertility_tip}
          </p>
        )}
      </div>

      {/* Progress strip */}
      <div className="px-6 mt-5">
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                {isPregnant
                  ? "Pregnancy Progress"
                  : isPostpartum
                    ? "Recovery Progress"
                    : "Fertility Journey"}
              </p>
              <p className="text-lg font-semibold text-primary">{weekLabel}</p>
              {phaseLabel && (
                <p
                  className="text-xs mt-0.5 font-medium"
                  style={{ color: phaseLabel.color }}
                >
                  {phaseLabel.phase}
                </p>
              )}
            </div>
            {/* Circular progress */}
            <div
              className="relative flex-shrink-0"
              style={{ width: 56, height: 56 }}
            >
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke="rgba(180,155,120,0.18)"
                  strokeWidth="4"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="23"
                  fill="none"
                  stroke={phaseLabel?.color ?? GOLD}
                  strokeWidth="4"
                  strokeDasharray={`${progress * 144.5} 144.5`}
                  strokeLinecap="round"
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {Math.round(progress * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* AI current phase context */}
          {currentPhase && (
            <div className="flex mt-3 pt-3 border-t border-border">
              <div className="flex-1 pr-3">
                <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                  Now
                </p>
                <p className="text-sm text-primary font-medium leading-snug">
                  {currentPhase.title}
                </p>
              </div>
              <div className="w-px bg-border" />
              <div className="flex-1 pl-3">
                <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                  Phase
                </p>
                <p className="text-sm text-secondary leading-snug">
                  {currentPhase.week_range}
                </p>
              </div>
            </div>
          )}

          {/* Baby focus from protocol */}
          {protocol?.baby_focus && (
            <div
              className="mt-3 flex items-start gap-2 px-3.5 py-2.5 rounded-2xl"
              style={{ background: "rgba(212,176,106,0.07)" }}
            >
              <Sparkles
                size={12}
                color={GOLD}
                className="flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-secondary leading-relaxed font-serif italic">
                {protocol.baby_focus}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Baby size card */}
      {isPregnant && babySize && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-semibold text-primary">
                Baby at Week {week}
              </h4>
              <span
                className="text-2xs font-semibold text-gold px-2.5 py-1 rounded-pill"
                style={{ background: "rgba(212,176,106,0.12)" }}
              >
                Week {week}
              </span>
            </div>
            <p className="text-sm text-secondary leading-relaxed font-serif italic mb-3">
              {protocol?.baby_focus ||
                `About the size of a ${babySize.size.toLowerCase()}, weighing ${babySize.weight}.`}
            </p>
            <div className="flex gap-2">
              {[
                ["🍐", babySize.size, "Size"],
                ["⚖️", babySize.weight, "Weight"],
                ["🧠", week >= 20 ? "Developing" : "Forming", "Focus"],
              ].map(([emoji, value, label], i) => (
                <div
                  key={i}
                  className="flex-1 bg-section rounded-xl p-2.5 text-center"
                >
                  <div className="text-base mb-0.5">{emoji as string}</div>
                  <div className="text-xs font-semibold text-primary">
                    {value as string}
                  </div>
                  <div className="text-2xs text-muted mt-0.5">
                    {label as string}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div className="px-6 mt-5 flex flex-col gap-4">
        {/* Primary journey card */}
        <div
          className="bg-card rounded-[22px] overflow-hidden border"
          style={{
            borderColor: "rgba(212,176,106,0.35)",
            boxShadow: "0 4px 28px rgba(212,176,106,0.10)",
          }}
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3.5">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  background: "rgba(212,176,106,0.12)",
                }}
              >
                <RoadmapIcon color={GOLD} />
              </div>
              <span
                className="text-2xs font-semibold text-gold px-2.5 py-1 rounded-pill"
                style={{ background: "rgba(212,176,106,0.12)" }}
              >
                {jt === "trying_to_conceive"
                  ? "Active"
                  : isPregnant
                    ? `Week ${week}`
                    : `Week ${week} postpartum`}
              </span>
            </div>
            <h2 className="text-lg font-semibold text-primary tracking-tight mb-1.5">
              {jt === "trying_to_conceive"
                ? "Way to Baby"
                : isPregnant
                  ? "Pregnancy Roadmap"
                  : "Recovery Roadmap"}
            </h2>
            <p className="text-sm text-secondary leading-relaxed mb-4">
              {loadingJourney
                ? generating
                  ? "Generating your personalized roadmap…"
                  : "Loading your roadmap…"
                : phases.length > 0
                  ? `${phases.filter((p) => p.status === "completed").length} of ${phases.length} phases complete`
                  : jt === "trying_to_conceive"
                    ? "Step-by-step fertility roadmap with personalized milestones and weekly goals."
                    : isPregnant
                      ? `Week-by-week pregnancy guide personalized to your profile.`
                      : `Phase-by-phase recovery plan personalized to your birth and lifestyle.`}
            </p>
            <div className="h-1 bg-border rounded-full overflow-hidden mb-5">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(to right,${SUCCESS},${GOLD})`,
                }}
              />
            </div>
          </div>
          <button
            onClick={() => router.push("/journey/protocol")}
            className="w-full py-3.5 flex items-center justify-between px-5 border-0 cursor-pointer"
            style={{ background: GOLD }}
          >
            <span className="text-sm font-semibold text-white">
              {loadingJourney
                ? generating
                  ? "Generating…"
                  : "Loading…"
                : jt === "trying_to_conceive"
                  ? "View Roadmap"
                  : isPregnant
                    ? "View Protocol"
                    : "View Recovery Plan"}
            </span>
            <ArrowRight size={16} color="#fff" />
          </button>
        </div>

        {/* Baby / recovery card */}
        <div className="bg-card rounded-[22px] overflow-hidden border border-border">
          <div className="p-5">
            <div className="flex items-start justify-between mb-3.5">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  background: "rgba(168,185,165,0.15)",
                }}
              >
                <GrowthIcon color={SUCCESS} />
              </div>
              {!jt.includes("conceive") && phaseLabel && (
                <span
                  className="text-2xs font-semibold px-2.5 py-1 rounded-pill"
                  style={{
                    background: `${phaseLabel.color}15`,
                    color: phaseLabel.color,
                  }}
                >
                  {phaseLabel.phase}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-primary tracking-tight mb-1.5">
              {isPregnant
                ? "Baby Development"
                : isPostpartum
                  ? "Your Recovery"
                  : "Baby Development"}
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              {protocol?.baby_focus ||
                (isPregnant
                  ? `At week ${week}, your baby is growing and developing rapidly.`
                  : isPostpartum
                    ? `Week ${week} postpartum — focus on gentle recovery and restoration.`
                    : "Your lifestyle choices now directly impact future embryo quality.")}
            </p>
          </div>
          <div className="px-5 pb-5">
            <button
              onClick={() =>
                router.push(
                  isPregnant ? "/journey/pregnancy" : "/journey/protocol",
                )
              }
              className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 font-sans"
            >
              <span className="text-sm font-semibold text-gold">
                {isPostpartum
                  ? "Recovery protocols"
                  : isPregnant
                    ? "Week detail"
                    : "Learn more"}
              </span>
              <ArrowRight size={14} color={GOLD} />
            </button>
          </div>
        </div>

        {/* After birth card */}
        <div
          className="bg-card rounded-[22px] overflow-hidden border border-border"
          style={{ opacity: !isPostpartum ? 0.65 : 1 }}
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3.5">
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center"
                style={{
                  width: 52,
                  height: 52,
                  background: isPostpartum
                    ? "rgba(212,176,106,0.12)"
                    : "rgba(180,155,120,0.1)",
                }}
              >
                <AfterBirthIcon color={isPostpartum ? GOLD : "#B4A090"} />
              </div>
              {!isPostpartum && (
                <span className="text-2xs text-muted px-2.5 py-1 rounded-pill bg-section">
                  After birth
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold text-primary tracking-tight mb-1.5">
              After Birth
            </h2>
            <p className="text-sm text-secondary leading-relaxed">
              {isPostpartum
                ? "Postpartum recovery, hormonal restoration, breastfeeding guidance and newborn care."
                : "Postpartum recovery protocols unlock after birth."}
            </p>
            {isPostpartum && (
              <button
                onClick={() => router.push("/journey/recovery")}
                className="flex items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 font-sans mt-4"
              >
                <span className="text-sm font-semibold text-gold">
                  Explore postpartum
                </span>
                <ArrowRight size={14} color={GOLD} />
              </button>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
