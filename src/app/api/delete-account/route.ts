import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { stripe } from "@/lib/stripe";

const BATCH_LIMIT = 400;

async function deleteByField(collectionName: string, field: string, uid: string) {
  const snap = await adminDb.collection(collectionName).where(field, "==", uid).get();
  for (let i = 0; i < snap.docs.length; i += BATCH_LIMIT) {
    const batch = adminDb.batch();
    for (const doc of snap.docs.slice(i, i + BATCH_LIMIT)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return snap.docs.length;
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  // requireVerified: false — account deletion must stay reachable even for
  // an unverified account (e.g. someone who signed up, never verified, and
  // just wants out).
  if (!(await verifyRequestUser(req, userId, { requireVerified: false }))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRef = adminDb.collection("users").doc(userId);
  const profileSnap = await userRef.get();
  const profile = profileSnap.data() ?? {};

  // Cancel any active Stripe subscription — keep the customer record itself
  // for billing/tax retention, matching the privacy policy.
  if (profile.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
    } catch {
      // already canceled or nonexistent — fine, continue with deletion
    }
  }

  // Delete everything owned by this user across collections that key off
  // "user"/"author"/"sender".
  await deleteByField("protocols", "user", userId);
  await deleteByField("meals", "user", userId);
  await deleteByField("movementPractices", "user", userId);
  await deleteByField("journeyPhases", "user", userId);
  await deleteByField("milestones", "user", userId);
  await deleteByField("posts", "author", userId);
  await deleteByField("comments", "author", userId);
  await deleteByField("groupMessages", "sender", userId);

  // Remove membership from any groups (don't delete the group itself —
  // other members' data lives there too).
  const groupsSnap = await adminDb
    .collection("groups")
    .where("members", "array-contains", userId)
    .get();
  for (const groupDoc of groupsSnap.docs) {
    const members: string[] = groupDoc.data().members || [];
    await groupDoc.ref.update({
      members: members.filter((m) => m !== userId),
      member_count: Math.max(0, (groupDoc.data().member_count || members.length) - 1),
    });
  }

  await userRef.delete();
  await adminAuth.deleteUser(userId);

  return NextResponse.json({ deleted: true });
}
