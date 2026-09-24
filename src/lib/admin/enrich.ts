import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { ADMIN_SCHEMAS } from "./schema";

// Adds human-readable fields that don't live on the Firestore doc itself:
// email + signed-up date (from Firebase Auth) for users, and the owning
// user's email + first name for collections that point at a user.
export async function enrichDocs(collection: string, docs: Record<string, any>[]) {
  if (docs.length === 0) return docs;

  if (collection === "users") {
    const { users } = await adminAuth.getUsers(docs.map((d) => ({ uid: d._id })));
    const byUid = new Map(users.map((u) => [u.uid, u]));
    docs.forEach((d) => {
      const u = byUid.get(d._id);
      d.email = u?.email ?? null;
      d.signed_up = u ? Date.parse(u.metadata.creationTime) : null;
    });
    return docs;
  }

  const schema = ADMIN_SCHEMAS[collection];
  const lookupField = schema?.userLookupField;
  if (lookupField) {
    const uids = Array.from(new Set(docs.map((d) => d[lookupField]).filter(Boolean))) as string[];
    if (uids.length > 0) {
      const [{ users }, profileSnaps] = await Promise.all([
        adminAuth.getUsers(uids.map((uid) => ({ uid }))),
        adminDb.getAll(...uids.map((uid) => adminDb.collection("users").doc(uid))),
      ]);
      const emailByUid = new Map(users.map((u) => [u.uid, u.email]));
      const nameByUid = new Map(profileSnaps.map((s) => [s.id, s.data()?.first_name]));
      docs.forEach((d) => {
        d.user_email = emailByUid.get(d[lookupField]) ?? null;
        d.user_name = nameByUid.get(d[lookupField]) ?? null;
      });
    }
  }

  for (const ref of schema?.refLookups ?? []) {
    const ids = Array.from(new Set(docs.map((d) => d[ref.field]).filter(Boolean))) as string[];
    if (ids.length === 0) continue;
    const snaps = await adminDb.getAll(...ids.map((id) => adminDb.collection(ref.collection).doc(id)));
    const labelById = new Map(snaps.map((s) => [s.id, s.data()?.[ref.labelKey]]));
    docs.forEach((d) => {
      const label = labelById.get(d[ref.field]);
      d[ref.as] = typeof label === "string" && label.length > 60 ? label.slice(0, 60) + "…" : label ?? null;
    });
  }
  return docs;
}
