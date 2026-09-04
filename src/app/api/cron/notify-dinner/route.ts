import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/apiAuth";
import { sendToAllSubscribed } from "@/lib/webPush";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await sendToAllSubscribed({
    title: "🌙 Dinner",
    body: "Don't forget your important nutrition for dinner.",
  });
  return NextResponse.json({ sent });
}
