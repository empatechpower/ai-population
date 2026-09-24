import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdminRequest } from "@/lib/apiAuth";
import { ADMIN_COLLECTIONS } from "@/lib/admin/schema";

export async function GET(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const counts = await Promise.all(
    ADMIN_COLLECTIONS.map(async (collection) => {
      const agg = await adminDb.collection(collection).count().get();
      return [collection, agg.data().count] as const;
    }),
  );

  return NextResponse.json({ counts: Object.fromEntries(counts) });
}
