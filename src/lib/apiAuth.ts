import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "./firebaseAdmin";

// Vercel sends CRON_SECRET as a Bearer token automatically when it invokes
// a scheduled route (configured via vercel.json's `crons`) — this rejects
// anyone else calling the route directly.
export function verifyCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  return !!secret && authHeader === `Bearer ${secret}`;
}

// Verifies the request's Firebase ID token matches the uid it claims to act
// as. requireVerified defaults to true so a signed-up-but-unverified account
// can't bypass the client-side verify-email gate by calling these routes
// directly — the one exception is account deletion, which must stay
// reachable regardless of verification status.
export async function verifyRequestUser(
  req: NextRequest,
  expectedUid: string,
  { requireVerified = true }: { requireVerified?: boolean } = {},
): Promise<boolean> {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    if (decoded.uid !== expectedUid) return false;
    if (requireVerified && !decoded.email_verified) return false;
    return true;
  } catch {
    return false;
  }
}

// Verifies the request's Firebase ID token belongs to a user whose Firestore
// doc has is_admin === true. Reads via adminDb, which bypasses security
// rules, so this is trustworthy regardless of client-side rules — those
// protect the *write* path (stopping a user from self-granting is_admin);
// this protects the *authorization* path. Unlike verifyRequestUser, there's
// no expectedUid — admin routes legitimately act on other users' docs.
export async function verifyAdminRequest(req: NextRequest): Promise<{ uid: string } | null> {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const snap = await adminDb.collection("users").doc(decoded.uid).get();
    if (snap.data()?.is_admin !== true) return null;
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}