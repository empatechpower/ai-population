import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT =
  "You are a postpartum recovery specialist AI. Respond in valid JSON only. No markdown, no explanation.";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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
  const protocolData = protocolSnap.empty ? {} : protocolSnap.docs[0].data();

  const userPrompt = `Generate a personalized postpartum recovery protocol.

User:
Name: ${p.first_name ?? ""}
Age: ${p.age ?? ""}
Weeks postpartum: ${p.current_week ?? ""}
City: ${p.city ?? ""}
Job: ${p.job_type ?? ""}
Activity level: ${p.activity_level ?? ""}
Diet: ${p.diet_type ?? ""}
Her job risks: ${p.female_job_risks ?? ""}
Her key nutrients: ${p.female_nutrients ?? ""}
Partner job risks: ${p.male_job_risks ?? ""}
Today's protocol movement: ${protocolData.movement ?? ""}
Today's avoid: ${protocolData.avoid_today ?? ""}

Return JSON with exactly these keys:
- phase (string: the recovery phase name for this week — e.g. "Acute Recovery", "Active Recovery", "Rebuilding", "Integration")
- hormone_note (string, 2-3 sentences on the hormonal state at this exact postpartum week and what it means for the user's mood, energy and body)
- nutrition_focus (string, 2-3 sentences on the most important nutrients and foods for recovery at this week, referencing her job nutrient risks)
- movement_focus (string, 2 sentences on the safest and most beneficial movement for this exact postpartum week)
- supplements (comma-separated string of 4-5 specific supplements appropriate for this postpartum week)
- priorities (JSON array of 4 strings — the most important actions or focuses for this exact week)
- checkups (JSON array of strings — medical appointments or checks relevant to this postpartum week)
- avoid_today (string, 1-2 sentences on what to avoid this week based on her recovery stage and job risks)
- job_note (string, 1 sentence connecting her specific job risks to her recovery this week)`;

  try {
    const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 1000);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status: 502 });
  }
}