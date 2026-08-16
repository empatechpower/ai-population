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
import { ChevronLeft, Leaf, Sun, Moon, Check } from "lucide-react-native";

import { useOnboarding } from "@/store/onboarding";
import { updateProfile } from "@/lib/data";
import { triggerOnboardingComplete } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";
import { getAllJobTitles, Job, lookupJob } from "@/data/job_index";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import RadioCard from "@/components/shared/RadioCard";

const TOTAL = 6;

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

function inRange(value: string, range: { min: number; max: number }): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
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

function JobSearchField({
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
  onPick: (job: string) => void;
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
            {filtered.map((job) => (
              <Pressable
                key={job}
                onPress={() => onPick(job)}
                className="px-4 py-2.5 border-b border-border/50"
              >
                <Text className="text-sm text-charcoal">{job}</Text>
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

  useEffect(() => {
    if (step !== TOTAL + 1) return;
    const timers = CHECKS.map((_, i) =>
      setTimeout(() => setVisible((v) => [...v, i]), 600 + i * 400),
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  const [search, setSearch] = useState(data.job_type);
  const [mSearch, setMSearch] = useState(data.partners_job_type);
  const [allFemaleJobs, setAllFemaleJobs] = useState<string[]>(() => getAllJobTitles("female"));
  const [allMaleJobs, setAllMaleJobs] = useState<string[]>(() => getAllJobTitles("male"));

  useEffect(() => {
    import("@/lib/datasets").then(({ getAllJobTitlesDynamic }) => {
      getAllJobTitlesDynamic("female").then(setAllFemaleJobs).catch(() => {});
      getAllJobTitlesDynamic("male").then(setAllMaleJobs).catch(() => {});
    });
  }, []);

  function reconcileJobSearch(
    list: string[],
    searchVal: string,
    setSearchVal: (v: string) => void,
    setJobField: (v: string) => void,
    confirmedValue: string,
  ) {
    const trimmed = searchVal.trim();
    if (trimmed === "") {
      setJobField("");
      return;
    }
    const match = list.find((j) => j.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      setJobField(match);
      setSearchVal(match);
    } else {
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
      setSaveError("We couldn't save your profile. Please check your connection and try again.");
    }
  }

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

  const filteredFemale = allFemaleJobs
    .filter((j) => j.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  const filteredMale = allMaleJobs
    .filter((j) => j.toLowerCase().includes(mSearch.toLowerCase()))
    .slice(0, 8);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
                : !data.target_conception_season.trim()) ||
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
                  <Input
                    label="Target conception season"
                    value={data.target_conception_season}
                    onChangeText={(v) => setField("target_conception_season", v)}
                    placeholder="e.g. Spring 2025"
                  />
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
              keyboardType="number-pad"
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
              keyboardType="number-pad"
              placeholder="e.g. 63"
              error={
                data.weight && !inRangeOrEmpty(data.weight, WEIGHT_RANGE)
                  ? `Enter a weight between ${WEIGHT_RANGE.min} and ${WEIGHT_RANGE.max} kg`
                  : undefined
              }
            />
            <Input
              label="Nationality"
              value={data.nationality}
              onChangeText={(v) => setField("nationality", v)}
              placeholder="e.g. Swiss"
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
            <Input
              label="Country"
              value={data.country}
              onChangeText={(v) => setField("country", v)}
              placeholder="e.g. Switzerland"
            />
            <JobSearchField
              label="Your job"
              search={search}
              onSearchChange={setSearch}
              suggestions={allFemaleJobs}
              onPick={(job) => {
                setField("job_type", job);
                setSearch(job);
              }}
              onReconcile={() =>
                reconcileJobSearch(allFemaleJobs, search, setSearch, (v) => setField("job_type", v), data.job_type)
              }
            />
            <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2 mt-2">
              Activity level
            </Text>
            {["Sedentary", "Light", "Moderate", "Active", "Very Active"].map((level) => (
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
            {["Omnivore", "Vegetarian", "Vegan", "Pescatarian", "Gluten-free"].map((d) => (
              <RadioCard
                key={d}
                label={d}
                selected={data.diet_type === d}
                onSelect={() => setField("diet_type", d)}
              />
            ))}
            <Input
              label="Sun exposure"
              value={data.sun_exposure}
              onChangeText={(v) => setField("sun_exposure", v)}
              placeholder="e.g. Moderate — daily outdoor time"
            />
            <View className="mt-2">
              <Button fullWidth disabled={!data.city} onPress={next}>
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
            <JobSearchField
              label="Partner job"
              search={mSearch}
              onSearchChange={setMSearch}
              suggestions={allMaleJobs}
              onPick={(job) => {
                setField("partners_job_type", job);
                setMSearch(job);
              }}
              onReconcile={() =>
                reconcileJobSearch(
                  allMaleJobs,
                  mSearch,
                  setMSearch,
                  (v) => setField("partners_job_type", v),
                  data.partners_job_type,
                )
              }
            />
            <Input
              label="Partner diet type"
              value={data.partner_diet}
              onChangeText={(v) => setField("partner_diet", v)}
              placeholder="e.g. Omnivore"
            />
            <Input
              label="Partner activity level"
              value={data.partner_activity}
              onChangeText={(v) => setField("partner_activity", v)}
              placeholder="e.g. Moderate"
            />
            {saveError ? (
              <Text className="text-sm text-warning text-center mb-3">{saveError}</Text>
            ) : null}
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1">
                <Button variant="outline" fullWidth disabled={saving} onPress={handleComplete}>
                  Skip for now
                </Button>
              </View>
              <View className="flex-[2]">
                <Button fullWidth loading={saving} onPress={handleComplete}>
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
