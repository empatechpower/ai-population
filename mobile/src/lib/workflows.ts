// ─────────────────────────────────────────────────────────────
// AI-generation triggers — call the same Next.js /api/generate-* routes
// the web app uses (OpenAI + Firestore), authenticated with a Firebase ID
// token. EXPO_PUBLIC_API_BASE_URL points at that Next.js server.
//
// triggerJoinGroup/triggerLeaveGroup are plain membership mutations with
// no AI involved, so they're on Firestore directly (no API route needed).
// ─────────────────────────────────────────────────────────────
import { getUserId } from "./auth";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db, auth } from "./firebase";
import { MilkContext, WeekContext } from "@/data/weekContext";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL;

async function callApi(path: string, body: Record<string, unknown>) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not authenticated");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Request to ${path} failed`);
  }
  return res.json();
}

export async function triggerOnboardingComplete(userId: string) {
  return callApi("/api/onboarding-complete", { userId });
}

export async function triggerGenerateProtocol(userId: string) {
  return callApi("/api/generate-protocol", { userId });
}

export async function triggerGenerateNutrition(
  userId: string,
  weekCtx: WeekContext,
  milkCtx?: MilkContext,
) {
  return callApi("/api/generate-nutrition", { userId, weekCtx, milkCtx });
}

// No dedicated Bubble workflow ever existed for this — recalibrating just
// means regenerating today's protocol from the latest profile data.
export async function triggerRecalibrate(userId: string) {
  return triggerGenerateProtocol(userId);
}

export async function triggerGenerateMovement() {
  const userId = getUserId();
  if (!userId) throw new Error("Not authenticated");
  return callApi("/api/generate-movement", { userId });
}

// ── Group membership (Firestore, no AI involved) ────────────────
export async function triggerJoinGroup(groupId: string) {
  const uid = getUserId();
  if (!uid) throw new Error("Not authenticated");
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion(uid),
    member_count: increment(1),
  });
}

export async function triggerLeaveGroup(groupId: string) {
  const uid = getUserId();
  if (!uid) throw new Error("Not authenticated");
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(uid),
    member_count: increment(-1),
  });
}

export async function triggerGenerateJourney(userId: string) {
  return callApi("/api/generate-journey", { userId });
}

export async function triggerGenerateWeekDetail() {
  const userId = getUserId();
  if (!userId) throw new Error("Not authenticated");
  return callApi("/api/generate-week-detail", { userId });
}

export async function triggerGenerateRecoveryDetail() {
  const userId = getUserId();
  if (!userId) throw new Error("Not authenticated");
  return callApi("/api/generate-recovery-detail", { userId });
}