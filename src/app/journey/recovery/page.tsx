"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { getRecoveryDetail, createRecoveryDetail } from "@/lib/data";
import { triggerGenerateRecoveryDetail } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import {
  EarlyBrainDevelopmentBox,
  EveningBreastfeedingBox,
  HospitalBirthBox,
  MotherBabyClosenessBox,
} from "@/components/shared/InfoBoxes";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";
const PURPLE = "#667EEA";

function getRecoveryPhaseMeta(week: number) {
  if (week <= 2)
    return {
      phase: "Immediate Recovery",
      range: "Weeks 1–2",
      color: PURPLE,
      next: "Hormone stabilisation begins at week 3",
    };
  if (week <= 6)
    return {
      phase: "Acute Recovery",
      range: "Weeks 3–6",
      color: "#8E7FE8",
      next: "6-week postnatal check approaching",
    };
  if (week <= 12)
    return {
      phase: "Active Recovery",
      range: "Weeks 7–12",
      color: GOLD,
      next: "Core reconnection phase begins at week 13",
    };
  if (week <= 26)
    return {
      phase: "Rebuilding",
      range: "Weeks 13–26",
      color: SUCCESS,
      next: "Integration and full restoration",
    };
  return {
    phase: "Integration",
    range: "Weeks 27+",
    color: SUCCESS,
    next: "Full postpartum restoration",
  };
}

export default function RecoveryPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const router = useRouter();

  const [detail, setDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [generating, setGenerating] = useState(false);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (!profile || loading) return;
    if (hasGenerated.current) return;
    loadDetail();
  }, [profile, loading]);
  function parseAI(raw: string) {
    if (!raw) throw new Error("Empty AI response");

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }

  function isValidObject(obj: any) {
    return obj && typeof obj === "object" && Object.keys(obj).length > 0;
  }
  async function loadDetail() {
    if (hasGenerated.current) return; // prevent duplicates

    const week = profile!.current_week ?? 0;
    const uid = getUserId() ?? profile!._id;

    try {
      // 1. Check existing
      const existing = await getRecoveryDetail(week);

      if (isValidObject(existing)) {
        setDetail(existing);
        setLoadingDetail(false);
        return;
      }

      // 2. Generate
      hasGenerated.current = true;
      setGenerating(true);

      const res = await triggerGenerateRecoveryDetail();

      // 3. Parse safely (FIXED result → results fallback)
      let parsed;

      try {
        const raw = res?.response?.results ?? res?.response?.result;

        parsed = parseAI(raw);
      } catch (parseErr) {
        console.error("Failed to parse recovery detail:", res?.response);
        throw parseErr;
      }

      // 4. Validate structure
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid AI structure");
      }

      // 5. Create in Bubble
      const id = await createRecoveryDetail({
        week_number: week,
        phase: parsed.phase ?? "",
        hormone_note: parsed.hormone_note ?? "",
        nutrition_focus: parsed.nutrition_focus ?? "",
        movement_focus: parsed.movement_focus ?? "",
        supplements: parsed.supplements ?? "",
        priorities: JSON.stringify(parsed.priorities ?? []),
        checkups: JSON.stringify(parsed.checkups ?? []),
        avoid_today: parsed.avoid_today ?? "",
        job_note: parsed.job_note ?? "",
      });

      // 6. Set state
      setDetail({
        _id: id,
        week_number: week,
        phase: parsed.phase ?? "",
        hormone_note: parsed.hormone_note ?? "",
        nutrition_focus: parsed.nutrition_focus ?? "",
        movement_focus: parsed.movement_focus ?? "",
        supplements: parsed.supplements ?? "",
        priorities: JSON.stringify(parsed.priorities ?? []),
        checkups: JSON.stringify(parsed.checkups ?? []),
        avoid_today: parsed.avoid_today ?? "",
        job_note: parsed.job_note ?? "",
      });
    } catch (err) {
      console.error("loadDetail error:", err);
    } finally {
      setLoadingDetail(false);
      setGenerating(false);
    }
  }

  if (!profile || loading)
    return <LoadingScreen message="Loading recovery protocol…" />;

  const week = profile.current_week ?? 0;
  const phaseMeta = getRecoveryPhaseMeta(week);
  const progress = Math.min(week / 52, 1);

  const phases = [
    { label: "Immediate Recovery", range: "Weeks 1–2", start: 1, end: 2 },
    { label: "Acute Recovery", range: "Weeks 3–6", start: 3, end: 6 },
    { label: "Active Recovery", range: "Weeks 7–12", start: 7, end: 12 },
    { label: "Rebuilding", range: "Weeks 13–26", start: 13, end: 26 },
    { label: "Integration", range: "Weeks 27+", start: 27, end: 99 },
  ].map((p) => ({
    ...p,
    status:
      week > p.end ? "completed" : week >= p.start ? "current" : "upcoming",
  }));

  function safeParseArray(str: string): string[] {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  }

  if (loadingDetail) {
    return (
      <div className="min-h-full bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent spin" />
        <p className="text-sm text-muted text-center">
          {generating
            ? `Generating your week ${week} recovery protocol…`
            : "Loading…"}
        </p>
        {generating && (
          <p className="text-2xs text-muted text-center">
            This takes about 15 seconds
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
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
          After Birth · {detail?.phase ?? phaseMeta.phase}
        </p>
        <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          Week {week} Recovery
        </h1>
        <p className="text-sm text-secondary leading-relaxed">
          AI-generated and personalized to your recovery stage, job, and
          lifestyle.
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mt-5">
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Recovery Progress
              </p>
              <p className="text-lg font-semibold text-primary">
                Week {week} postpartum
              </p>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: phaseMeta.color }}
              >
                {detail?.phase ?? phaseMeta.phase}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-primary">
                {Math.round(progress * 100)}%
              </p>
              <p className="text-2xs text-muted">of year 1</p>
            </div>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(to right,${PURPLE},${GOLD})`,
              }}
            />
          </div>
          <p className="text-xs text-muted">{phaseMeta.next}</p>
        </div>
      </div>

      {/* Job note */}
      {detail?.job_note && (
        <div className="px-6 mt-4">
          <div
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl"
            style={{
              background: "rgba(212,176,106,0.07)",
              borderLeft: "2px solid rgba(212,176,106,0.35)",
            }}
          >
            <Sparkles size={13} color={GOLD} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1">
                Your job this week
              </p>
              <p className="text-sm text-secondary leading-relaxed font-serif italic">
                {detail.job_note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recovery roadmap */}
      <div className="px-6 mt-5">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          Recovery Roadmap
        </p>
        <div className="flex flex-col gap-2.5">
          {phases.map((p) => {
            const color =
              p.status === "completed"
                ? SUCCESS
                : p.status === "current"
                  ? GOLD
                  : "var(--text-muted)";
            return (
              <div
                key={p.label}
                className="bg-card rounded-[18px] p-4 border"
                style={{
                  borderColor:
                    p.status === "current"
                      ? "rgba(212,176,106,0.45)"
                      : "rgba(180,155,120,0.18)",
                  opacity: p.status === "upcoming" ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        p.status === "completed"
                          ? `${SUCCESS}15`
                          : p.status === "current"
                            ? "rgba(212,176,106,0.15)"
                            : "var(--section-bg)",
                      border: `2px solid ${color}`,
                    }}
                  >
                    {p.status === "completed" ? (
                      <Check size={14} color={SUCCESS} />
                    ) : (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            p.status === "current" ? GOLD : "var(--text-muted)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">
                      {p.label}
                    </p>
                    <p className="text-2xs text-muted">{p.range}</p>
                  </div>
                  {p.status === "current" && (
                    <span
                      className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                      style={{ background: "rgba(212,176,106,0.15)" }}
                    >
                      Now
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI content sections */}
      <div className="px-6 mt-5 flex flex-col gap-3">
        {/* Priorities */}
        {safeParseArray(detail?.priorities ?? "[]").length > 0 && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Week {week} Priorities
            </p>
            <div className="flex flex-col gap-2">
              {safeParseArray(detail.priorities).map((p: string, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 px-3.5 py-2.5 bg-section rounded-xl"
                >
                  <ChevronRight
                    size={13}
                    color={GOLD}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-primary leading-snug">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hormone note */}
        {detail?.hormone_note && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
              Hormonal State
            </p>
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {detail.hormone_note}
            </p>
          </div>
        )}

        {/* Nutrition */}
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Nutrition Focus
          </p>
          <p className="text-sm text-secondary leading-relaxed font-serif italic">
            {detail?.nutrition_focus ||
              protocol?.nutrition_plan ||
              "Loading nutrition guidance…"}
          </p>
        </div>

        {/* Supplements */}
        {(detail?.supplements || protocol?.supplements) && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Supplements
            </p>
            <div className="flex flex-col gap-2">
              {(detail?.supplements || protocol?.supplements || "")
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
                .map((s: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 bg-section rounded-xl"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
                    <span className="text-sm text-primary">{s}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Movement */}
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Movement
          </p>
          <p className="text-sm text-secondary leading-relaxed font-serif italic">
            {detail?.movement_focus ||
              protocol?.movement ||
              "Loading movement guidance…"}
          </p>
        </div>

        {/* Avoid */}
        {(detail?.avoid_today || protocol?.avoid_today) && (
          <div
            className="flex items-start gap-2 px-3.5 py-3 rounded-2xl"
            style={{
              background: "rgba(194,107,46,0.07)",
              borderLeft: "2px solid rgba(194,107,46,0.3)",
            }}
          >
            <span className="text-warning text-xs mt-0.5">⚠</span>
            <div>
              <p className="text-2xs text-warning uppercase tracking-widest font-semibold mb-1">
                Avoid This Week
              </p>
              <p className="text-sm leading-snug" style={{ color: "#C26B2E" }}>
                {detail?.avoid_today || protocol?.avoid_today}
              </p>
            </div>
          </div>
        )}

        {/* Checkups */}
        {safeParseArray(detail?.checkups ?? "[]").length > 0 && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Appointments & Checkups
            </p>
            <div className="flex flex-col gap-2">
              {safeParseArray(detail.checkups).map((c: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ChevronRight
                    size={14}
                    color={GOLD}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-secondary">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regenerate */}
        <button
          onClick={() => {
            hasGenerated.current = false;
            setLoadingDetail(true);
            loadDetail();
          }}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold border cursor-pointer font-sans"
          style={{
            background: "transparent",
            borderColor: "rgba(212,176,106,0.35)",
            color: GOLD,
          }}
        >
          Regenerate for Week {week}
        </button>
      </div>
      {/* Info Boxes — postpartum educational content */}
      <div className="px-6 mt-5 flex flex-col gap-4">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold">
          Recovery Knowledge
        </p>
        <EveningBreastfeedingBox />
        <HospitalBirthBox />
        <MotherBabyClosenessBox />
        <EarlyBrainDevelopmentBox />
      </div>

      <BottomNav />
    </div>
  );
}
