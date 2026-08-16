import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT = "You are a prenatal health AI. Respond in valid JSON only.";

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

  const userPrompt = `Generate a detailed pregnancy week protocol.

User:
Name: ${p.first_name ?? ""}
Age: ${p.age ?? ""}
Current week: ${p.current_week ?? ""}
City: ${p.city ?? ""}
Job: ${p.job_type ?? ""}
Diet: ${p.diet_type ?? ""}
Job risks: ${p.female_job_risks ?? ""}
Job nutrients needed: ${p.female_nutrients ?? ""}
Partner job risks: ${p.male_job_risks ?? ""}
Baby focus from protocol: ${babyFocus}

Return JSON with exactly these keys:
- trimester (string: "First", "Second", or "Third")
- baby_milestone (string, 2-3 sentences on what is happening with baby at this exact week)
- nutrition_focus (string, 2-3 sentences on what to eat this week referencing job nutrients)
- movement_focus (string, 2 sentences on safe movement for this week)
- supplements (comma-separated string of 4-5 specific supplements for this week)
- appointments (JSON array of strings listing relevant checks or scans for this week)
- avoid_today (string, 1-2 sentences on what to avoid this week)
- job_note (string, 1 sentence connecting job risks to pregnancy this week)`;

  try {
    const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 800);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status: 502 });
  }
}