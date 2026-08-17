import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, Leaf, Sun, Moon, Check } from "lucide-react-native";

import { auth } from "@/lib/firebase";
import { useOnboarding } from "@/store/onboarding";
import { updateProfile } from "@/lib/data";
import { triggerOnboardingComplete } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import { getAllJobTitles, Job, lookupJob } from "@/data/job_index";
import { COUNTRIES } from "@/data/countries";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import RadioCard from "@/components/shared/RadioCard";

const TOTAL = 5;

const CHECKS = [
  "Daily AI protocol generated",
  "Biological calendar synced",
  "Partner data integrated",
  "Supplement stack configured",
];

const AGE_RANGE = { min: 13, max: 60 };
const PARTNER_AGE_RANGE = { min: 13, max: 100 };
const HEIGHT_RANGE = { min: 100, max: 250 };
const WEIGHT_RANGE = { min: 30, max: 250 };
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

function toNumber(value: string): number {
  return Number(value.trim().replace(",", "."));
}

function parseConceptionTarget(value: string): { season: string; year: string } {
  const parts = value.trim().split(/\s+/);
  const season = TARGET_SEASONS.find((s) => s === parts[0]) ?? "";
  const year = parts[1] && /^\d{4}$/.test(parts[1]) ? parts[1] : "";
  return { season, year };
}

function inRange(value: string, range: { min: number; max: number }): boolean {
  if (value.trim() === "") return false;
  const n = toNumber(value);
  return Number.isFinite(n) && n >= range.min && n <= range.max;
}

function inRangeOrEmpty(value: string, range: { min: number; max: number }): boolean {
  return value.trim() === "" || inRange(value, range);
}

function StepHeader({ step, onBack }: { step: number; onBack: () => void }) {
  const pct = (step / TOTAL) * 100;
  return (
    <>
      <View className="h-0.5 bg-black/[0.06]">
        <View className="h-full bg-gold" style={{ width: `${pct}%` }} />
      </View>
      {step > 1 && (
        <Pressable onPress={onBack} className="flex-row items-center gap-1 px-6 pt-4">
          <ChevronLeft size={18} color="#9A9094" />
          <Text className="text-muted text-sm">Back</Text>
        </Pressable>
      )}
    </>
  );
}

function StepTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <View className="mb-8">
      <Text className="text-xs text-gold tracking-widest font-semibold uppercase mb-2">
        {eyebrow}
      </Text>
      <Text className="font-serif text-[28px] text-charcoal leading-8 mb-2">{title}</Text>
      <Text className="text-[15px] text-secondary leading-6">{subtitle}</Text>
    </View>
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
    .filter((j) => j.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);

  return (
    <View className="mb-5">
      <Input
        label={label}
        placeholder="Type to search..."
        value={search}
        onChangeText={onSearchChange}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onReconcile();
        }}
      />
      {focused && filtered.length > 0 && (
        <View className="bg-white border border-border rounded-xl -mt-3 mb-2 max-h-48 overflow-hidden">
          <ScrollView keyboardShouldPersistTaps="handled">
            {filtered.map((item) => (
              <Pressable
                key={item}
                onPress={() => onPick(item)}
                className="px-4 py-2.5 border-b border-border/50"
              >
                <Text className="text-sm text-charcoal">{item}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// Full 6-step wizard ported from the web app's src/app/onboarding/page.tsx.
export default function OnboardingScreen() {
  const { data, setField } = useOnboarding();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [visible, setVisible] = useState<number[]>([]);

  // Onboarding is only reachable by a logged-in, verified user — anyone else
  // gets bounced to the auth screen or the verification gate. authChecked
  // holds the wizard off-screen until the first auth check resolves.
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      if (!user.emailVerified) {
        router.replace("/verify-email");
        return;
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (step !== TOTAL + 1) return;
    const timers = CHECKS.map((_, i) =>
      setTimeout(() => setVisible((v) => [...v, i]), 600 + i * 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const [search, setSearch] = useState(data.job_type);
  const [mSearch, setMSearch] = useState(data.partners_job_type);
  const [natSearch, setNatSearch] = useState(data.nationality);
  const [countrySearch, setCountrySearch] = useState(data.country);
  const [allFemaleJobs, setAllFemaleJobs] = useState<string[]>(() => getAllJobTitles("female"));
  const [allMaleJobs, setAllMaleJobs] = useState<string[]>(() => getAllJobTitles("male"));

  const initialConceptionTarget = parseConceptionTarget(data.target_conception_season);
  const [conceptionSeason, setConceptionSeason] = useState(initialConceptionTarget.season);
  const [conceptionYear, setConceptionYear] = useState(
    initialConceptionTarget.year || String(CURRENT_YEAR),
  );

  useEffect(() => {
    import("@/lib/datasets").then(({ getAllJobTitlesDynamic }) => {
      getAllJobTitlesDynamic("female").then(setAllFemaleJobs).catch(() => {});
      getAllJobTitlesDynamic("male").then(setAllMaleJobs).catch(() => {});
    });
  }, []);

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
      setSearchVal(confirmedValue);
    }
  }

  function updateConceptionTarget(season: string, year: string) {
    setConceptionSeason(season);
    setConceptionYear(year);
    setField("target_conception_season", season && year ? `${season} ${year}` : season);
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

    function getMaleImpact(job: Job | null) {
      const fi = job?.fertility_impact;
      if (!fi) return { sperm: "", hormones: "", baby: "" };
      return {
        sperm: [fi.sperm, fi.dna, fi.brain].filter(Boolean).join(". "),
        hormones: fi.hormones ?? "",
        baby: fi.baby_impact ?? fi.baby ?? "",
      };
    }

    try {
      const { lookupJobDynamic } = await import("@/lib/datasets");
      const femaleJob =
        (await lookupJobDynamic(data.job_type, "female")) ?? lookupJob(data.job_type, "female");
      const maleJob =
        (await lookupJobDynamic(data.partners_job_type, "male")) ??
        lookupJob(data.partners_job_type, "male");
      const maleImpact = getMaleImpact(maleJob as unknown as Job | null);

      await updateProfile({
        first_name: data.first_name.trim(),
        age: toNumber(data.age) || 0,
        height: toNumber(data.height) || 0,
        weight: toNumber(data.weight) || 0,
        journey_type: data.journey_type,
        target_conception_season: data.target_conception_season.trim(),
        previous_children: toNumber(data.previous_children) || 0,
        nationality: data.nationality.trim(),
        country: data.country.trim(),
        city: data.city.trim(),
        job_type: data.job_type,
        activity_level: data.activity_level,
        diet_type: data.diet_type,
        sun_exposure: data.sun_exposure.trim(),
        partner_age: toNumber(data.partner_age) || 0,
        partner_job_type: data.partners_job_type,
        partner_activity: data.partner_activity,
        partner_diet: data.partner_diet,
        skin_type: data.skin_type,
        onboarding_done: true,
        female_job_risks: joinOrEmpty(femaleJob?.common_risks),
        female_nutrients: joinOrEmpty(femaleJob?.nutrient_risks),
        male_job_risks: joinOrEmpty(maleJob?.common_risks),
        male_nutrients: joinOrEmpty(maleJob?.nutrient_risks),
        male_foods: joinOrEmpty(maleJob?.recommended_foods),
        male_supplements: joinOrEmpty(maleJob?.supplements),
        male_sperm_impact: maleImpact.sperm,
        male_hormone_impact: maleImpact.hormones,
        baby_impact: maleImpact.baby,
        current_week: toNumber(data.current_week) || 0,
      });

      const uid = getUserId();
      if (uid) await triggerOnboardingComplete(uid);
      setSaving(false);
      next();
    } catch (e) {
      console.error(e);
      setSaving(false);
      const detail = e instanceof Error ? e.message : String(e);
      setSaveError(`We couldn't save your profile. Please check your connection and try again. (${detail})`);
    }
  }

  if (!authChecked) return <View className="flex-1 bg-bg" />;

  // Step 7 — Calibrated / complete
  if (step === TOTAL + 1) {
    return (
      <View className="flex-1 bg-bg items-center px-6 pt-20 pb-10">
        <View className="w-20 h-20 rounded-full bg-gold-light border-2 border-gold items-center justify-center mb-8">
          <Check size={32} color="#C9A84C" />
        </View>
        <Text className="text-xs text-gold uppercase tracking-widest font-medium mb-3">
          AI Pregnancy Optimized
        </Text>
        <Text className="font-serif text-3xl text-charcoal text-center leading-9 mb-3">
          System Calibrated,{"\n"}Welcome
        </Text>
        <Text className="text-sm text-muted text-center leading-6 mb-10">
          Your personalized optimization protocol is ready. We're in this together.
        </Text>

        <View className="w-full gap-3 flex-1">
          {CHECKS.map((item, i) => (
            <View key={item} className="flex-row items-center gap-3" style={{ opacity: visible.includes(i) ? 1 : 0 }}>
              <View
                className={`w-5 h-5 rounded-full items-center justify-center ${
                  visible.includes(i) ? "bg-gold" : "bg-border"
                }`}
              >
                {visible.includes(i) && <Check size={10} color="#fff" />}
              </View>
              <Text className="text-sm text-charcoal">{item}</Text>
            </View>
          ))}
        </View>

        <View className="w-full mt-10">
          <Button fullWidth onPress={() => router.replace("/(tabs)")}>
            Enter Dashboard →
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StepHeader step={step} onBack={back} />
      <ScrollView contentContainerClassName="flex-grow px-6 pt-7 pb-8" keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <>
            <StepTitle
              eyebrow={`Step 1 of ${TOTAL}`}
              title="Where are you on your journey?"
              subtitle="This shapes everything — your protocols, nutrition, and guidance are built around your stage."
            />
            <View className="flex-1">
              <RadioCard
                label="Trying to conceive"
                description="Optimizing fertility and preparing for conception"
                selected={data.journey_type === "trying_to_conceive"}
                onSelect={() => setField("journey_type", "trying_to_conceive")}
                icon={<Leaf size={18} color={data.journey_type === "trying_to_conceive" ? "#fff" : "#9A9094"} />}
              />
              <RadioCard
                label="Currently pregnant"
                description="Week-by-week pregnancy optimization"
                selected={data.journey_type === "currently_pregnant"}
                onSelect={() => setField("journey_type", "currently_pregnant")}
                icon={<Sun size={18} color={data.journey_type === "currently_pregnant" ? "#fff" : "#9A9094"} />}
              />
              <RadioCard
                label="Postpartum recovery"
                description="Restoration and recovery after birth"
                selected={data.journey_type === "postpartum"}
                onSelect={() => setField("journey_type", "postpartum")}
                icon={<Moon size={18} color={data.journey_type === "postpartum" ? "#fff" : "#9A9094"} />}
              />
            </View>
            <View className="mt-8">
              <Button fullWidth disabled={!data.journey_type} onPress={next}>
                Continue
              </Button>
            </View>
          </>
        )}

        {step === 2 &&
          (() => {
            const weekRange =
              data.journey_type === "currently_pregnant" ? PREGNANCY_WEEK_RANGE : POSTPARTUM_WEEK_RANGE;
            const disabled =
              (data.journey_type === "currently_pregnant" || data.journey_type === "postpartum"
                ? !inRange(data.current_week, weekRange)
                : !conceptionSeason || !inRange(conceptionYear, CONCEPTION_YEAR_RANGE)) ||
              !inRangeOrEmpty(data.previous_children, PREVIOUS_CHILDREN_RANGE);
            return (
              <>
                <StepTitle
                  eyebrow={`Step 2 of ${TOTAL}`}
                  title="Let's map your timeline"
                  subtitle="Understanding your timeline helps us calibrate your AI protocol with seasonal and biological adjustments."
                />
                {data.journey_type === "currently_pregnant" || data.journey_type === "postpartum" ? (
                  <Input
                    label={
                      data.journey_type === "currently_pregnant"
                        ? "Current week of pregnancy"
                        : "Weeks since delivery"
                    }
                    value={data.current_week}
                    onChangeText={(v) => setField("current_week", v)}
                    keyboardType="number-pad"
                    placeholder={data.journey_type === "currently_pregnant" ? "e.g. 15" : "e.g. 8"}
                    error={
                      data.current_week && !inRange(data.current_week, weekRange)
                        ? `Enter a number between ${weekRange.min} and ${weekRange.max}`
                        : undefined
                    }
                  />
                ) : (
                  <>
                    <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2">
                      Target conception season
                    </Text>
                    <View className="flex-row gap-2 mb-5">
                      {TARGET_SEASONS.map((season) => {
                        const selected = conceptionSeason === season;
                        return (
                          <Pressable
                            key={season}
                            onPress={() => updateConceptionTarget(season, conceptionYear)}
                            className="flex-1 py-3 rounded-xl items-center border"
                            style={{
                              backgroundColor: selected ? "rgba(212,176,106,0.1)" : "#fff",
                              borderColor: selected ? "#D4B06A" : "rgba(180,155,120,0.18)",
                              borderWidth: selected ? 1.5 : 1,
                            }}
                          >
                            <Text
                              className="text-sm font-medium"
                              style={{ color: selected ? "#D4B06A" : "#1A1816" }}
                            >
                              {season}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Input
                      label="Target year"
                      value={conceptionYear}
                      onChangeText={(v) => updateConceptionTarget(conceptionSeason, v)}
                      keyboardType="number-pad"
                      placeholder={String(CURRENT_YEAR)}
                      error={
                        conceptionYear && !inRange(conceptionYear, CONCEPTION_YEAR_RANGE)
                          ? `Enter a year between ${CONCEPTION_YEAR_RANGE.min} and ${CONCEPTION_YEAR_RANGE.max}`
                          : undefined
                      }
                    />
                  </>
                )}
                <Input
                  label="Number of previous children"
                  value={data.previous_children}
                  onChangeText={(v) => setField("previous_children", v)}
                  keyboardType="number-pad"
                  placeholder="0"
                  error={
                    data.previous_children &&
                    !inRangeOrEmpty(data.previous_children, PREVIOUS_CHILDREN_RANGE)
                      ? `Enter a number between ${PREVIOUS_CHILDREN_RANGE.min} and ${PREVIOUS_CHILDREN_RANGE.max}`
                      : undefined
                  }
                />
                <View className="mt-4">
                  <Button fullWidth disabled={disabled} onPress={next}>
                    Continue
                  </Button>
                </View>
              </>
            );
          })()}

        {step === 3 && (
          <>
            <StepTitle
              eyebrow={`Step 3 of ${TOTAL}`}
              title="About you"
              subtitle="Your biological and physical profile shapes your personalized recommendations."
            />
            <Input
              label="First name"
              value={data.first_name}
              onChangeText={(v) => setField("first_name", v)}
              placeholder="Your first name"
              autoCapitalize="words"
              autoComplete="name-given"
              textContentType="givenName"
            />
            <Input
              label="Age"
              value={data.age}
              onChangeText={(v) => setField("age", v)}
              keyboardType="number-pad"
              placeholder="e.g. 29"
              error={
                data.age && !inRange(data.age, AGE_RANGE)
                  ? `Enter an age between ${AGE_RANGE.min} and ${AGE_RANGE.max}`
                  : undefined
              }
            />
            <Input
              label="Height (cm)"
              value={data.height}
              onChangeText={(v) => setField("height", v)}
              keyboardType="decimal-pad"
              placeholder="e.g. 165"
              error={
                data.height && !inRangeOrEmpty(data.height, HEIGHT_RANGE)
                  ? `Enter a height between ${HEIGHT_RANGE.min} and ${HEIGHT_RANGE.max} cm`
                  : undefined
              }
            />
            <Input
              label="Weight (kg)"
              value={data.weight}
              onChangeText={(v) => setField("weight", v)}
              keyboardType="decimal-pad"
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
            <View className="mt-4">
              <Button
                fullWidth
                disabled={
                  !data.first_name.trim() ||
                  !inRange(data.age, AGE_RANGE) ||
                  !inRangeOrEmpty(data.height, HEIGHT_RANGE) ||
                  !inRangeOrEmpty(data.weight, WEIGHT_RANGE)
                }
                onPress={next}
              >
                Continue
              </Button>
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <StepTitle
              eyebrow={`Step 4 of ${TOTAL}`}
              title={"Your lifestyle & environment"}
              subtitle="Where you live and how you live directly influences your hormonal environment."
            />
            <Input
              label="City"
              value={data.city}
              onChangeText={(v) => setField("city", v)}
              placeholder="e.g. Zurich"
              autoCapitalize="words"
            />
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2">
              Skin type
            </Text>
            {[
              { value: "1", label: "Very Fair", desc: "Always burns, never tans" },
              { value: "2", label: "Fair", desc: "Burns easily, tans minimally" },
              { value: "3", label: "Medium", desc: "Sometimes burns, gradually tans" },
              { value: "4", label: "Olive", desc: "Rarely burns, tans well" },
              { value: "5", label: "Brown", desc: "Very rarely burns" },
              { value: "6", label: "Dark Brown", desc: "Almost never burns" },
              { value: "7", label: "Very Dark", desc: "Extremely high melanin" },
            ].map((opt) => (
              <RadioCard
                key={opt.value}
                label={opt.label}
                description={opt.desc}
                selected={data.skin_type === opt.value}
                onSelect={() => setField("skin_type", opt.value)}
              />
            ))}
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
              label="Your job"
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
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Activity level
            </Text>
            {ACTIVITY_LEVELS.map((level) => (
              <RadioCard
                key={level}
                label={level}
                selected={data.activity_level === level}
                onSelect={() => setField("activity_level", level)}
              />
            ))}
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Diet type
            </Text>
            {DIET_TYPES.map((d) => (
              <RadioCard
                key={d}
                label={d}
                selected={data.diet_type === d}
                onSelect={() => setField("diet_type", d)}
              />
            ))}
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Sun exposure
            </Text>
            {SUN_EXPOSURE_LEVELS.map((opt) => (
              <RadioCard
                key={opt.label}
                label={opt.label}
                description={opt.desc}
                selected={data.sun_exposure === opt.label}
                onSelect={() => setField("sun_exposure", opt.label)}
              />
            ))}
            <View className="mt-2">
              <Button fullWidth disabled={!data.city.trim()} onPress={next}>
                Continue
              </Button>
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <StepTitle
              eyebrow={`Step 5 of ${TOTAL}`}
              title={"Your partner (optional)"}
              subtitle="Partner health accounts for 40% of fertility outcomes. Including this unlocks partner optimization."
            />
            <Input
              label="Partner age"
              value={data.partner_age}
              onChangeText={(v) => setField("partner_age", v)}
              keyboardType="number-pad"
              placeholder="e.g. 32"
              error={
                data.partner_age && !inRangeOrEmpty(data.partner_age, PARTNER_AGE_RANGE)
                  ? `Enter an age between ${PARTNER_AGE_RANGE.min} and ${PARTNER_AGE_RANGE.max}`
                  : undefined
              }
            />
            <SearchSelectField
              label="Partner job"
              search={mSearch}
              onSearchChange={setMSearch}
              suggestions={allMaleJobs}
              onPick={(job) => {
                setField("partners_job_type", job);
                setMSearch(job);
              }}
              onReconcile={() =>
                reconcileSearch(
                  allMaleJobs,
                  mSearch,
                  setMSearch,
                  (v) => setField("partners_job_type", v),
                  data.partners_job_type,
                )
              }
            />
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Partner diet type
            </Text>
            {DIET_TYPES.map((d) => (
              <RadioCard
                key={d}
                label={d}
                selected={data.partner_diet === d}
                onSelect={() => setField("partner_diet", d)}
              />
            ))}
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Partner activity level
            </Text>
            {ACTIVITY_LEVELS.map((level) => (
              <RadioCard
                key={level}
                label={level}
                selected={data.partner_activity === level}
                onSelect={() => setField("partner_activity", level)}
              />
            ))}
            {saveError ? (
              <Text className="text-sm text-warning text-center mb-3">{saveError}</Text>
            ) : null}
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button
                  variant="outline"
                  fullWidth
                  disabled={saving || !inRangeOrEmpty(data.partner_age, PARTNER_AGE_RANGE)}
                  onPress={handleComplete}
                >
                  Skip for now
                </Button>
              </View>
              <View className="flex-[2]">
                <Button
                  fullWidth
                  loading={saving}
                  disabled={!inRangeOrEmpty(data.partner_age, PARTNER_AGE_RANGE)}
                  onPress={handleComplete}
                >
                  Complete
                </Button>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
