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
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  ArrowRight,
  Leaf,
} from "lucide-react";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";

interface MilestoneRecord {
  _id: string;
  week_label: string;
  title: string;
  summary: string;
  status: string;
  what_happening: string;
  focus_goals: string;
  actions: string;
}
interface PhaseRecord {
  _id: string;
  phase_number: number;
  title: string;
  week_range: string;
  status: string;
  milestones?: MilestoneRecord[];
}

function safeParseArray(str: string): string[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

export default function JourneyProtocolPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const router = useRouter();

  const [phases, setPhases] = useState<PhaseRecord[]>([]);
  const [loadingJourney, setLoadingJourney] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(
    null,
  );
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
        // Load milestones for each phase
        const withMilestones = await Promise.all(
          existingPhases.map(async (p: PhaseRecord) => ({
            ...p,
            milestones: await getMilestones(p._id),
          })),
        );
        setPhases(withMilestones);
        // Auto-expand current phase
        const current = withMilestones.find((p) => p.status === "current");
        if (current) setExpandedPhase(current._id);
        setLoadingJourney(false);
        return;
      }

      // Generate new journey
      hasGenerated.current = true;
      setGenerating(true);

      const res = await triggerGenerateJourney(uid);

      // Parse AI response and create records
      try {
        const parsed = JSON.parse(res.response.result);
        const aiPhases = parsed.phases || [];

        const createdPhases = await Promise.all(
          aiPhases.map(async (p: any) => {
            const phaseId = await createJourneyPhase({
              // user:         uid,
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
        const current = createdPhases.find((p) => p.status === "current");
        if (current) setExpandedPhase(current._id);
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

  if (!profile || loading)
    return <LoadingScreen message="Loading your roadmap…" />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const week = profile.current_week ?? 0;

  if (loadingJourney) {
    return (
      <div className="min-h-full bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent spin" />
        <p className="text-sm text-muted text-center">
          {generating
            ? "Generating your personalized roadmap…"
            : "Loading your journey…"}
        </p>
        {generating && (
          <p className="text-2xs text-muted text-center">
            This takes about 15–20 seconds
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <button
          onClick={() => router.push("/journey")}
          className="flex items-center gap-1 bg-transparent border-0 cursor-pointer mb-4 p-0 font-sans"
        >
          <ChevronLeft size={18} className="text-muted" />
          <span className="text-sm text-muted">Back</span>
        </button>
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1.5">
          {jt === "trying_to_conceive"
            ? "Way to Baby"
            : jt === "currently_pregnant"
              ? "Pregnancy Roadmap"
              : "Recovery Journey"}
        </p>
        <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {jt === "trying_to_conceive"
            ? "Preparation Protocol"
            : jt === "currently_pregnant"
              ? `Week ${week} Protocol`
              : `Week ${week} Recovery`}
        </h1>
        <p className="text-sm text-secondary leading-relaxed">
          AI-generated and personalized to your profile, job, and lifestyle.
        </p>
      </div>

      {/* Protocol tip */}
      {protocol?.fertility_tip && (
        <div className="px-6 mt-4">
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{
              background: "rgba(212,176,106,0.07)",
              borderLeft: "2px solid rgba(212,176,106,0.35)",
            }}
          >
            <Sparkles size={13} color={GOLD} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {protocol.fertility_tip}
            </p>
          </div>
        </div>
      )}

      {/* Phase list */}
      {phases.length === 0 ? (
        <div className="px-6 mt-8 text-center">
          <p className="text-sm text-muted mb-2">No roadmap generated yet.</p>
          <button
            onClick={() => {
              hasGenerated.current = false;
              setLoadingJourney(true);
              loadJourney();
            }}
            className="text-sm font-semibold text-gold bg-transparent border-0 cursor-pointer font-sans"
          >
            Generate now →
          </button>
        </div>
      ) : (
        <div className="px-6 mt-5 flex flex-col gap-3">
          {phases
            .sort((a, b) => a.phase_number - b.phase_number)
            .map((phase) => {
              const isExpanded = expandedPhase === phase._id;
              const phaseColor =
                phase.status === "completed"
                  ? SUCCESS
                  : phase.status === "current"
                    ? GOLD
                    : "var(--text-muted)";

              return (
                <div
                  key={phase._id}
                  className="bg-card rounded-[22px] overflow-hidden"
                  style={{
                    border:
                      phase.status === "current"
                        ? "1px solid rgba(212,176,106,0.45)"
                        : "1px solid rgba(180,155,120,0.18)",
                  }}
                >
                  {/* Phase header */}
                  <button
                    onClick={() =>
                      setExpandedPhase(isExpanded ? null : phase._id)
                    }
                    className="w-full px-5 py-5 bg-transparent border-0 cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
                        style={{
                          background:
                            phase.status === "completed"
                              ? `${SUCCESS}15`
                              : phase.status === "current"
                                ? "rgba(212,176,106,0.15)"
                                : "var(--section-bg)",
                          border: `2px solid ${phaseColor}`,
                        }}
                      >
                        {phase.status === "completed" ? (
                          <Check size={16} color={SUCCESS} />
                        ) : (
                          <span
                            className="text-sm font-bold"
                            style={{ color: phaseColor }}
                          >
                            {phase.phase_number}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-base font-semibold text-primary">
                            {phase.title}
                          </span>
                          {phase.status === "current" && (
                            <span
                              className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                              style={{ background: "rgba(212,176,106,0.15)" }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted">
                          {phase.week_range}
                          {phase.milestones
                            ? ` · ${phase.milestones.length} milestone${phase.milestones.length !== 1 ? "s" : ""}`
                            : ""}
                        </span>
                      </div>
                      <ChevronRight
                        size={17}
                        className="text-muted flex-shrink-0 transition-transform duration-300"
                        style={{
                          transform: isExpanded ? "rotate(90deg)" : "none",
                        }}
                      />
                    </div>
                  </button>

                  {/* Milestones */}
                  {isExpanded && phase.milestones && (
                    <div className="border-t border-border px-4 py-3 flex flex-col gap-2.5">
                      {phase.milestones.map((ms) => {
                        const msExpanded = expandedMilestone === ms._id;
                        const msColor =
                          ms.status === "completed"
                            ? SUCCESS
                            : ms.status === "current"
                              ? GOLD
                              : "var(--text-muted)";
                        const focusGoals = safeParseArray(ms.focus_goals);
                        const actions = safeParseArray(ms.actions);

                        return (
                          <div
                            key={ms._id}
                            className="bg-elevated rounded-[18px] overflow-hidden px-3 pb-3"
                            style={{
                              border:
                                ms.status === "current"
                                  ? "1px solid rgba(212,176,106,0.3)"
                                  : "1px solid rgba(180,155,120,0.15)",
                            }}
                          >
                            <button
                              onClick={() =>
                                setExpandedMilestone(msExpanded ? null : ms._id)
                              }
                              className="w-full px-4.5 py-4 bg-transparent border-0 cursor-pointer text-left"
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
                                  style={{
                                    background:
                                      ms.status === "completed"
                                        ? SUCCESS
                                        : ms.status === "current"
                                          ? GOLD
                                          : "var(--section-bg)",
                                    border: `1.5px solid ${msColor}`,
                                  }}
                                >
                                  {ms.status === "completed" ? (
                                    <Check
                                      size={10}
                                      color="#fff"
                                      strokeWidth={2.5}
                                    />
                                  ) : (
                                    <div
                                      className="w-1.5 h-1.5 rounded-full"
                                      style={{
                                        background:
                                          ms.status === "current"
                                            ? "#fff"
                                            : "var(--text-muted)",
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-semibold text-primary">
                                      {ms.title}
                                    </span>
                                    <span className="text-2xs text-muted bg-section px-2 py-0.5 rounded-pill">
                                      {ms.week_label}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted leading-snug">
                                    {ms.summary}
                                  </p>
                                </div>
                                <ChevronRight
                                  size={14}
                                  className="text-muted flex-shrink-0 mt-1 transition-transform duration-200"
                                  style={{
                                    transform: msExpanded
                                      ? "rotate(90deg)"
                                      : "none",
                                  }}
                                />
                              </div>
                            </button>

                            {msExpanded && (
                              <div className="px-4.5 pb-4.5">
                                <div className="border-t border-border pt-3.5 mb-3.5">
                                  <p className="text-sm text-secondary leading-relaxed font-serif italic">
                                    {ms.what_happening}
                                  </p>
                                </div>
                                {focusGoals.length > 0 && (
                                  <>
                                    <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2.5">
                                      Focus Goals
                                    </p>
                                    <div className="flex flex-col gap-1.5 mb-3.5">
                                      {focusGoals.map((g, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-2"
                                        >
                                          <Leaf
                                            size={10}
                                            color={GOLD}
                                            className="flex-shrink-0"
                                          />
                                          <span className="text-sm text-secondary">
                                            {g}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                                {actions.length > 0 && (
                                  <>
                                    <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2.5">
                                      Actions
                                    </p>
                                    <div className="flex flex-col gap-1.5">
                                      {actions.map((a, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-2 px-3 py-2 bg-section rounded-xl"
                                        >
                                          <ArrowRight
                                            size={11}
                                            color={SUCCESS}
                                            className="flex-shrink-0"
                                          />
                                          <span className="text-sm text-primary">
                                            {a}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                )}
                                {/* Deep link to full milestone detail */}
                                <button
                                  onClick={() =>
                                    router.push(`/journey/protocol/${ms._id}`)
                                  }
                                  className="mt-3.5 w-full flex items-center justify-center gap-1.5
                                             py-2.5 rounded-xl border-0 cursor-pointer font-sans"
                                  style={{
                                    background: "rgba(212,176,106,0.08)",
                                    border: "1px solid rgba(212,176,106,0.25)",
                                  }}
                                >
                                  <span className="text-xs font-semibold text-gold">
                                    View full milestone
                                  </span>
                                  <ArrowRight size={12} color={GOLD} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
      <BottomNav />
    </div>
  );
}
