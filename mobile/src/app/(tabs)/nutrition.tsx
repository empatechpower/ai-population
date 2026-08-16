import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { ChevronRight, Sun, Moon, Utensils, Leaf, Pill, Sparkles, Info } from "lucide-react-native";

import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { createMeal, getMeals } from "@/lib/data";
import { triggerGenerateNutrition } from "@/lib/workflows";
import { getMilkContext, getWeekContext } from "@/data/weekContext";
import { getUserId } from "@/lib/auth";
import LoadingScreen from "@/components/shared/LoadingScreen";

const GOLD = "#D4B06A";
const SAGE = "#A8B9A5";
const SUCCESS = "#1F7A5A";
const LAVENDER = "#8B85C1";
const MUTED = "#9A9094";

interface Meal {
  _id?: string;
  meal_type: string;
  name: string;
  description: string;
  nutrients: string;
  calories?: number;
  baby_benefit?: string;
  mother_benefit?: string;
}

const SECTIONS = [
  { id: "breakfast", label: "Breakfast", iconType: "sun", iconBg: "rgba(212,176,106,0.1)", iconColor: GOLD },
  { id: "lunch", label: "Lunch", iconType: "utensils", iconBg: "rgba(168,185,165,0.15)", iconColor: SAGE },
  { id: "dinner", label: "Dinner", iconType: "moon", iconBg: "rgba(139,133,193,0.1)", iconColor: LAVENDER },
  { id: "snacks", label: "Snacks", iconType: "leaf", iconBg: "rgba(31,122,90,0.08)", iconColor: SUCCESS },
];

function SectionIcon({ type, color }: { type: string; color: string }) {
  if (type === "sun") return <Sun size={18} color={color} />;
  if (type === "moon") return <Moon size={18} color={color} />;
  if (type === "leaf") return <Leaf size={18} color={color} />;
  return <Utensils size={18} color={color} />;
}

export default function NutritionScreen() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const [meals, setMeals] = useState<Record<string, Meal[]>>({});
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("breakfast");
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [expandedSupp, setExpandedSupp] = useState<string | null>(null);
  const hasCreatedMeals = useRef(false);

  useEffect(() => {
    if (!profile || !protocol?._id) return;
    if (hasCreatedMeals.current) return;

    let cancelled = false;

    async function load() {
      try {
        const existing = await getMeals(protocol!._id);
        if (existing.length > 0) {
          if (!cancelled) {
            setMeals(groupMeals(existing));
            setLoadingMeals(false);
          }
          return;
        }

        const jt = profile!.journey_type ?? "trying_to_conceive";
        const weekCtx = getWeekContext(jt, profile!.current_week ?? 0);
        const milkCtx = jt === "postpartum" ? getMilkContext() : undefined;

        hasCreatedMeals.current = true;
        setGenerating(true);

        const userId = getUserId() ?? profile!._id;
        const parsed = await triggerGenerateNutrition(userId, weekCtx, milkCtx);

        const mealList = [
          { type: "breakfast", data: parsed.breakfast },
          { type: "lunch", data: parsed.lunch },
          { type: "dinner", data: parsed.dinner },
          { type: "snacks", data: parsed.snacks },
        ];

        await Promise.all(
          mealList.map((meal) =>
            createMeal({
              protocol: protocol!._id,
              meal_type: meal.type,
              name: meal.data.name,
              description: meal.data.description,
              nutrients: meal.data.nutrients,
              baby_benefit: meal.data.baby_benefit ?? "",
              mother_benefit: meal.data.mother_benefit ?? "",
            }),
          ),
        );

        const created = await getMeals(protocol!._id);
        if (!cancelled) {
          setMeals(groupMeals(created));
          setLoadingMeals(false);
          setGenerating(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setLoadingMeals(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profile, protocol?._id]);

  function groupMeals(data: Meal[]) {
    const g: Record<string, Meal[]> = { breakfast: [], lunch: [], dinner: [], snacks: [] };
    data.forEach((m) => {
      const t = m.meal_type?.toLowerCase();
      if (g[t]) g[t].push(m);
    });
    return g;
  }

  if (!profile || loading) return <LoadingScreen message="Loading your nutrition plan..." />;

  const jt = profile.journey_type ?? "trying_to_conceive";
  const isPregnant = jt === "currently_pregnant";

  const badge =
    jt === "currently_pregnant"
      ? `Week ${profile.current_week ?? ""} Focus`
      : jt === "postpartum"
        ? "Recovery Focus"
        : "Fertility Focus";

  const headerSub =
    jt === "currently_pregnant"
      ? `Optimized for week ${profile.current_week ?? ""} — matched to your baby's development`
      : jt === "postpartum"
        ? "Optimized for Recovery — Restoration & Replenishment"
        : "Optimized for Fertility — Hormonal Balance & Egg Quality";

  const suppList = protocol?.supplements
    ? protocol.supplements.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerClassName="pb-24">
      <View className="px-6 pt-5">
        <View
          className="flex-row items-center self-start gap-1.5 px-3 py-1 rounded-pill mb-3.5"
          style={{ backgroundColor: "rgba(212,176,106,0.1)" }}
        >
          <Sparkles size={11} color={GOLD} />
          <Text className="text-2xs text-gold font-semibold tracking-wider">{badge}</Text>
        </View>
        <Text className="text-4xl font-medium text-primary tracking-tight leading-tight mb-2.5">
          Nutrition Plan
        </Text>
        <Text className="font-serif italic text-md text-secondary leading-relaxed">{headerSub}</Text>

        {protocol?.nutrition_plan && (
          <View
            className="mt-4 px-3.5 py-3 rounded-2xl"
            style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
          >
            <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
              Today's AI guidance
            </Text>
            <Text className="text-sm text-secondary leading-relaxed font-serif italic">
              {protocol.nutrition_plan}
            </Text>
          </View>
        )}

        {protocol?.avoid_today && (
          <View
            className="mt-3 flex-row items-start gap-2 px-3.5 py-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(194,107,46,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(194,107,46,0.3)" }}
          >
            <Text className="text-warning text-xs">⚠</Text>
            <View className="flex-1">
              <Text className="text-2xs text-warning uppercase tracking-widest font-semibold mb-0.5">
                Avoid Today
              </Text>
              <Text className="text-sm text-warning leading-snug">{protocol.avoid_today}</Text>
            </View>
          </View>
        )}
      </View>

      <View className="px-6 mt-6 gap-3">
        {loadingMeals ? (
          <View className="bg-card rounded-3xl p-6 border border-border items-center">
            <Text className="text-base text-muted">
              {generating ? "Generating your personalized meal plan…" : "Loading meals…"}
            </Text>
            <Text className="text-2xs text-muted mt-1">This takes about 15–20 seconds</Text>
          </View>
        ) : (
          SECTIONS.map((section) => {
            const sectionMeals = meals[section.id] || [];
            return (
              <View key={section.id} className="bg-card rounded-3xl overflow-hidden border border-border">
                <Pressable
                  onPress={() => {
                    setExpandedSection((s) => (s === section.id ? null : section.id));
                    setExpandedMeal(null);
                  }}
                  className="px-5 py-4"
                >
                  <View className="flex-row items-center gap-3.5">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: section.iconBg }}
                    >
                      <SectionIcon type={section.iconType} color={section.iconColor} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-primary">{section.label}</Text>
                      <Text className="text-2xs text-muted mt-0.5">
                        {sectionMeals.length > 0
                          ? `${sectionMeals.length} meal idea${sectionMeals.length > 1 ? "s" : ""}`
                          : "Generating…"}
                      </Text>
                    </View>
                    <ChevronRight
                      size={17}
                      color={MUTED}
                      style={{ transform: [{ rotate: expandedSection === section.id ? "90deg" : "0deg" }] }}
                    />
                  </View>
                </Pressable>

                {expandedSection === section.id && (
                  <View className="border-t border-border px-4 py-3 gap-2.5">
                    {sectionMeals.length === 0 ? (
                      <Text className="text-sm text-muted text-center py-4">No meals generated yet.</Text>
                    ) : (
                      sectionMeals.map((meal, mIdx) => {
                        const mKey = meal._id || `${section.id}-${mIdx}`;
                        const mExpanded = expandedMeal === mKey;
                        return (
                          <View
                            key={mKey}
                            className="bg-elevated rounded-[18px] overflow-hidden border border-border p-1"
                          >
                            <Pressable
                              onPress={() => setExpandedMeal((m) => (m === mKey ? null : mKey))}
                              className="px-3.5 py-3"
                            >
                              <View className="flex-row items-start justify-between gap-2">
                                <View className="flex-1">
                                  <Text className="text-md font-semibold text-primary leading-tight">
                                    {meal.name}
                                  </Text>
                                  <Text className="text-2xs text-muted mt-1 font-serif italic leading-snug">
                                    {meal.description}
                                  </Text>
                                </View>
                                <ChevronRight
                                  size={15}
                                  color={MUTED}
                                  style={{ transform: [{ rotate: mExpanded ? "90deg" : "0deg" }] }}
                                />
                              </View>
                            </Pressable>

                            {mExpanded && (
                              <View className="px-3.5 pb-3.5">
                                <View className="border-t border-border pt-3.5 mb-3.5 gap-2.5">
                                  {meal.nutrients && (
                                    <View className="flex-row items-baseline gap-2.5 pb-2.5 border-b border-border">
                                      <Text
                                        className="text-2xs text-muted font-semibold uppercase tracking-widest"
                                        style={{ minWidth: 88 }}
                                      >
                                        Key Nutrients
                                      </Text>
                                      <Text className="text-sm text-primary font-medium leading-snug flex-1">
                                        {meal.nutrients}
                                      </Text>
                                    </View>
                                  )}
                                  {meal.calories && (
                                    <View className="flex-row items-baseline gap-2.5">
                                      <Text
                                        className="text-2xs text-muted font-semibold uppercase tracking-widest"
                                        style={{ minWidth: 88 }}
                                      >
                                        Energy
                                      </Text>
                                      <Text className="text-sm text-gold font-semibold">
                                        ~{meal.calories} kcal
                                      </Text>
                                    </View>
                                  )}
                                </View>

                                {meal.baby_benefit && (
                                  <View
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
                                  >
                                    <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                                      {isPregnant
                                        ? `For your baby · Week ${profile.current_week ?? ""}`
                                        : jt === "postpartum"
                                          ? "For your baby via milk"
                                          : "Fertility benefit"}
                                    </Text>
                                    <Text className="text-sm text-secondary leading-relaxed font-serif italic">
                                      {meal.baby_benefit}
                                    </Text>
                                  </View>
                                )}

                                {meal.mother_benefit && (
                                  <View
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{ backgroundColor: "rgba(31,122,90,0.06)", borderLeftWidth: 2, borderLeftColor: "rgba(31,122,90,0.25)" }}
                                  >
                                    <Text className="text-2xs uppercase tracking-widest font-semibold mb-1.5" style={{ color: SUCCESS }}>
                                      For you
                                    </Text>
                                    <Text className="text-sm leading-relaxed font-serif italic" style={{ color: "#7B7268" }}>
                                      {meal.mother_benefit}
                                    </Text>
                                  </View>
                                )}

                                {!meal.baby_benefit && !meal.mother_benefit && (
                                  <View
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{ backgroundColor: "rgba(212,176,106,0.07)", borderLeftWidth: 2, borderLeftColor: "rgba(212,176,106,0.35)" }}
                                  >
                                    <Text className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                                      Why this matters today
                                    </Text>
                                    <Text className="text-sm text-secondary leading-relaxed font-serif italic">
                                      {meal.description}
                                    </Text>
                                  </View>
                                )}

                                <View className="flex-row items-start gap-2 px-3 py-2.5 bg-section rounded-xl">
                                  <Info size={12} color={MUTED} />
                                  <Text className="text-2xs text-muted leading-relaxed flex-1">
                                    Always confirm dietary changes with your healthcare provider.
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}

        {suppList.length > 0 && (
          <View className="bg-card rounded-3xl overflow-hidden border border-border">
            <Pressable
              onPress={() => setExpandedSection((s) => (s === "supplements" ? null : "supplements"))}
              className="px-5 py-4"
            >
              <View className="flex-row items-center gap-3.5">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{ backgroundColor: "rgba(212,176,106,0.1)" }}
                >
                  <Pill size={18} color={GOLD} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-primary">Vitamins & Supplements</Text>
                  <Text className="text-2xs text-muted mt-0.5">
                    {suppList.length} recommended today · AI personalized
                  </Text>
                </View>
                <ChevronRight
                  size={17}
                  color={MUTED}
                  style={{ transform: [{ rotate: expandedSection === "supplements" ? "90deg" : "0deg" }] }}
                />
              </View>
            </Pressable>
            {expandedSection === "supplements" && (
              <View className="border-t border-border px-4 py-3 gap-2">
                {suppList.map((supp, i) => {
                  const suppExpanded = expandedSupp === String(i);
                  return (
                    <View key={i} className="bg-elevated rounded-2xl overflow-hidden border border-border">
                      <Pressable
                        onPress={() => setExpandedSupp((s) => (s === String(i) ? null : String(i)))}
                        className="px-4 py-3.5 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-2 h-2 rounded-full bg-gold" />
                          <Text className="text-base text-primary font-medium">{supp}</Text>
                        </View>
                        <ChevronRight
                          size={14}
                          color={MUTED}
                          style={{ transform: [{ rotate: suppExpanded ? "90deg" : "0deg" }] }}
                        />
                      </Pressable>
                      {suppExpanded && (
                        <View className="px-4 pb-3.5">
                          <View className="flex-row items-start gap-2 px-3 py-2.5 bg-section rounded-xl">
                            <Info size={12} color={MUTED} />
                            <Text className="text-2xs text-muted leading-relaxed flex-1">
                              Always confirm supplement changes with your healthcare provider.
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
