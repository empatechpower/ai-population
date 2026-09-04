import { NextRequest, NextResponse } from "next/server";
import { verifyCronRequest } from "@/lib/apiAuth";
import { sendToSubscribedWhere } from "@/lib/webPush";
import { isSunnyToday } from "@/lib/weather";

export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sent = await sendToSubscribedWhere(
    {
      title: "☀️ Sunshine",
      body: "Don't miss the best time for some sunshine today.",
    },
    isSunnyToday,
  );
  return NextResponse.json({ sent });
}
