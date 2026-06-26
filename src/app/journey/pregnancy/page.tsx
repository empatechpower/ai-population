"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { getWeekDetail, createWeekDetail } from "@/lib/data";
import { triggerGenerateWeekDetail } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import { ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";

const GOLD = "#D4B06A";
const SUCCESS = "#1F7A5A";

function getTrimesterMeta(week: number) {
  if (week <= 12)
    return {
      label: "First Trimester",
      range: "Weeks 1–12",
      color: SUCCESS,
      next: "Second trimester begins at week 13",
    };
  if (week <= 26)
    return {
      label: "Second Trimester",
      range: "Weeks 13–26",
      color: GOLD,
      next: "Third trimester begins at week 27",
    };
  return {
    label: "Third Trimester",
    range: "Weeks 27–40",
    color: "#E07B5F",
    next:
      week >= 38
        ? "Birth window — baby is ready"
        : `${40 - week} weeks remaining`,
  };
}

export default function PregnancyPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const router = useRouter();

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

    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  }

  function isValidObject(obj: any) {
    return obj && typeof obj === "object" && Object.keys(obj).length > 0;
  }
  async function loadWeekDetail() {
    if (hasGenerated.current) return; // ✅ prevent double run

    const week = profile!.current_week ?? 0;
    const uid = getUserId() ?? profile!._id;

    try {
      // 1. Check existing
      const existing = await getWeekDetail(week);
      console.log("Existing week detail:", existing);

      if (isValidObject(existing)) {
        setWeekDetail(existing);
        setLoadingDetail(false);
        return;
      }

      // 2. Generate
      hasGenerated.current = true;
      setGenerating(true);

      const res = await triggerGenerateWeekDetail();

      // 3. Parse AI safely
      let parsed;
      try {
        parsed = parseAI(res?.response?.results);
      } catch (e) {
        console.error("Failed to parse week detail:", res?.response?.results);
        throw e;
      }

      // 4. Validate structure (VERY IMPORTANT)
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Invalid AI structure");
      }

      // 5. Create in Bubble
      const id = await createWeekDetail({
        week_number: week,
        trimester: parsed.trimester ?? "",
        baby_milestone: parsed.baby_milestone ?? "",
        nutrition_focus: parsed.nutrition_focus ?? "",
        movement_focus: parsed.movement_focus ?? "",
        supplements: parsed.supplements ?? "",
        appointments: JSON.stringify(parsed.appointments ?? []), // keep only if text field
        avoid_today: parsed.avoid_today ?? "",
        job_note: parsed.job_note ?? "",
      });

      // 6. Set state
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

  if (!profile || loading)
    return <LoadingScreen message="Loading pregnancy protocol…" />;

  const week = profile.current_week ?? 0;
  const trimester = getTrimesterMeta(week);
  const progress = week / 40;

  const trimesters = [
    { label: "First Trimester", range: "Weeks 1–12", start: 1, end: 12 },
    { label: "Second Trimester", range: "Weeks 13–26", start: 13, end: 26 },
    { label: "Third Trimester", range: "Weeks 27–40", start: 27, end: 40 },
  ].map((t) => ({
    ...t,
    status:
      week > t.end ? "completed" : week >= t.start ? "current" : "upcoming",
  }));

  // Parse appointments from JSON string
  function getAppointments(): string[] {
    if (!weekDetail?.appointments) return [];
    try {
      return JSON.parse(weekDetail.appointments);
    } catch {
      return [];
    }
  }

  // Supplements from AI week detail, fallback to protocol
  function getSupplements(): string[] {
    const src = weekDetail?.supplements || protocol?.supplements || "";
    return src
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
  }

  if (loadingDetail) {
    return (
      <div className="min-h-full bg-bg flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent spin" />
        <p className="text-sm text-muted text-center">
          {generating ? `Generating your week ${week} protocol…` : "Loading…"}
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
          {weekDetail?.trimester ?? trimester.label}
        </p>
        <h1 className="text-3xl font-medium text-primary tracking-tight leading-tight mb-2">
          Week {week} Protocol
        </h1>
        <p className="text-sm text-secondary leading-relaxed">
          AI-generated and personalized to your profile, job, and current week.
        </p>
      </div>

      {/* Progress */}
      <div className="px-6 mt-5">
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-1">
                Pregnancy Progress
              </p>
              <p className="text-lg font-semibold text-primary">
                Week {week} of 40
              </p>
              <p
                className="text-xs font-medium mt-0.5"
                style={{ color: trimester.color }}
              >
                {weekDetail?.trimester ?? trimester.label}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold text-primary">
                {Math.round(progress * 100)}%
              </p>
              <p className="text-2xs text-muted">complete</p>
            </div>
          </div>
          <div className="h-1.5 bg-border rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(to right,${SUCCESS},${GOLD})`,
              }}
            />
          </div>
          <p className="text-xs text-muted">{trimester.next}</p>
        </div>
      </div>

      {/* Baby milestone — AI generated */}
      {(weekDetail?.baby_milestone || protocol?.baby_focus) && (
        <div className="px-6 mt-4">
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <div className="flex items-start gap-2.5 mb-3">
              <Sparkles
                size={14}
                color={GOLD}
                className="flex-shrink-0 mt-0.5"
              />
              <p className="text-2xs text-gold uppercase tracking-widest font-semibold">
                Baby at Week {week}
              </p>
            </div>
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {weekDetail?.baby_milestone || protocol?.baby_focus}
            </p>
          </div>
        </div>
      )}

      {/* Job note — AI generated, job-specific insight */}
      {weekDetail?.job_note && (
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
                {weekDetail.job_note}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trimester roadmap */}
      <div className="px-6 mt-5">
        <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
          Trimester Roadmap
        </p>
        <div className="flex flex-col gap-2.5">
          {trimesters.map((t) => {
            const color =
              t.status === "completed"
                ? SUCCESS
                : t.status === "current"
                  ? GOLD
                  : "var(--text-muted)";
            return (
              <div
                key={t.label}
                className="bg-card rounded-[18px] p-4 border"
                style={{
                  borderColor:
                    t.status === "current"
                      ? "rgba(212,176,106,0.45)"
                      : "rgba(180,155,120,0.18)",
                  opacity: t.status === "upcoming" ? 0.6 : 1,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        t.status === "completed"
                          ? `${SUCCESS}15`
                          : t.status === "current"
                            ? "rgba(212,176,106,0.15)"
                            : "var(--section-bg)",
                      border: `2px solid ${color}`,
                    }}
                  >
                    {t.status === "completed" ? (
                      <Check size={14} color={SUCCESS} />
                    ) : (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background:
                            t.status === "current" ? GOLD : "var(--text-muted)",
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary">
                      {t.label}
                    </p>
                    <p className="text-2xs text-muted">{t.range}</p>
                  </div>
                  {t.status === "current" && (
                    <span
                      className="text-2xs font-semibold text-gold px-2 py-0.5 rounded-pill"
                      style={{ background: "rgba(212,176,106,0.15)" }}
                    >
                      Active
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
        {/* Nutrition — AI generated */}
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Nutrition This Week
          </p>
          <p className="text-sm text-secondary leading-relaxed font-serif italic">
            {weekDetail?.nutrition_focus ||
              protocol?.nutrition_plan ||
              "Loading nutrition guidance…"}
          </p>
        </div>

        {/* Supplements — AI generated */}
        {getSupplements().length > 0 && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Supplements for Week {week}
            </p>
            <div className="flex flex-col gap-2">
              {getSupplements().map((s, i) => (
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

        {/* Movement — AI generated */}
        <div className="bg-card rounded-[22px] p-5 border border-border">
          <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-2">
            Movement This Week
          </p>
          <p className="text-sm text-secondary leading-relaxed font-serif italic">
            {weekDetail?.movement_focus ||
              protocol?.movement ||
              "Loading movement guidance…"}
          </p>
        </div>

        {/* Avoid today — AI generated */}
        {(weekDetail?.avoid_today || protocol?.avoid_today) && (
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
                {weekDetail?.avoid_today || protocol?.avoid_today}
              </p>
            </div>
          </div>
        )}

        {/* Appointments — AI generated */}
        {getAppointments().length > 0 && (
          <div className="bg-card rounded-[22px] p-5 border border-border">
            <p className="text-2xs text-muted uppercase tracking-widest font-semibold mb-3">
              Appointments & Checks
            </p>
            <div className="flex flex-col gap-2">
              {getAppointments().map((a, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <ChevronRight
                    size={14}
                    color={GOLD}
                    className="flex-shrink-0 mt-0.5"
                  />
                  <span className="text-sm text-secondary">{a}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regenerate button — for when user updates their week */}
        <button
          onClick={() => {
            hasGenerated.current = false;
            setLoadingDetail(true);
            loadWeekDetail();
          }}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold border cursor-pointer font-sans transition-all"
          style={{
            background: "transparent",
            borderColor: "rgba(212,176,106,0.35)",
            color: GOLD,
          }}
        >
          Regenerate for Week {week}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
