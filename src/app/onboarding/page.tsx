"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/store/onboarding";
import { updateProfile } from "@/lib/data";
import { triggerOnboardingComplete } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import { getAllJobTitles, Job, lookupJob } from "@/data/job_index";
import { COUNTRIES } from "@/data/countries";
import { ChevronLeft, ArrowRight, Leaf, Sun, Moon, Check } from "lucide-react";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";

const BG = "#F5F2EC";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";
const TOTAL = 6;

const checks = [
  "Daily AI protocol generated",
  "Biological calendar synced",
  "Partner data integrated",
  "Supplement stack configured",
];

// ── Validation bounds ───────────────────────────────────────────
const AGE_RANGE = { min: 13, max: 60 };
const PARTNER_AGE_RANGE = { min: 13, max: 100 };
const HEIGHT_RANGE = { min: 100, max: 250 }; // cm
const WEIGHT_RANGE = { min: 30, max: 250 }; // kg
const PREGNANCY_WEEK_RANGE = { min: 1, max: 42 };
const POSTPARTUM_WEEK_RANGE = { min: 0, max: 52 };
const PREVIOUS_CHILDREN_RANGE = { min: 0, max: 20 };
const CURRENT_YEAR = new Date().getFullYear();
const CONCEPTION_YEAR_RANGE = { min: CURRENT_YEAR, max: CURRENT_YEAR + 5 };

const ACTIVITY_LEVELS = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
const DIET_TYPES = ["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Gluten-free"];
const TARGET_SEASONS = ["Spring", "Summer", "Fall", "Winter"];
const SUN_EXPOSURE_LEVELS = [
  { label: "Minimal", desc: "Rarely outdoors, mostly indoor lifestyle" },
  { label: "Low", desc: "A few minutes daily, mostly indirect light" },
  { label: "Moderate", desc: "Daily outdoor time, some direct sun" },
  { label: "High", desc: "Extended outdoor time most days" },
  { label: "Very High", desc: "Outdoors most of the day, direct sun" },
];

function parseConceptionTarget(value: string): { season: string; year: string } {
  const parts = value.trim().split(/\s+/);
  const season = TARGET_SEASONS.find((s) => s === parts[0]) ?? "";
  const year = parts[1] && /^\d{4}$/.test(parts[1]) ? parts[1] : "";
  return { season, year };
}

function inRange(value: string, range: { min: number; max: number }): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= range.min && n <= range.max;
}

function inRangeOrEmpty(
  value: string,
  range: { min: number; max: number },
): boolean {
  return value.trim() === "" || inRange(value, range);
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  max,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          color: TEXT_MUTED,
          marginBottom: 8,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{
          width: "100%",
          background: CARD,
          border: `1px solid ${error ? "#E57373" : BORDER}`,
          borderRadius: 12,
          padding: "14px 16px",
          fontSize: 16,
          color: TEXT_PRIMARY,
          outline: "none",
          fontFamily: "inherit",
          boxSizing: "border-box" as const,
        }}
      />
      {error && (
        <p style={{ fontSize: 12, color: "#E57373", marginTop: 6 }}>{error}</p>
      )}
    </div>
  );
}

function RadioCard({
  label,
  description,
  selected,
  onSelect,
  icon,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 14,
        marginBottom: 12,
        background: selected ? "rgba(212,176,106,0.1)" : CARD,
        border: selected ? `1.5px solid ${GOLD}` : `1.5px solid ${BORDER}`,
        cursor: "pointer",
        textAlign: "left" as const,
        transition: "all 0.2s",
      }}
    >
      {icon && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            flexShrink: 0,
            background: selected ? GOLD : "#F5F2EC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: selected ? "#fff" : TEXT_MUTED }}>{icon}</span>
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            lineHeight: 1.3,
          }}
        >
          {label}
        </div>
        {description && (
          <div
            style={{
              fontSize: 13,
              color: TEXT_MUTED,
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {description}
          </div>
        )}
      </div>
      {selected && (
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: GOLD,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Check size={12} color="#fff" />
        </div>
      )}
    </button>
  );
}

function SearchSelectField({
  label,
  search,
  onSearchChange,
  suggestions,
  onPick,
  onReconcile,
}: {
  label: string;
  search: string;
  onSearchChange: (v: string) => void;
  suggestions: string[];
  onPick: (value: string) => void;
  onReconcile: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const filtered = suggestions
    .filter((s) => s.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  return (
    <div className="relative" style={{ marginBottom: 20 }}>
      <Input
        label={label}
        placeholder="Type to search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onReconcile();
        }}
      />
      {focused && filtered.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-border rounded-xl mt-1 shadow-sm max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <button
              key={item}
              className="w-full text-left px-4 py-2.5 text-sm text-charcoal hover:bg-gold-light transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(item);
                setFocused(false);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  const pct = (step / TOTAL) * 100;
  return (
    <>
      {/* Progress bar */}
      <div
        style={{ height: 2, background: "rgba(0,0,0,0.06)", marginBottom: 0 }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: GOLD,
            transition: "width 0.3s",
          }}
        />
      </div>
      {/* Back */}
      {step > 1 && (
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "16px 24px 0",
            color: TEXT_MUTED,
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
      )}
    </>
  );
}

function ContinueBtn({
  onClick,
  disabled = false,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? "rgba(212,176,106,0.4)" : GOLD,
        color: "#fff",
        border: "none",
        borderRadius: 14,
        padding: "16px",
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {label} <ArrowRight size={18} />
    </button>
  );
}
// const allFemaleJobs = getAllJobTitles("female");
export default function OnboardingPage() {
  const router = useRouter();
  const { data, setField } = useOnboarding();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // const { data, setField } = useOnboarding();
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    checks.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), 600 + i * 400);
    });
  }, []);
  const [search, setSearch] = useState(data.job_type);
  const [mSearch, setmSearch] = useState(data.partners_job_type);
  const [natSearch, setNatSearch] = useState(data.nationality);
  const [countrySearch, setCountrySearch] = useState(data.country);

  const [allFemaleJobs, setAllFemaleJobs] = useState<string[]>(() =>
    getAllJobTitles("female"),
  );
  useEffect(() => {
    import("@/lib/datasets").then(({ getAllJobTitlesDynamic }) =>
      getAllJobTitlesDynamic("female")
        .then(setAllFemaleJobs)
        .catch(() => {}),
    );
  }, []);
  const [allMaleJobs, setAllMaleJobs] = useState<string[]>(() =>
    getAllJobTitles("male"),
  );
  useEffect(() => {
    import("@/lib/datasets").then(({ getAllJobTitlesDynamic }) =>
      getAllJobTitlesDynamic("male")
        .then(setAllMaleJobs)
        .catch(() => {}),
    );
  }, []);

  const initialConceptionTarget = parseConceptionTarget(data.target_conception_season);
  const [conceptionSeason, setConceptionSeason] = useState(initialConceptionTarget.season);
  const [conceptionYear, setConceptionYear] = useState(
    initialConceptionTarget.year || String(CURRENT_YEAR),
  );

  function updateConceptionTarget(season: string, year: string) {
    setConceptionSeason(season);
    setConceptionYear(year);
    setField("target_conception_season", season && year ? `${season} ${year}` : season);
  }

  // Reconciles free-typed search text against a fixed list on blur, so the
  // visible text can never drift out of sync with the stored field value.
  function reconcileSearch(
    list: string[],
    searchVal: string,
    setSearchVal: (v: string) => void,
    setStoredField: (v: string) => void,
    confirmedValue: string,
  ) {
    const trimmed = searchVal.trim();
    if (trimmed === "") {
      setStoredField("");
      return;
    }
    const match = list.find((j) => j.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      setStoredField(match);
      setSearchVal(match);
    } else {
      // No exact match — discard the unconfirmed text
      setSearchVal(confirmedValue);
    }
  }

  function next() {
    setStep((s) => Math.min(s + 1, TOTAL + 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleComplete() {
    setSaving(true);
    setSaveError("");
    function joinOrEmpty(arr: string[] | undefined | null): string {
      if (!arr || arr.length === 0) return "";
      return arr.join(", ");
    }

    // Reads whichever fertility_impact keys are present on a male job
    function getMaleImpact(job: Job | null) {
      const fi = job?.fertility_impact;
      if (!fi) return { sperm: "", hormones: "", baby: "" };
      return {
        sperm: [fi.sperm, fi.dna, fi.brain].filter(Boolean).join(". "),
        hormones: fi.hormones ?? "",
        baby: fi.baby_impact ?? fi.baby ?? "",
      };
    }
    // const femaleJob = lookupJob(data.job_type, "female");
    // const maleJob = lookupJob(data.partners_job_type, "male");
    // const maleImpact = getMaleImpact(maleJob);
    const { lookupJobDynamic } = await import("@/lib/datasets");
    const femaleJob =
      (await lookupJobDynamic(data.job_type, "female")) ??
      lookupJob(data.job_type, "female");
    const maleJob =
      (await lookupJobDynamic(data.partners_job_type, "male")) ??
      lookupJob(data.partners_job_type, "male");
    const maleImpact = getMaleImpact(maleJob);
    try {
      await updateProfile({
        first_name: data.first_name,
        age: Number(data.age) || 0,
        height: Number(data.height) || 0,
        weight: Number(data.weight) || 0,
        journey_type: data.journey_type,
        target_conception_season: data.target_conception_season,
        previous_children: Number(data.previous_children) || 0,
        nationality: data.nationality,
        country: data.country,
        city: data.city,
        job_type: data.job_type,
        activity_level: data.activity_level,
        diet_type: data.diet_type,
        sun_exposure: data.sun_exposure,
        partner_age: Number(data.partner_age) || 0,
        partner_job_type: data.partners_job_type,
        partner_activity: data.partner_activity,
        partner_diet: data.partner_diet,
        skin_type: data.skin_type,
        onboarding_done: true,
        female_job_risks: joinOrEmpty(femaleJob?.common_risks),
        female_nutrients: joinOrEmpty(femaleJob?.nutrient_risks),

        // Male jobs have all fields
        male_job_risks: joinOrEmpty(maleJob?.common_risks),
        male_nutrients: joinOrEmpty(maleJob?.nutrient_risks),
        male_foods: joinOrEmpty(maleJob?.recommended_foods),
        male_supplements: joinOrEmpty(maleJob?.supplements),
        male_sperm_impact: maleImpact.sperm,
        male_hormone_impact: maleImpact.hormones,
        baby_impact: maleImpact.baby,
        current_week: Number(data.current_week) || 0,
      });

      const uid = getUserId();
      if (uid) await triggerOnboardingComplete(uid);
      setSaving(false);
      next();
    } catch (e) {
      console.error(e);
      setSaving(false);
      const detail = e instanceof Error ? e.message : String(e);
      setSaveError(
        `We couldn't save your profile. Please check your connection and try again. (${detail})`,
      );
    }
  }

  // Step 7 = complete
  if (step === TOTAL + 1) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: BG,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 24,
            background: "rgba(212,176,106,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Check size={36} color={GOLD} />
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            textAlign: "center",
            letterSpacing: "-0.02em",
            marginBottom: 12,
          }}
        >
          You're all set
        </h1>
        <p
          style={{
            fontSize: 16,
            color: TEXT_SECONDARY,
            textAlign: "center",
            lineHeight: 1.7,
            marginBottom: 32,
            maxWidth: 300,
          }}
        >
          Your personalized protocol is being generated. This takes about 30
          seconds.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: GOLD,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px 40px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          Enter your dashboard <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  const wrap = (children: React.ReactNode) => (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <StepHeader step={step} onBack={back} />
      <div
        style={{
          flex: 1,
          padding: "28px 24px 32px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );

  // Step 1 — Journey type
  if (step === 1)
    return wrap(
      <>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: GOLD,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Step 1 of {TOTAL}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Where are you
            <br />
            on your journey?
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            This shapes everything — your protocols, nutrition, and guidance are
            built around your stage.
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <RadioCard
            label="Trying to conceive"
            description="Optimizing fertility and preparing for conception"
            selected={data.journey_type === "trying_to_conceive"}
            onSelect={() => setField("journey_type", "trying_to_conceive")}
            icon={<Leaf size={18} />}
          />
          <RadioCard
            label="Currently pregnant"
            description="Week-by-week pregnancy optimization"
            selected={data.journey_type === "currently_pregnant"}
            onSelect={() => setField("journey_type", "currently_pregnant")}
            icon={<Sun size={18} />}
          />
          <RadioCard
            label="Postpartum recovery"
            description="Restoration and recovery after birth"
            selected={data.journey_type === "postpartum"}
            onSelect={() => setField("journey_type", "postpartum")}
            icon={<Moon size={18} />}
          />
        </div>
        <ContinueBtn onClick={next} disabled={!data.journey_type} />
      </>,
    );

  // Step 2 — Timeline
  if (step === 2) {
    const weekRange =
      data.journey_type === "currently_pregnant"
        ? PREGNANCY_WEEK_RANGE
        : POSTPARTUM_WEEK_RANGE;
    return wrap(
      <>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: GOLD,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Step 2 of {TOTAL}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Let's map your
            <br />
            timeline
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Understanding your timeline helps us calibrate your AI protocol with
            seasonal and biological adjustments.
          </p>
        </div>
        <div style={{ flex: 1 }}>
          {data.journey_type === "currently_pregnant" ||
          data.journey_type === "postpartum" ? (
            <InputField
              label={
                data.journey_type === "currently_pregnant"
                  ? "Current week of pregnancy"
                  : "Weeks since delivery"
              }
              value={data.current_week}
              onChange={(v) => setField("current_week", v)}
              type="number"
              min={weekRange.min}
              max={weekRange.max}
              placeholder={
                data.journey_type === "currently_pregnant"
                  ? "e.g. 15"
                  : "e.g. 8"
              }
              error={
                data.current_week && !inRange(data.current_week, weekRange)
                  ? `Enter a number between ${weekRange.min} and ${weekRange.max}`
                  : undefined
              }
            />
          ) : (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: TEXT_MUTED,
                  marginBottom: 8,
                  fontWeight: 500,
                }}
              >
                Target conception season
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {TARGET_SEASONS.map((season) => {
                  const selected = conceptionSeason === season;
                  return (
                    <button
                      key={season}
                      onClick={() => updateConceptionTarget(season, conceptionYear)}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 12,
                        textAlign: "center" as const,
                        background: selected ? "rgba(212,176,106,0.1)" : CARD,
                        border: selected ? `1.5px solid ${GOLD}` : `1.5px solid ${BORDER}`,
                        color: selected ? GOLD : TEXT_PRIMARY,
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {season}
                    </button>
                  );
                })}
              </div>
              <InputField
                label="Target year"
                value={conceptionYear}
                onChange={(v) => updateConceptionTarget(conceptionSeason, v)}
                type="number"
                min={CONCEPTION_YEAR_RANGE.min}
                max={CONCEPTION_YEAR_RANGE.max}
                placeholder={String(CURRENT_YEAR)}
                error={
                  conceptionYear && !inRange(conceptionYear, CONCEPTION_YEAR_RANGE)
                    ? `Enter a year between ${CONCEPTION_YEAR_RANGE.min} and ${CONCEPTION_YEAR_RANGE.max}`
                    : undefined
                }
              />
            </div>
          )}
          <InputField
            label="Number of previous children"
            value={data.previous_children}
            onChange={(v) => setField("previous_children", v)}
            type="number"
            min={PREVIOUS_CHILDREN_RANGE.min}
            max={PREVIOUS_CHILDREN_RANGE.max}
            error={
              data.previous_children &&
              !inRangeOrEmpty(data.previous_children, PREVIOUS_CHILDREN_RANGE)
                ? `Enter a number between ${PREVIOUS_CHILDREN_RANGE.min} and ${PREVIOUS_CHILDREN_RANGE.max}`
                : undefined
            }
            placeholder="0"
          />
        </div>
        <ContinueBtn
          onClick={next}
          disabled={
            (data.journey_type === "currently_pregnant" ||
            data.journey_type === "postpartum"
              ? !inRange(data.current_week, weekRange)
              : !conceptionSeason || !inRange(conceptionYear, CONCEPTION_YEAR_RANGE)) ||
            !inRangeOrEmpty(data.previous_children, PREVIOUS_CHILDREN_RANGE)
          }
        />
      </>,
    );
  }

  // Step 3 — About you
  if (step === 3)
    return wrap(
      <>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: GOLD,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Step 3 of {TOTAL}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            About you
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Your biological and physical profile shapes your personalized
            recommendations.
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <InputField
            label="First name"
            value={data.first_name}
            onChange={(v) => setField("first_name", v)}
            placeholder="Your first name"
          />
          <InputField
            label="Age"
            value={data.age}
            onChange={(v) => setField("age", v)}
            type="number"
            min={AGE_RANGE.min}
            max={AGE_RANGE.max}
            placeholder="e.g. 29"
            error={
              data.age && !inRange(data.age, AGE_RANGE)
                ? `Enter an age between ${AGE_RANGE.min} and ${AGE_RANGE.max}`
                : undefined
            }
          />
          <InputField
            label="Height (cm)"
            value={data.height}
            onChange={(v) => setField("height", v)}
            type="number"
            min={HEIGHT_RANGE.min}
            max={HEIGHT_RANGE.max}
            placeholder="e.g. 165"
            error={
              data.height && !inRangeOrEmpty(data.height, HEIGHT_RANGE)
                ? `Enter a height between ${HEIGHT_RANGE.min} and ${HEIGHT_RANGE.max} cm`
                : undefined
            }
          />
          <InputField
            label="Weight (kg)"
            value={data.weight}
            onChange={(v) => setField("weight", v)}
            type="number"
            min={WEIGHT_RANGE.min}
            max={WEIGHT_RANGE.max}
            placeholder="e.g. 63"
            error={
              data.weight && !inRangeOrEmpty(data.weight, WEIGHT_RANGE)
                ? `Enter a weight between ${WEIGHT_RANGE.min} and ${WEIGHT_RANGE.max} kg`
                : undefined
            }
          />
          <SearchSelectField
            label="Nationality"
            search={natSearch}
            onSearchChange={setNatSearch}
            suggestions={COUNTRIES}
            onPick={(country) => {
              setField("nationality", country);
              setNatSearch(country);
            }}
            onReconcile={() =>
              reconcileSearch(COUNTRIES, natSearch, setNatSearch, (v) => setField("nationality", v), data.nationality)
            }
          />
        </div>
        <ContinueBtn
          onClick={next}
          disabled={
            !data.first_name.trim() ||
            !inRange(data.age, AGE_RANGE) ||
            !inRangeOrEmpty(data.height, HEIGHT_RANGE) ||
            !inRangeOrEmpty(data.weight, WEIGHT_RANGE)
          }
        />
      </>,
    );

  // Step 4 — Environment / lifestyle
  if (step === 4)
    return wrap(
      <>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: GOLD,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Step 4 of {TOTAL}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Your lifestyle
            <br />& environment
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Where you live and how you live directly influences your hormonal
            environment.
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <InputField
            label="City"
            value={data.city}
            onChange={(v) => setField("city", v)}
            placeholder="e.g. Zurich"
          />
          <div style={{ marginBottom: 20 }}>
            <label className="text-2xs text-muted uppercase tracking-widest font-medium block mb-2">
              Skin Type
            </label>
            {[
              {
                value: "1",
                label: "Very Fair",
                desc: "Always burns, never tans",
              },
              {
                value: "2",
                label: "Fair",
                desc: "Burns easily, tans minimally",
              },
              {
                value: "3",
                label: "Medium",
                desc: "Sometimes burns, gradually tans",
              },
              { value: "4", label: "Olive", desc: "Rarely burns, tans well" },
              { value: "5", label: "Brown", desc: "Very rarely burns" },
              { value: "6", label: "Dark Brown", desc: "Almost never burns" },
              {
                value: "7",
                label: "Very Dark",
                desc: "Extremely high melanin",
              },
            ].map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.label}
                description={opt.desc}
                selected={data.skin_type === opt.value}
                onSelect={() => setField("skin_type", opt.value)}
              />
            ))}
          </div>
          <SearchSelectField
            label="Country"
            search={countrySearch}
            onSearchChange={setCountrySearch}
            suggestions={COUNTRIES}
            onPick={(country) => {
              setField("country", country);
              setCountrySearch(country);
            }}
            onReconcile={() =>
              reconcileSearch(COUNTRIES, countrySearch, setCountrySearch, (v) => setField("country", v), data.country)
            }
          />
          <SearchSelectField
            label="Your Job"
            search={search}
            onSearchChange={setSearch}
            suggestions={allFemaleJobs}
            onPick={(job) => {
              setField("job_type", job);
              setSearch(job);
            }}
            onReconcile={() =>
              reconcileSearch(allFemaleJobs, search, setSearch, (v) => setField("job_type", v), data.job_type)
            }
          />
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: TEXT_MUTED,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Activity Level
            </label>
            {ACTIVITY_LEVELS.map((level) => (
              <RadioCard
                key={level}
                label={level}
                selected={data.activity_level === level}
                onSelect={() => setField("activity_level", level)}
              />
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: TEXT_MUTED,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Diet Type
            </label>
            {DIET_TYPES.map((d) => (
              <RadioCard
                key={d}
                label={d}
                selected={data.diet_type === d}
                onSelect={() => setField("diet_type", d)}
              />
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: TEXT_MUTED,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Sun Exposure
            </label>
            {SUN_EXPOSURE_LEVELS.map((opt) => (
              <RadioCard
                key={opt.label}
                label={opt.label}
                description={opt.desc}
                selected={data.sun_exposure === opt.label}
                onSelect={() => setField("sun_exposure", opt.label)}
              />
            ))}
          </div>
        </div>
        <ContinueBtn onClick={next} disabled={!data.city.trim()} />
      </>,
    );

  // Step 5 — Partner
  if (step === 5)
    return wrap(
      <>
        <div style={{ marginBottom: 32 }}>
          <p
            style={{
              fontSize: 12,
              color: GOLD,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Step 5 of {TOTAL}
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: 8,
            }}
          >
            Your partner
            <br />
            (optional)
          </h1>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.6 }}>
            Partner health accounts for 40% of fertility outcomes. Including
            this unlocks partner optimization.
          </p>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <InputField
            label="Partner age"
            value={data.partner_age}
            onChange={(v) => setField("partner_age", v)}
            type="number"
            min={PARTNER_AGE_RANGE.min}
            max={PARTNER_AGE_RANGE.max}
            placeholder="e.g. 32"
            error={
              data.partner_age &&
              !inRangeOrEmpty(data.partner_age, PARTNER_AGE_RANGE)
                ? `Enter an age between ${PARTNER_AGE_RANGE.min} and ${PARTNER_AGE_RANGE.max}`
                : undefined
            }
          />
          <SearchSelectField
            label="Partner Job"
            search={mSearch}
            onSearchChange={setmSearch}
            suggestions={allMaleJobs}
            onPick={(job) => {
              setField("partners_job_type", job);
              setmSearch(job);
            }}
            onReconcile={() =>
              reconcileSearch(
                allMaleJobs,
                mSearch,
                setmSearch,
                (v) => setField("partners_job_type", v),
                data.partners_job_type,
              )
            }
          />
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: TEXT_MUTED,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Partner Diet Type
            </label>
            {DIET_TYPES.map((d) => (
              <RadioCard
                key={d}
                label={d}
                selected={data.partner_diet === d}
                onSelect={() => setField("partner_diet", d)}
              />
            ))}
          </div>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: TEXT_MUTED,
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Partner Activity Level
            </label>
            {ACTIVITY_LEVELS.map((level) => (
              <RadioCard
                key={level}
                label={level}
                selected={data.partner_activity === level}
                onSelect={() => setField("partner_activity", level)}
              />
            ))}
          </div>
        </div>
        {saveError && (
          <p
            style={{
              fontSize: 13,
              color: "#E57373",
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            {saveError}
          </p>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleComplete}
            disabled={saving}
            style={{
              flex: 1,
              background: "none",
              border: `1.5px solid ${BORDER}`,
              borderRadius: 14,
              padding: "16px",
              fontSize: 15,
              fontWeight: 500,
              color: TEXT_SECONDARY,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Skip for now
          </button>
          <div style={{ flex: 2 }}>
            <ContinueBtn
              onClick={handleComplete}
              disabled={saving}
              label={saving ? "Saving…" : "Complete"}
            />
          </div>
        </div>
      </>,
    );
  if (step === 6)
    return wrap(
      <div className="flex flex-col min-h-screen px-6 pt-20 pb-10 items-center text-center">
        {/* Gold ring icon */}
        <div
          className="w-20 h-20 rounded-full bg-gold-light border-2 border-gold flex items-center justify-center mb-8 fade-up"
          style={{ animation: "pulse-ring 2s ease-in-out infinite" }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="2"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <span className="text-xs text-gold uppercase tracking-widest font-medium mb-3 fade-up-1">
          AI Pregnancy Optimized
        </span>

        <h2 className="font-serif text-3xl text-charcoal mb-3 fade-up-2">
          System Calibrated,
          <br />
          Welcome
        </h2>

        <p className="text-sm text-muted mb-10 leading-relaxed fade-up-3">
          Your personalized optimization protocol is ready. We're in this
          together.
        </p>

        {/* Checklist */}
        <div className="w-full flex flex-col gap-3 mb-auto">
          {checks.map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-3 transition-all duration-500 ${
                visible.includes(i)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  visible.includes(i) ? "bg-gold" : "bg-border"
                }`}
              >
                {visible.includes(i) && (
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-charcoal text-left">{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-10 w-full">
          <Button fullWidth onClick={() => router.push("/dashboard")}>
            Enter Dashboard →
          </Button>
        </div>
      </div>,
    );

  // Step 6 — Complete (never shown; redirect happens in handleComplete)
  return wrap(<div />);
}
