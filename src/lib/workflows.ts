// ─────────────────────────────────────────────────────────────
// AI-generation triggers — all now run on OpenAI + Firestore via our own
// /api/* routes instead of Bubble's backend workflows.
//
// triggerJoinGroup/triggerLeaveGroup are plain membership mutations with
// no AI involved, so they're on Firestore directly (no API route needed).
// ─────────────────────────────────────────────────────────────
import { getUserId } from "./auth";
import { doc, updateDoc, arrayUnion, arrayRemove, increment } from "firebase/firestore";
import { db, auth } from "./firebase";
import { MilkContext, WeekContext } from "@/data/weekContext";

export async function triggerOnboardingComplete(userId: string) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/onboarding-complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not complete onboarding");
  }
  return res.json();
}

export async function triggerGenerateProtocol(userId: string) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-protocol", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate protocol");
  }
  return res.json();
}

export async function triggerGenerateNutrition(
  userId: string,
  weekCtx: WeekContext,
  milkCtx?: MilkContext,
) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-nutrition", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId, weekCtx, milkCtx }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate nutrition plan");
  }
  return res.json();
}

// No dedicated Bubble workflow ever existed for this — recalibrating just
// means regenerating today's protocol from the latest profile data.
export async function triggerRecalibrate(userId: string) {
  return triggerGenerateProtocol(userId);
}

export async function triggerGenerateMovement() {
  const userId = getUserId();
  const idToken = await auth.currentUser?.getIdToken();
  if (!userId || !idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-movement", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate movement plan");
  }
  return res.json();
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
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-journey", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate journey");
  }
  return res.json();
}
export async function triggerGenerateWeekDetail() {
  const userId = getUserId();
  const idToken = await auth.currentUser?.getIdToken();
  if (!userId || !idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-week-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate week detail");
  }
  return res.json();
}
export async function triggerGenerateRecoveryDetail() {
  const userId = getUserId();
  const idToken = await auth.currentUser?.getIdToken();
  if (!userId || !idToken) throw new Error("Not authenticated");
  const res = await fetch("/api/generate-recovery-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Could not generate recovery detail");
  }
  return res.json();
}