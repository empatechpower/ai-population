import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/apiAuth";
import { generateProtocolForUser } from "@/lib/generators/protocol";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!(await verifyRequestUser(req, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const protocol = await generateProtocolForUser(userId);
    return NextResponse.json(protocol);
  } catch (err: any) {
    const status = err.message === "Profile not found" ? 404 : 502;
    return NextResponse.json({ error: err.message || "AI generation failed" }, { status });
  }
}