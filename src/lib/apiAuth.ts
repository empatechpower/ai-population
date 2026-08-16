import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";

// Verifies the request's Firebase ID token matches the uid it claims to act as.
export async function verifyRequestUser(
  req: NextRequest,
  expectedUid: string,
): Promise<boolean> {
  const idToken = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!idToken) return false;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid === expectedUid;
  } catch {
    return false;
  }
}