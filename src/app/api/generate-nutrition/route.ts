import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT =
  "You are a prenatal and postnatal nutrition specialist with deep knowledge of fetal development, breast milk optimization, and fertility nutrition. You match every meal recommendation to the exact biological needs of the user based on their journey stage. Every meal must serve two purposes: what it does for the baby or fertility, and what it does for the mother. Respond in valid JSON only. No markdown, no explanation.";

export async function POST(req: NextRequest) {
  const { userId, weekCtx, milkCtx } = await req.json();
  if (!userId || !weekCtx) {
    return NextResponse.json({ error: "Missing userId or weekCtx" }, { status: 400 });
  }
  if (!(await verifyRequestUser(req, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileSnap = await adminDb.collection("users").doc(userId).get();
  if (!profileSnap.exists) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const p = profileSnap.data()!;

  const protocolSnap = await adminDb
    .collection("protocols")
    .where("user", "==", userId)
    .orderBy("Created Date", "desc")
    .limit(1)
    .get();
  const nutritionPlan = protocolSnap.empty
    ? ""
    : (protocolSnap.docs[0].data().nutrition_plan ?? "");

  const userPrompt = `Generate a personalized daily meal plan.

User profile:
Age: ${p.age ?? ""}
Journey: ${p.journey_type ?? ""}
Current week: ${p.current_week ?? ""}
City: ${p.city ?? ""}
Diet type: ${p.diet_type ?? ""}
Her job: ${p.job_type ?? ""}
Her key nutrients needed: ${p.female_nutrients ?? ""}
Job-recommended foods: ${""}
Today's nutrition focus from protocol: ${nutritionPlan}

---
IF journey_type is currently_pregnant:

BIOLOGICAL DEVELOPMENT HAPPENING THIS WEEK:
${weekCtx.week_context ?? ""}

FOODS FROM DATASET MATCHED TO THIS WEEK:
${weekCtx.food_matches ?? ""}

PER-FOOD EFFECTS FROM DATASET:
${weekCtx.food_detail ?? ""}

INSTRUCTIONS FOR PREGNANCY:
1. Build each meal around the dataset foods in food_matches
2. For baby_benefit: state what is developing this week from week_context, then explain how the meal supports it using baby effects from food_detail
3. For mother_benefit: use mother effects from food_detail, connect to her job or nutrient needs
4. Make recommendations specific to this exact week, not generic pregnancy advice
5. Each meal should use 1-3 foods from the dataset

---
IF journey_type is postpartum:

BREASTFEEDING AND MILK OPTIMIZATION CONTEXT:
${milkCtx?.milk_logic ?? ""}

KEY NUTRIENTS — blood role → milk role → baby benefit:
${milkCtx?.key_nutrients ?? ""}

BLOOD QUALITY SUPPORT:
${milkCtx?.blood_support ?? ""}

FOODS THAT DIRECTLY BOOST MILK:
${milkCtx?.milk_boosters ?? ""}

EVENING FEEDING AND SLEEP:
${milkCtx?.evening_feeding ?? ""}

ORAL HEALTH AND BABY MICROBIOME:
${milkCtx?.oral_health ?? ""}

ENVIRONMENT AND STRESS REGULATION:
${milkCtx?.environment ?? ""}

ELECTRICAL AND SCREEN EXPOSURE:
${milkCtx?.electrical ?? ""}

INSTRUCTIONS FOR POSTPARTUM:
1. Prioritise milk-boosting foods (oats, salmon, eggs, fennel, dates) in at least 2 meals
2. For baby_benefit: explain what the baby receives through the milk today based on what the mother eats
3. For mother_benefit: use the format — [food] improves [blood quality] → enriches milk with [nutrient] → baby receives [benefit]
4. For dinner and snacks: include tryptophan and magnesium-rich foods to support evening milk production and sleep
5. Include at least one probiotic food per day for oral and gut microbiome transfer to baby
6. Connect recommendations to her job nutrient needs where relevant

---
IF journey_type is trying_to_conceive:

INSTRUCTIONS FOR FERTILITY:
1. Focus on anti-inflammatory, hormone-balancing foods
2. For baby_benefit: write as fertility_benefit — explain how this meal supports egg quality, hormonal balance, or uterine environment
3. For mother_benefit: explain how this meal supports the mother's cycle, energy, or job-specific nutrient needs
4. Prioritise folate, iron, omega-3, antioxidants, and zinc
5. Connect to her female_nutrients and job risks

---
Respect the user's diet type in all cases — if vegetarian, avoid meat.

Return JSON with exactly these keys regardless of journey type:
{
  "breakfast": {
    "name": "",
    "description": "one sentence describing the meal",
    "nutrients": "comma-separated list of 2-4 key nutrients",
    "baby_benefit": "",
    "mother_benefit": ""
  },
  "lunch": {
    "name": "",
    "description": "",
    "nutrients": "",
    "baby_benefit": "",
    "mother_benefit": ""
  },
  "dinner": {
    "name": "",
    "description": "",
    "nutrients": "",
    "baby_benefit": "",
    "mother_benefit": ""
  },
  "snacks": {
    "name": "",
    "description": "",
    "nutrients": "",
    "baby_benefit": "",
    "mother_benefit": ""
  }
}`;

  try {
    const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 1400);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status: 502 });
  }
}