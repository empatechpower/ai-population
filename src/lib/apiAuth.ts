import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";

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