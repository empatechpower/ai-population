import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdminRequest } from "@/lib/apiAuth";
import { ADMIN_COLLECTIONS } from "@/lib/admin/schema";
import { enrichDocs } from "@/lib/admin/enrich";

function checkAccess(req: NextRequest, collection: string) {
  if (!ADMIN_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }
  return null;
}

export async function GET(req: NextRequest, { params }: { params: { collection: string; id: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const badCollection = checkAccess(req, params.collection);
  if (badCollection) return badCollection;

  const snap = await adminDb.collection(params.collection).doc(params.id).get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, any> = { _id: snap.id, ...snap.data() };
  await enrichDocs(params.collection, [data]);
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: { collection: string; id: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const badCollection = checkAccess(req, params.collection);
  if (badCollection) return badCollection;

  const { updates } = await req.json();
  if (!updates || typeof updates !== "object") {
    return NextResponse.json({ error: "Missing updates" }, { status: 400 });
  }
  await adminDb.collection(params.collection).doc(params.id).update(updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { collection: string; id: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const badCollection = checkAccess(req, params.collection);
  if (badCollection) return badCollection;

  await adminDb.collection(params.collection).doc(params.id).delete();
  return NextResponse.json({ ok: true });
}
