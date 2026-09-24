import { NextRequest, NextResponse } from "next/server";
import { FieldPath } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { verifyAdminRequest } from "@/lib/apiAuth";
import { ADMIN_COLLECTIONS, ADMIN_SCHEMAS } from "@/lib/admin/schema";
import { enrichDocs } from "@/lib/admin/enrich";

export async function GET(req: NextRequest, { params }: { params: { collection: string } }) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ADMIN_COLLECTIONS.includes(params.collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 400 });
  }

  const url = new URL(req.url);
  const pageSize = Math.min(Number(url.searchParams.get("pageSize")) || 25, 100);
  const cursor = url.searchParams.get("cursor");
  const filterField = url.searchParams.get("filterField");
  const filterValue = url.searchParams.get("filterValue");

  let query: FirebaseFirestore.Query = adminDb.collection(params.collection);
  if (filterField && filterValue) {
    query = query.where(filterField, "==", filterValue);
  }
  query = query.orderBy(FieldPath.documentId()).limit(pageSize);

  if (cursor) {
    const cursorSnap = await adminDb.collection(params.collection).doc(cursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snap = await query.get();
  const docs: Record<string, any>[] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
  await enrichDocs(params.collection, docs);
  const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1].id : null;

  return NextResponse.json({ docs, nextCursor });
}

export async function POST(req: NextRequest, { params }: { params: { collection: string } }) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schema = ADMIN_SCHEMAS[params.collection];
  if (!schema?.createFields) {
    return NextResponse.json({ error: "Creating records isn't supported here" }, { status: 400 });
  }

  const { data } = await req.json();
  const input: Record<string, any> = {};
  for (const key of schema.createFields) {
    const value = typeof data?.[key] === "string" ? data[key].trim() : "";
    if (value) input[key] = value;
  }

  let doc: Record<string, any>;
  if (params.collection === "groups") {
    if (!input.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    doc = { ...input, members: [], member_count: 0, "Created Date": Date.now() };
  } else {
    if (!input.content) return NextResponse.json({ error: "Content is required" }, { status: 400 });
    if (input.group) {
      const g = await adminDb.collection("groups").doc(input.group).get();
      if (!g.exists) return NextResponse.json({ error: "Group not found" }, { status: 400 });
    }
    doc = {
      ...input,
      author: admin.uid,
      author_name: input.author_name || "Bleom Team",
      likes: 0,
      likedBy: [],
      "Created Date": Date.now(),
    };
  }

  const ref = await adminDb.collection(params.collection).add(doc);
  return NextResponse.json({ id: ref.id });
}
