// ─────────────────────────────────────────────────────────────
// weekContext.ts
// Computes AI prompt context from pregnancy foods dataset.
// Reads from Bubble (via lib/datasets.ts) when available,
// falls back to local pregnancy_foods.json.
//
// postpartum_milk context is read from postpartum_milk.json
// (same pattern — no hardcoded strings).
// ─────────────────────────────────────────────────────────────

// Local JSON fallbacks
import foodsJson from "@/data/pregnancy_foods.json";
import milkJson from "@/data/postpartum_milk.json";

const MILK = milkJson.postpartum_milk_optimization;

// ── Types ─────────────────────────────────────────────────────
export interface WeekContext {
  week_context: string;
  food_matches: string;
  food_detail: string;
}

export interface MilkContext {
  milk_logic: string;
  key_nutrients: string;
  blood_support: string;
  milk_boosters: string;
  evening_feeding: string;
  oral_health: string;
  environment: string;
  electrical: string;
}

interface Food {
  id: number | string;
  food: string;
  stage: string;
  baby_effect: string;
  mother_effect: string;
  nutrients: string[];
  science?: string;
}

// ── Dataset helpers ───────────────────────────────────────────
const SKIP_STAGES = new Set(["limited", "small amounts", "moderate"]);

function minWeek(stage: string): number {
  const s = stage.toLowerCase().trim();
  if (s === "all stages" || SKIP_STAGES.has(s)) return 0;
  let m = s.match(/^week\s+(\d+)\+/);
  if (m) return parseInt(m[1]);
  m = s.match(/^week\s+(\d+)-(\d+)/);
  if (m) return parseInt(m[1]);
  m = s.match(/^week\s+(\d+)/);
  if (m) return parseInt(m[1]);
  return 0;
}

function maxWeek(stage: string): number {
  const s = stage.toLowerCase().trim();
  if (s === "all stages" || SKIP_STAGES.has(s)) return 42;
  const m = s.match(/^week\s+(\d+)-(\d+)/);
  if (m) return parseInt(m[2]);
  return 42;
}

function getFoodsForWeek(foods: Food[], week: number): Food[] {
  return foods.filter((f) => {
    if (SKIP_STAGES.has(f.stage.toLowerCase().trim())) return false;
    return minWeek(f.stage) <= week && week <= maxWeek(f.stage);
  });
}

function buildContext(
  foods: Food[],
  week: number,
  context: string,
): WeekContext {
  const eligible = getFoodsForWeek(foods, week);
  const specific = eligible.filter(
    (f) => f.stage.toLowerCase().trim() !== "all stages",
  );
  const universal = eligible.filter(
    (f) => f.stage.toLowerCase().trim() === "all stages",
  );
  const top = [...specific, ...universal].slice(0, 8);

  const foodNames = top.map((f) => f.food);
  const nutrients = [...new Set(top.flatMap((f) => f.nutrients))].slice(0, 6);
  const detail =
    top
      .slice(0, 6)
      .map(
        (f) =>
          `${f.food} (${f.nutrients.join(", ")}: ${f.baby_effect}; for mother: ${f.mother_effect})`,
      )
      .join(". ") + ".";

  return {
    week_context: context,
    food_matches: `Priority nutrients: ${nutrients.join(", ")}. Foods from dataset: ${foodNames.join(", ")}.`,
    food_detail: detail,
  };
}

const WEEK_RANGES: [number, number, string][] = [
  [
    1,
    4,
    "The neural tube is closing to form the brain and spinal cord. The heart is beginning to beat. This is the most critical folate window — deficiency here causes neural tube defects.",
  ],
  [
    5,
    8,
    "The brain is dividing into its two hemispheres. All major organs are beginning to form. Choline drives neural tube closure and early brain cell multiplication.",
  ],
  [
    9,
    12,
    "All major organs are now present. DNA is replicating at its highest rate. The immune system begins forming. Antioxidants protect rapidly dividing cells from oxidative damage.",
  ],
  [
    13,
    16,
    "The skeleton is hardening from cartilage to bone. Fingerprints are forming. Hearing begins to develop. Calcium and magnesium are essential for skeletal mineralisation.",
  ],
  [
    17,
    20,
    "The brain is growing at an extraordinary rate — synaptic connections are forming rapidly. DHA directly fuels brain wiring.",
  ],
  [
    21,
    24,
    "Viability milestone. The lungs are developing air sacs. Brain synapse formation is at peak speed. Most critical window for brain architecture.",
  ],
  [
    25,
    28,
    "The baby's eyes are opening for the first time. The brain is folding into its final structure. Fat stores are building to regulate body temperature after birth.",
  ],
  [
    29,
    32,
    "The brain is completing its folded architecture. The immune system is developing rapidly. Bones are hardening. The baby gains approximately 200g per week.",
  ],
  [
    33,
    36,
    "The lungs are maturing and producing surfactant. Fat stores are completing. The baby is moving into head-down position for birth.",
  ],
  [
    37,
    42,
    "The baby is fully developed. Dates consumed from week 36 are clinically associated with shorter labour duration and cervical ripening.",
  ],
];

const POSTPARTUM_FOOD_IDS = [11, 2, 18, 14, 6, 9, 1, 68];

// ── Async getWeekContext (uses Bubble foods if available) ─────
export async function getWeekContextAsync(
  journeyType: string,
  currentWeek: number,
): Promise<WeekContext> {
  // Load foods from Bubble or fall back to JSON
  let foods: Food[];
  try {
    const { getPregnancyFoods } = await import("@/lib/datasets");
    foods = await getPregnancyFoods();
    if (!foods.length) throw new Error("empty");
  } catch {
    foods = foodsJson.foods as Food[];
  }

  return buildWeekContextFromFoods(foods, journeyType, currentWeek);
}

// ── Sync getWeekContext (reads local JSON — safe to call anywhere) ─
export function getWeekContext(
  journeyType: string,
  currentWeek: number,
): WeekContext {
  return buildWeekContextFromFoods(
    foodsJson.foods as Food[],
    journeyType,
    currentWeek,
  );
}

function buildWeekContextFromFoods(
  foods: Food[],
  journeyType: string,
  currentWeek: number,
): WeekContext {
  if (journeyType === "postpartum") {
    const ppFoods = POSTPARTUM_FOOD_IDS.map((id) =>
      foods.find((f) => Number(f.id) === id || f.id === id),
    ).filter(Boolean) as Food[];
    const ppNutrients = [...new Set(ppFoods.flatMap((f) => f.nutrients))].slice(
      0,
      7,
    );
    const ppDetail =
      ppFoods
        .slice(0, 6)
        .map(
          (f) =>
            `${f.food} (${f.nutrients.join(", ")}: ${f.baby_effect}; for mother: ${f.mother_effect})`,
        )
        .join(". ") + ".";

    return {
      week_context: `Week ${currentWeek} postpartum. Blood volume is recovering after birth. Nutrient demands are high — iron, DHA, choline, and protein are being actively depleted by milk production.`,
      food_matches: `Priority nutrients: ${ppNutrients.join(", ")}. Key foods: ${ppFoods.map((f) => f.food).join(", ")}.`,
      food_detail: ppDetail,
    };
  }

  // TTC or unknown — all-stages fallback
  if (!currentWeek || journeyType === "trying_to_conceive") {
    const allStage = foods
      .filter((f) => f.stage.toLowerCase().trim() === "all stages")
      .slice(0, 8);
    const nutrients = [...new Set(allStage.flatMap((f) => f.nutrients))].slice(
      0,
      6,
    );
    return {
      week_context:
        "Focus on nutrient density for fertility and early pregnancy. Folate, DHA, iron, and antioxidants are foundational.",
      food_matches: `Priority nutrients: ${nutrients.join(", ")}. Foods: ${allStage.map((f) => f.food).join(", ")}.`,
      food_detail:
        allStage
          .slice(0, 5)
          .map(
            (f) =>
              `${f.food} (${f.nutrients.join(", ")}: ${f.baby_effect}; for mother: ${f.mother_effect})`,
          )
          .join(". ") + ".",
    };
  }

  // Pregnant — find matching week range
  const [start, end, context] =
    WEEK_RANGES.find(([s, e]) => currentWeek >= s && currentWeek <= e) ??
    WEEK_RANGES[WEEK_RANGES.length - 1];

  return buildContext(foods, Math.floor((start + end) / 2), context);
}

// ── getMilkContext — reads from postpartum_milk.json ─────────
export function getMilkContext(): MilkContext {
  const key_nutrients = MILK.key_nutrients
    .map(
      (n: any) =>
        `${n.name}: ${n.role_mother} → ${n.role_milk} → baby: ${n.benefit_baby}`,
    )
    .join(". ");

  const blood_support = [
    "Blood became thicker during pregnancy — postpartum priority is normalising blood flow.",
    `Actions: ${MILK.blood_optimization.actions.join(", ")}.`,
    `Blood-thinning foods: ${MILK.blood_thinning_support.supporting_foods.join(", ")}.`,
    MILK.blood_thinning_support.effect,
  ].join(" ");

  const milk_boosters =
    "Foods that directly stimulate or enrich milk: " +
    MILK.milk_boosting_foods
      .map(
        (f: any) =>
          `${f.food.charAt(0).toUpperCase() + f.food.slice(1)} (${f.effect})`,
      )
      .join(", ") +
    ".";

  const evening_feeding = [
    MILK.evening_feeding.note,
    `Include tryptophan-rich foods (${MILK.evening_feeding.foods.join(", ")}) which ${MILK.evening_feeding.reason}.`,
    MILK.evening_feeding.supplement,
  ].join(" ");

  const oral_health = [
    MILK.oral_health.note,
    `Include probiotic-rich foods (${MILK.oral_health.recommended_foods.join(", ")}).`,
    `Key nutrients: ${MILK.oral_health.key_nutrients.join(", ")}.`,
  ].join(" ");

  const environment = [
    MILK.environment.note,
    `Support the parasympathetic nervous system: ${MILK.environment.calming_foods.join(", ")}.`,
    `Key nutrients: ${MILK.environment.key_nutrients.join(", ")}.`,
  ].join(" ");

  const electrical = [
    MILK.electrical.note,
    `Foods that support melatonin: ${MILK.electrical.melatonin_foods.join(", ")}.`,
    `Antioxidant-rich foods: ${MILK.electrical.antioxidant_foods.join(", ")}.`,
  ].join(" ");

  return {
    milk_logic: MILK.concept.core_logic,
    key_nutrients,
    blood_support,
    milk_boosters,
    evening_feeding,
    oral_health,
    environment,
    electrical,
  };
}

// Async version that tries to pull key_nutrients from Bubble milknutrient type
export async function getMilkContextAsync(): Promise<MilkContext> {
  const base = getMilkContext();
  try {
    const token =
      typeof window !== "undefined"
        ? (await import("@/lib/auth")).getToken()
        : null;
    if (!token) return base;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BUBBLE_BASE_URL}/obj/milknutrient?limit=20`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const d = await res.json();
    const nutrients = d.response?.results ?? [];
    if (!nutrients.length) return base;

    const key_nutrients = nutrients
      .map(
        (n: any) =>
          `${n.name_text ?? n.name}: ${n.role_mother_text ?? n.role_mother} → ${n.role_milk_text ?? n.role_milk} → baby: ${n.benefit_baby_text ?? n.benefit_baby}`,
      )
      .join(". ");

    return { ...base, key_nutrients };
  } catch {
    return base;
  }
}
