"use client";
import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useProtocol } from "@/hooks/useProtocol";
import { useAppStore } from "@/store/app";
import { createMeal, getMeals } from "@/lib/data";
import { triggerGenerateNutrition } from "@/lib/workflows";
import { getMilkContext, getWeekContext } from "@/data/weekContext";
import { getUserId } from "@/lib/auth";
import BottomNav from "@/components/shared/BottomNav";
import LoadingScreen from "@/components/shared/LoadingScreen";
import {
  ChevronRight,
  Sun,
  Moon,
  Utensils,
  Leaf,
  Pill,
  Sparkles,
  Info,
} from "lucide-react";

const GOLD = "#D4B06A";
const SAGE = "#A8B9A5";
const SUCCESS = "#1F7A5A";
const LAVENDER = "#8B85C1";

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
  {
    id: "breakfast",
    label: "Breakfast",
    iconType: "sun",
    iconBg: "rgba(212,176,106,0.1)",
    iconColor: GOLD,
  },
  {
    id: "lunch",
    label: "Lunch",
    iconType: "utensils",
    iconBg: "rgba(168,185,165,0.15)",
    iconColor: SAGE,
  },
  {
    id: "dinner",
    label: "Dinner",
    iconType: "moon",
    iconBg: "rgba(139,133,193,0.1)",
    iconColor: LAVENDER,
  },
  {
    id: "snacks",
    label: "Snacks",
    iconType: "leaf",
    iconBg: "rgba(31,122,90,0.08)",
    iconColor: SUCCESS,
  },
];

function SectionIcon({ type, color }: { type: string; color: string }) {
  if (type === "sun") return <Sun size={18} color={color} />;
  if (type === "moon") return <Moon size={18} color={color} />;
  if (type === "leaf") return <Leaf size={18} color={color} />;
  return <Utensils size={18} color={color} />;
}

export default function NutritionPage() {
  useProfile();
  const { loading } = useProtocol();
  const { profile, protocol } = useAppStore();
  const [meals, setMeals] = useState<Record<string, Meal[]>>({});
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "breakfast",
  );
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [expandedSupp, setExpandedSupp] = useState<string | null>(null);
  const hasCreatedMeals = useRef(false);

  useEffect(() => {
    if (!profile || !protocol?._id) return;
    if (hasCreatedMeals.current) return;

    let cancelled = false;

    async function load() {
      try {
        // 1. Check if meals already exist for today's protocol
        const existing = await getMeals(protocol!._id);
        if (existing.length > 0) {
          if (!cancelled) {
            setMeals(groupMeals(existing));
            setLoadingMeals(false);
          }
          return;
        }

        // 2. Compute week context client-side from dataset
        const jt = profile!.journey_type ?? "trying_to_conceive";
        const weekCtx = getWeekContext(jt, profile!.current_week ?? 0);
        // Milk context only for postpartum — blood→milk→baby chain
        const milkCtx = jt === "postpartum" ? getMilkContext() : undefined;

        // 3. Generate meals with week context
        hasCreatedMeals.current = true;
        setGenerating(true);

        const userId = getUserId() ?? profile!._id;
        const res = await triggerGenerateNutrition(userId, weekCtx, milkCtx);

        const parsed = JSON.parse(res.response.result);

        // 4. Create meal records in Bubble — includes baby_benefit + mother_benefit
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

        // 5. Fetch and render
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
    const g: Record<string, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    data.forEach((m) => {
      const t = m.meal_type?.toLowerCase();
      if (g[t]) g[t].push(m);
    });
    return g;
  }

  if (!profile || loading)
    return <LoadingScreen message="Loading your nutrition plan..." />;

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
    ? protocol.supplements
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="min-h-full bg-bg pb-24">
      {/* Header */}
      <div className="px-6 pt-5">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill mb-3.5"
          style={{ background: "rgba(212,176,106,0.1)" }}
        >
          <Sparkles size={11} color={GOLD} />
          <span className="text-2xs text-gold font-semibold tracking-wider">
            {badge}
          </span>
        </div>
        <h1 className="text-4xl font-medium text-primary tracking-tight leading-tight mb-2.5">
          Nutrition Plan
        </h1>
        <p className="font-serif italic text-md text-secondary leading-relaxed">
          {headerSub}
        </p>

        {protocol?.nutrition_plan && (
          <div
            className="mt-4 px-3.5 py-3 rounded-2xl"
            style={{
              background: "rgba(212,176,106,0.07)",
              borderLeft: "2px solid rgba(212,176,106,0.35)",
            }}
          >
            <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
              Today's AI guidance
            </p>
            <p className="text-sm text-secondary leading-relaxed font-serif italic">
              {protocol.nutrition_plan}
            </p>
          </div>
        )}

        {protocol?.avoid_today && (
          <div
            className="mt-3 flex items-start gap-2 px-3.5 py-2.5 rounded-xl"
            style={{
              background: "rgba(194,107,46,0.07)",
              borderLeft: "2px solid rgba(194,107,46,0.3)",
            }}
          >
            <span className="text-warning text-xs">⚠</span>
            <div>
              <p className="text-2xs text-warning uppercase tracking-widest font-semibold mb-0.5">
                Avoid Today
              </p>
              <p className="text-sm text-warning leading-snug">
                {protocol.avoid_today}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 mt-6 flex flex-col gap-3">
        {/* Meal sections */}
        {loadingMeals ? (
          <div className="bg-card rounded-3xl p-6 border border-border text-center">
            <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent spin mx-auto mb-3" />
            <p className="text-base text-muted">
              {generating
                ? "Generating your personalized meal plan…"
                : "Loading meals…"}
            </p>
            <p className="text-2xs text-muted mt-1">
              This takes about 15–20 seconds
            </p>
          </div>
        ) : (
          SECTIONS.map((section) => {
            const sectionMeals = meals[section.id] || [];
            return (
              <div
                key={section.id}
                className="bg-card rounded-3xl overflow-hidden border border-border"
              >
                <button
                  onClick={() => {
                    setExpandedSection((s) =>
                      s === section.id ? null : section.id,
                    );
                    setExpandedMeal(null);
                  }}
                  className="w-full px-5 py-4.5 bg-transparent border-none cursor-pointer text-left py-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: section.iconBg }}
                    >
                      <SectionIcon
                        type={section.iconType}
                        color={section.iconColor}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        {section.label}
                      </h3>
                      <p className="text-2xs text-muted mt-0.5">
                        {sectionMeals.length > 0
                          ? `${sectionMeals.length} meal idea${sectionMeals.length > 1 ? "s" : ""}`
                          : "Generating…"}
                      </p>
                    </div>
                    <ChevronRight
                      size={17}
                      className="text-muted shrink-0 transition-transform duration-300"
                      style={{
                        transform:
                          expandedSection === section.id
                            ? "rotate(90deg)"
                            : "none",
                      }}
                    />
                  </div>
                </button>

                {expandedSection === section.id && (
                  <div className="border-t border-border px-4 py-3 flex flex-col gap-2.5">
                    {sectionMeals.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">
                        No meals generated yet.
                      </p>
                    ) : (
                      sectionMeals.map((meal, mIdx) => {
                        const mKey = meal._id || `${section.id}-${mIdx}`;
                        return (
                          <div
                            key={mKey}
                            className="bg-elevated rounded-[18px] overflow-hidden border border-border p-3"
                          >
                            <button
                              onClick={() =>
                                setExpandedMeal((m) =>
                                  m === mKey ? null : mKey,
                                )
                              }
                              className="w-full px-4.5 py-4 bg-transparent border-none cursor-pointer text-left"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="text-md font-semibold text-primary leading-tight">
                                    {meal.name}
                                  </h4>
                                  <p className="text-2xs text-muted mt-1 font-serif italic leading-snug">
                                    {meal.description}
                                  </p>
                                </div>
                                <ChevronRight
                                  size={15}
                                  className="text-muted shrink-0 mt-1 transition-transform duration-200"
                                  style={{
                                    transform:
                                      expandedMeal === mKey
                                        ? "rotate(90deg)"
                                        : "none",
                                  }}
                                />
                              </div>
                            </button>

                            {expandedMeal === mKey && (
                              <div className="px-4.5 pb-4.5">
                                {/* Nutrients + calories */}
                                <div className="border-t border-border pt-3.5 mb-3.5 flex flex-col gap-2.5">
                                  {meal.nutrients && (
                                    <div className="flex items-baseline gap-2.5 pb-2.5 border-b border-border">
                                      <span
                                        className="text-2xs text-muted font-semibold uppercase tracking-widest shrink-0"
                                        style={{ minWidth: 88 }}
                                      >
                                        Key Nutrients
                                      </span>
                                      <span className="text-sm text-primary font-medium leading-snug">
                                        {meal.nutrients}
                                      </span>
                                    </div>
                                  )}
                                  {meal.calories && (
                                    <div className="flex items-baseline gap-2.5">
                                      <span
                                        className="text-2xs text-muted font-semibold uppercase tracking-widest shrink-0"
                                        style={{ minWidth: 88 }}
                                      >
                                        Energy
                                      </span>
                                      <span className="text-sm text-gold font-semibold">
                                        ~{meal.calories} kcal
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* For your baby — week-specific developmental context */}
                                {meal.baby_benefit && (
                                  <div
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{
                                      background: "rgba(212,176,106,0.07)",
                                      borderLeft:
                                        "2px solid rgba(212,176,106,0.35)",
                                    }}
                                  >
                                    <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                                      {isPregnant
                                        ? `For your baby · Week ${profile.current_week ?? ""}`
                                        : jt === "postpartum"
                                          ? "For your baby via milk"
                                          : "Fertility benefit"}
                                    </p>
                                    <p className="text-sm text-secondary leading-relaxed font-serif italic">
                                      {meal.baby_benefit}
                                    </p>
                                  </div>
                                )}

                                {/* For you — maternal benefit */}
                                {meal.mother_benefit && (
                                  <div
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{
                                      background: "rgba(31,122,90,0.06)",
                                      borderLeft:
                                        "2px solid rgba(31,122,90,0.25)",
                                    }}
                                  >
                                    <p
                                      className="text-2xs uppercase tracking-widest font-semibold mb-1.5"
                                      style={{ color: SUCCESS }}
                                    >
                                      For you
                                    </p>
                                    <p
                                      className="text-sm leading-relaxed font-serif italic"
                                      style={{ color: "#7B7268" }}
                                    >
                                      {meal.mother_benefit}
                                    </p>
                                  </div>
                                )}

                                {/* Fallback for older meals without these fields */}
                                {!meal.baby_benefit && !meal.mother_benefit && (
                                  <div
                                    className="px-3.5 py-3 rounded-2xl mb-3"
                                    style={{
                                      background: "rgba(212,176,106,0.07)",
                                      borderLeft:
                                        "2px solid rgba(212,176,106,0.35)",
                                    }}
                                  >
                                    <p className="text-2xs text-gold uppercase tracking-widest font-semibold mb-1.5">
                                      Why this matters today
                                    </p>
                                    <p className="text-sm text-secondary leading-relaxed font-serif italic">
                                      {meal.description}
                                    </p>
                                  </div>
                                )}

                                <div className="flex items-start gap-2 px-3 py-2.5 bg-section rounded-xl">
                                  <Info
                                    size={12}
                                    className="text-muted shrink-0 mt-0.5"
                                  />
                                  <p className="text-2xs text-muted leading-relaxed">
                                    Always confirm dietary changes with your
                                    healthcare provider.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Supplements */}
        {suppList.length > 0 && (
          <div className="bg-card rounded-3xl overflow-hidden border border-border">
            <button
              onClick={() =>
                setExpandedSection((s) =>
                  s === "supplements" ? null : "supplements",
                )
              }
              className="w-full px-5 py-4.5 bg-transparent border-none cursor-pointer text-left py-3"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(212,176,106,0.1)" }}
                >
                  <Pill size={18} color={GOLD} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary">
                    Vitamins & Supplements
                  </h3>
                  <p className="text-2xs text-muted mt-0.5">
                    {suppList.length} recommended today · AI personalized
                  </p>
                </div>
                <ChevronRight
                  size={17}
                  className="text-muted shrink-0 transition-transform duration-300"
                  style={{
                    transform:
                      expandedSection === "supplements"
                        ? "rotate(90deg)"
                        : "none",
                  }}
                />
              </div>
            </button>
            {expandedSection === "supplements" && (
              <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
                {suppList.map((supp, i) => (
                  <div
                    key={i}
                    className="bg-elevated rounded-2xl overflow-hidden border border-border"
                  >
                    <button
                      onClick={() =>
                        setExpandedSupp((s) =>
                          s === String(i) ? null : String(i),
                        )
                      }
                      className="w-full px-4 py-3.5 bg-transparent border-none cursor-pointer text-left flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-gold shrink-0" />
                        <span className="text-base text-primary font-medium">
                          {supp}
                        </span>
                      </div>
                      <ChevronRight
                        size={14}
                        className="text-muted transition-transform duration-200"
                        style={{
                          transform:
                            expandedSupp === String(i)
                              ? "rotate(90deg)"
                              : "none",
                        }}
                      />
                    </button>
                    {expandedSupp === String(i) && (
                      <div className="px-4 pb-3.5">
                        <div className="flex items-start gap-2 px-3 py-2.5 bg-section rounded-xl">
                          <Info
                            size={12}
                            className="text-muted shrink-0 mt-0.5"
                          />
                          <p className="text-2xs text-muted leading-relaxed">
                            Always confirm supplement changes with your
                            healthcare provider.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
