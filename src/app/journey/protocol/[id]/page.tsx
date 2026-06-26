"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMilestone } from "@/lib/data";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronLeft, Check, Leaf, ArrowRight, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";

interface MilestoneDetail {
  _id: string;
  title: string;
  summary: string;
  week_label: string;
  status: string;
  what_happening: string;
  focus_goals: string; // JSON array string
  actions: string; // JSON array string
  // phase info (populated from phase record)
  phase_title?: string;
  phase_week_range?: string;
}

function safeParseArray(str: string): string[] {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { label: "Completed", bg: `${SUCCESS}15`, color: SUCCESS },
    current: {
      label: "In Progress",
      bg: "rgba(212,176,106,0.15)",
      color: GOLD,
    },
    upcoming: {
      label: "Upcoming",
      bg: "var(--section-bg)",
      color: "var(--text-muted)",
    },
  }[status] ?? {
    label: status,
    bg: "var(--section-bg)",
    color: "var(--text-muted)",
  };

  return (
    <span
      className="text-2xs font-semibold px-2.5 py-1 rounded-pill"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

export default function MilestoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams();
  const router = useRouter();
  const [milestone, setMilestone] = useState<MilestoneDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const milestoneId = id as string;

  useEffect(() => {
    async function load() {
      try {
        const data = await getMilestone(milestoneId);
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
      <div className="min-h-full bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-sm text-muted text-center">Milestone not found.</p>
        <button
          onClick={() => router.push("/journey/protocol")}
          className="text-sm font-semibold text-gold bg-transparent border-0 cursor-pointer font-sans"
        >
          ← Back to roadmap
        </button>
      </div>
    );
  }

  const focusGoals = safeParseArray(milestone.focus_goals);
  const actions = safeParseArray(milestone.actions);

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* Header */}
      <div className="px-6 pt-5 pb-0">
        <button
          onClick={() => router.push("/journey/protocol")}
          className="flex items-center gap-1 bg-transparent border-0 cursor-pointer mb-4 p-0 font-sans"
        >
          <ChevronLeft size={18} className="text-muted" />
          <span className="text-sm text-muted">Back to roadmap</span>
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xs text-muted bg-section px-2.5 py-1 rounded-pill">
            {milestone.week_label}
          </span>
          <StatusBadge status={milestone.status} />
        </div>

        <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          {milestone.title}
        </h1>
        <p className="text-sm text-secondary leading-relaxed">
          {milestone.summary}
        </p>
      </div>

      {/* Status indicator */}
      <div className="px-6 mt-5">
        <div
          className="bg-card rounded-[22px] p-5 border"
          style={{
            borderColor:
              milestone.status === "current"
                ? "rgba(212,176,106,0.45)"
                : milestone.status === "completed"
                  ? `${SUCCESS}30`
                  : "rgba(180,155,120,0.18)",
          }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  milestone.status === "completed"
                    ? `${SUCCESS}15`
                    : milestone.status === "current"
                      ? "rgba(212,176,106,0.15)"
                      : "var(--section-bg)",
                border: `2px solid ${
                  milestone.status === "completed"
                    ? SUCCESS
                    : milestone.status === "current"
                      ? GOLD
                      : "rgba(180,155,120,0.35)"
                }`,
              }}
            >
              {milestone.status === "completed" ? (
                <Check size={18} color={SUCCESS} />
              ) : milestone.status === "current" ? (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: GOLD }}
                />
              ) : (
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "rgba(180,155,120,0.5)" }}
                />
              )}
            </div>
            <div>
              <p className="text-base font-semibold text-primary">
                {milestone.status === "completed"
                  ? "Milestone Completed"
                  : milestone.status === "current"
                    ? "Active Milestone"
                    : "Upcoming Milestone"}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {milestone.week_label}
                {milestone.phase_title ? ` · ${milestone.phase_title}` : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What's happening — AI generated */}
      {milestone.what_happening && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <div className="flex items-start gap-2.5 mb-3">
              <Sparkles
                size={14}
                color={GOLD}
                className="flex-shrink-0 mt-0.5"
              />
              <p className="text-2xs text-gold uppercase tracking-widest font-semibold">
                What's happening
              </p>
            </div>
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {milestone.what_happening}
            </p>
          </div>
        </div>
      )}

      {/* Focus Goals — AI generated */}
      {focusGoals.length > 0 && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Focus Goals
            </p>
            <div className="flex flex-col gap-2.5">
              {focusGoals.map((goal, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3.5 py-3 bg-section rounded-xl"
                >
                  <Leaf
                    size={12}
                    color={GOLD}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-primary leading-snug">
                    {goal}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions — AI generated */}
      {actions.length > 0 && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Actions
            </p>
            <div className="flex flex-col gap-2">
              {actions.map((action, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3.5 py-3 bg-elevated rounded-xl border border-border"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(212,176,106,0.15)" }}
                  >
                    <span className="text-2xs font-bold text-gold">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-sm text-primary leading-snug">
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Back to roadmap */}
      <div className="px-6 mt-5">
        <button
          onClick={() => router.push("/journey/protocol")}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2
                     border-0 cursor-pointer font-sans"
          style={{ background: GOLD }}
        >
          <span className="text-sm font-semibold text-white">
            Back to Roadmap
          </span>
          <ArrowRight size={15} color="#fff" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
