import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";

const SYSTEM_PROMPT = "You are a prenatal and fertility movement specialist. Respond in valid JSON only.";

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
  const movementProtocol = protocolSnap.empty
    ? ""
    : (protocolSnap.docs[0].data().movement ?? "");

  const userPrompt = `Generate 3 personalized movement practices for today.

User:
Journey: ${p.journey_type ?? ""}
Activity level: ${p.activity_level ?? ""}
Job risks: ${p.female_job_risks ?? ""}
Today's movement protocol: ${movementProtocol}

Return JSON:
{
  "practices": [
    {
      "practice_id": "unique-id",
      "title": "Practice name",
      "subtitle": "Brief description",
      "duration": "~X min",
      "category": "Gentle|Moderate|Restorative",
      "exercises": [
        { "name": "Exercise name", "duration": "X min" },
        { "name": "Exercise name", "sets": "3 x 10" }
      ],
      "why": "1-2 sentences on why this matters today",
      "guidance": "Safety note if needed, else empty string"
    }
  ]
}`;

  try {
    const parsed = await generateJSON(SYSTEM_PROMPT, userPrompt, 1200);
    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status: 502 });
  }
}