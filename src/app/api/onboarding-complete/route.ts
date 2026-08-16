import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateJSON } from "@/lib/openai";
import { generateProtocolForUser } from "@/lib/generators/protocol";

const SCORE_SYSTEM_PROMPT = "You are a fertility optimization AI. Respond in valid JSON only.";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!(await verifyRequestUser(req, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileRef = adminDb.collection("users").doc(userId);
  const profileSnap = await profileRef.get();
  if (!profileSnap.exists) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  const p = profileSnap.data()!;

  const scorePrompt = `Calculate fertility optimization score (0-100) for: Age: ${p.age ?? ""}, Partner age: ${p.partner_age ?? ""}, Journey: ${p.journey_type ?? ""}, Activity: ${p.activity_level ?? ""}, Diet: ${p.diet_type ?? ""}, Sun exposure: ${p.sun_exposure ?? ""}. Return JSON with: score (number), score_summary (one sentence string).`;

  try {
    const scoreResult = await generateJSON(SCORE_SYSTEM_PROMPT, scorePrompt, 200);
    await profileRef.update({
      fertility_score: scoreResult.score ?? null,
      score_summary: scoreResult.score_summary ?? "",
    });

    const protocol = await generateProtocolForUser(userId);

    return NextResponse.json({
      score: scoreResult.score,
      score_summary: scoreResult.score_summary,
      protocol,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Onboarding completion failed" }, { status: 502 });
  }
}