import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT = "You are a fertility and pregnancy optimization AI.";

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
  const babyFocus = protocolSnap.empty ? "" : (protocolSnap.docs[0].data().baby_focus ?? "");

  const userPrompt = `Generate a personalized journey roadmap.

User:
Name: ${p.first_name ?? ""}
Age: ${p.age ?? ""}
Journey: ${p.journey_type ?? ""}
Current week: ${p.current_week ?? ""}
City: ${p.city ?? ""}
Job: ${p.job_type ?? ""}
Activity: ${p.activity_level ?? ""}
Diet: ${p.diet_type ?? ""}
Job risks: ${p.female_job_risks ?? ""}
Partner job risks: ${p.male_job_risks ?? ""}
Baby focus today: ${babyFocus}

STRICT RULES:
- Return ONLY valid JSON (no markdown, no text)
- Do NOT include explanations
- Use ONLY the structure below
- status MUST be one of: "completed", "current", "upcoming"
- focus_goals and actions MUST be arrays of strings
- Do NOT add extra fields

Return JSON:
{
  "phases": [
    {
      "phase_number": 1,
      "title": "",
      "week_range": "",
      "status": "completed|current|upcoming",
      "milestones": [
        {
          "week_label": "",
          "title": "",
          "summary": "",
          "status": "completed|current|upcoming",
          "what_happening": "",
          "focus_goals": [""],
          "actions": [""]
        }
      ]
    }
  ]
}`;

  try {
    const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 2000);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status: 502 });
  }
}