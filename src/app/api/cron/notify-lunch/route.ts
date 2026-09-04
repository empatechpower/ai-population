import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/apiAuth";
import { sendToAllSubscribed } from "@/lib/webPush";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await sendToAllSubscribed({
    title: "☀️ Lunch",
    body: "Don't forget your important nutrition for lunch.",
  });
  return NextResponse.json({ sent });
}
