"use client";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { createMovement, getMovementPractices } from "@/lib/data";
import { triggerGenerateMovement } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import {
  Sparkles,
  Activity,
  Wind,
  Heart,
  Leaf,
  Clock,
  ChevronRight,
} from "lucide-react";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const LAVENDER = "#8B85C1";

interface Exercise {
  name: string;
  sets?: string;
  duration?: string;
}
interface Practice {
  _id?: string;
  practice_id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  exercises_json: Exercise[]; // parsed from JSON string
  why: string;
  guidance?: string;
}

function categoryColor(cat: string) {
  if (cat === "Moderate") return GOLD;
  if (cat === "Restorative") return LAVENDER;
  return SUCCESS;
}

function categoryBg(cat: string) {
  if (cat === "Moderate") return "rgba(212,176,106,0.1)";
  if (cat === "Restorative") return "rgba(139,133,193,0.1)";
  return "rgba(31,122,90,0.1)";
}

function PracticeIcon({
  category,
  color,
}: {
  category: string;
  color: string;
}) {
  if (category === "Restorative") return <Wind size={20} color={color} />;
  if (category === "Moderate") return <Leaf size={20} color={color} />;
  return <Activity size={20} color={color} />;
}

// Match AI movement text to a practice
function matchPractice(movementText: string, practices: Practice[]) {
  if (!movementText || !practices.length) return null;
  const lower = movementText.toLowerCase();
  return (
    practices.find(
      (p) =>
        lower.includes(p.title.toLowerCase().split(" ")[0]) ||
        lower.includes(p.category.toLowerCase()),
    ) ?? practices[0]
  );
}

export default function MovementPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loadingPractices, setLoadingPractices] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || !protocol?._id) return;
    if (hasGenerated.current) return;

    let cancelled = false;

    async function load() {
      try {
        // Check if practices already exist for today
        const existing = await getMovementPractices(protocol!._id);
        if (existing.length > 0) {
          if (!cancelled) {
            setPractices(parsePractices(existing));
            setLoadingPractices(false);
          }
          return;
        }

        hasGenerated.current = true;
        setGenerating(true);

        // Trigger AI and get response directly
        const uid = getUserId() ?? profile?._id;
        const res = await triggerGenerateMovement();

        // Parse AI response
        const parsed = JSON.parse(res.response.results);
        const aiPractices = parsed.practices || [];

        // Create all Movement records in parallel
        await Promise.all(
          aiPractices.map((p: any) =>
            createMovement({
              protocol: protocol!._id,
              practice_id: p.practice_id,
              title: p.title,
              subtitle: p.subtitle,
              duration: p.duration,
              category: p.category,
              exercises_json: JSON.stringify(p.exercises || []),
              why: p.why,
              guidance: p.guidance || "",
            }),
          ),
        );

        // Fetch the saved records
        const saved = await getMovementPractices(protocol!._id);

        if (!cancelled) {
          setPractices(parsePractices(saved));
          setLoadingPractices(false);
          setGenerating(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setLoadingPractices(false);
          setGenerating(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile, protocol?._id]);

  // function parsePractices(raw: any[]): Practice[] {
  //   return raw.map((p) => ({
  //     ...p,
  //     exercises:
  //       typeof p.exercises === "string"
  //         ? JSON.parse(p.exercises || "[]")
  //         : (p.exercises ?? []),
  //   }));
  // }
  function parsePractices(raw: any): Practice[] {
    const arr = Array.isArray(raw) ? raw : Object.values(raw);

    return arr.map((p: any) => ({
      ...p,
      exercises_json:
        typeof p.exercises_json === "string"
          ? JSON.parse(p.exercises_json || "[]")
          : (p.exercises_json ?? []),
    }));
  }
  if (!profile || loading)
    return <LoadingScreen message="Loading movement plan..." />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const aiMove = protocol?.movement ?? "";
  const matched = matchPractice(aiMove, practices);

  const sorted = matched
    ? [matched, ...practices.filter((p) => p._id !== matched._id)]
    : practices;

  return (
    <div className="min-h-full bg-bg pb-24">
      <div className="px-6 pt-6">
        <h1 className="text-4xl font-medium text-primary tracking-tight mb-2">
          Movement
        </h1>
        <p className="font-serif italic text-md text-secondary leading-relaxed">
          {jt === "currently_pregnant"
            ? "Movement that supports you and your baby"
            : jt === "postpartum"
              ? "Gentle restoration and healing movement"
              : "Movement that supports fertility and hormonal balance"}
        </p>
      </div>

      {/* AI today instruction */}
      {aiMove && (
        <div className="px-6 mt-5">
          <div
            className="rounded-3xl p-4.5 flex items-start gap-3.5 p-3"
            style={{
              background:
                "linear-gradient(135deg,rgba(212,176,106,0.12),rgba(180,155,120,0.06))",
              border: "1px solid rgba(212,176,106,0.28)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(212,176,106,0.18)" }}
            >
              <Sparkles size={17} color={GOLD} />
            </div>
            <div className="flex-1">
              <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
                Today's AI recommendation
              </p>
              <p className="text-md font-medium text-primary font-serif italic leading-snug">
                {aiMove}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Avoid today */}
      {protocol?.avoid_today && (
        <div className="px-6 mt-3">
          <div
            className="flex items-start gap-2 px-3.5 py-2.5 rounded-2xl"
            style={{
              background: "rgba(194,107,46,0.07)",
              borderLeft: "2px solid rgba(194,107,46,0.3)",
            }}
          >
            <span className="text-warning text-xs">⚠</span>
            <p className="text-sm leading-snug" style={{ color: "#C26B2E" }}>
              <strong>Avoid today: </strong>
              {protocol.avoid_today}
            </p>
          </div>
        </div>
      )}

      {/* Practice cards */}
      <div className="px-6 mt-5">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          Today's Practices
        </p>

        {loadingPractices ? (
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent spin mx-auto mb-3" />
            <p className="text-base text-muted">
              {generating
                ? "Generating your personalized movement plan…"
                : "Loading practices…"}
            </p>
            <p className="text-2xs text-muted mt-1">
              This takes about 15–20 seconds
            </p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <p className="text-base text-muted">No practices generated yet.</p>
            <p className="text-2xs text-muted mt-1">
              Check back after your protocol refreshes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((p) => {
              const isRec = matched?._id === p._id;
              const color = categoryColor(p.category);
              const bg = categoryBg(p.category);

              return (
                <div
                  key={p._id || p.practice_id}
                  className="bg-card rounded-3xl overflow-hidden p-3"
                  style={{
                    border: isRec
                      ? "1px solid rgba(212,176,106,0.45)"
                      : "1px solid rgba(180,155,120,0.18)",
                  }}
                >
                  <button
                    onClick={() =>
                      setExpanded((e) => (e === p._id ? null : (p._id ?? null)))
                    }
                    className="w-full px-5 py-4.5 bg-transparent border-none cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ background: bg }}
                      >
                        <PracticeIcon category={p.category} color={color} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-lg font-semibold text-primary">
                            {p.title}
                          </h3>
                          {isRec && (
                            <span
                              className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                              style={{ background: "rgba(212,176,106,0.15)" }}
                            >
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-2xs text-muted mb-1.5">
                          {p.subtitle}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock size={11} className="text-muted" />
                          <span className="text-2xs text-muted">
                            {p.duration}
                          </span>
                          <span
                            className="text-2xs font-semibold px-2 py-0.5 rounded-pill"
                            style={{ color, background: bg }}
                          >
                            {p.category}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={17}
                        className="text-muted shrink-0 transition-transform duration-300"
                        style={{
                          transform:
                            expanded === p._id ? "rotate(90deg)" : "none",
                        }}
                      />
                    </div>
                  </button>

                  {expanded === p._id && (
                    <div className="border-t border-border p-5">
                      <div
                        className="px-3.5 py-3 rounded-2xl mb-4.5"
                        style={{
                          background: "rgba(212,176,106,0.07)",
                          borderLeft: "2px solid rgba(212,176,106,0.35)",
                        }}
                      >
                        <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                          Why this matters
                        </p>
                        <p className="text-sm text-secondary leading-relaxed font-serif italic">
                          {p.why}
                        </p>
                      </div>

                      {p.exercises_json.length > 0 && (
                        <>
                          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
                            Sequence
                          </p>
                          <div className="flex flex-col gap-2.5">
                            {p.exercises_json.map((ex, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between px-3.5 py-3 bg-section rounded-xl"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{
                                      background: "rgba(212,176,106,0.15)",
                                    }}
                                  >
                                    <span className="text-2xs text-gold font-bold">
                                      {i + 1}
                                    </span>
                                  </div>
                                  <span className="text-base text-primary font-medium">
                                    {ex.name}
                                  </span>
                                </div>
                                <span className="text-2xs text-muted font-medium">
                                  {ex.sets || ex.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {p.guidance && (
                        <div
                          className="mt-3.5 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                          style={{
                            background: "rgba(194,107,46,0.07)",
                            border: "1px solid rgba(194,107,46,0.15)",
                          }}
                        >
                          <span
                            className="text-xs"
                            style={{ color: "#C26B2E" }}
                          >
                            ⚠
                          </span>
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "#C26B2E" }}
                          >
                            {p.guidance}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
