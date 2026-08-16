import { adminDb } from "@/lib/firebaseAdmin";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT =
  "You are a fertility and pregnancy optimization AI. Always respond in valid JSON only. No markdown, no explanation.";

function isSameCalendarDay(a: number, b: number): boolean {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Shared by /api/generate-protocol (manual trigger) and /api/onboarding-complete
// (first protocol right after signup) — same generation, same prompt.
export async function generateProtocolForUser(userId: string) {
  const profileSnap = await adminDb.collection("users").doc(userId).get();
  if (!profileSnap.exists) {
    throw new Error("Profile not found");
  }
  const p = profileSnap.data()!;

  const userPrompt = `Generate a personalized daily protocol.

User profile:
Name: ${p.first_name ?? ""}
Age: ${p.age ?? ""}
Journey: ${p.journey_type ?? ""}
City: ${p.city ?? ""}
Job: ${p.job_type ?? ""}
Activity level: ${p.activity_level ?? ""}
Diet: ${p.diet_type ?? ""}
Partner age: ${p.partner_age ?? ""}
Partner job: ${p.partner_job_type ?? ""}

Job risk intelligence:
Her job risks: ${p.female_job_risks ?? ""}
Her key nutrients: ${p.female_nutrients ?? ""}
Recommended foods for her: ${p.female_foods ?? ""}
His job risks: ${p.male_job_risks ?? ""}
His key nutrients: ${p.male_nutrients ?? ""}
Recommended foods for him: ${p.male_foods ?? ""}
Sperm health note: ${p.male_sperm_impact ?? ""}
Hormone note: ${p.male_hormone_impact ?? ""}
Baby development note: ${p.baby_impact ?? ""}

Return JSON with exactly these keys:
- nutrition_plan (string, 1-2 sentences referencing her job nutrients)
- supplements (comma-separated string of 3-5 supplements based on her nutrient risks)
- movement (string, 1-2 sentences)
- avoid_today (string, 1-2 sentences referencing her job risks)
- fertility_tip (string, 1-2 sentences with a job-specific insight)
- female_risk_summary (string, 1 sentence summarizing her job fertility impact)
- male_risk_summary (string, 1 sentence summarizing his job sperm/hormone impact)
- baby_focus (string, 1 sentence on what to prioritize for baby development)`;

  const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 1200);

  const fields = {
    user: userId,
    nutrition_plan: parsed.nutrition_plan ?? "",
    supplements: parsed.supplements ?? "",
    movement: parsed.movement ?? "",
    avoid_today: parsed.avoid_today ?? "",
    fertility_tip: parsed.fertility_tip ?? "",
    female_risk_summary: parsed.female_risk_summary ?? "",
    male_risk_summary: parsed.male_risk_summary ?? "",
    baby_focus: parsed.baby_focus ?? "",
  };

  // Upsert: recalibrating (or any repeat call) on the same day updates
  // today's protocol in place instead of creating a duplicate — meals,
  // movement, and journey phases are all keyed off this doc's id, so a new
  // id per call would silently orphan everything already generated today.
  const existing = await adminDb
    .collection("protocols")
    .where("user", "==", userId)
    .orderBy("Created Date", "desc")
    .limit(1)
    .get();

  if (!existing.empty && isSameCalendarDay(existing.docs[0].data()["Created Date"], Date.now())) {
    const ref = existing.docs[0].ref;
    await ref.update(fields);
    return { _id: ref.id, ...existing.docs[0].data(), ...fields };
  }

  const createdDate = Date.now();
  const ref = await adminDb.collection("protocols").add({ ...fields, "Created Date": createdDate });
  return { _id: ref.id, ...fields, "Created Date": createdDate };
}