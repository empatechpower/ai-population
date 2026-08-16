// ─────────────────────────────────────────────────────────────
// Firestore-backed app data layer — replaces Bubble's Data API.
//
// NOTE: this only covers plain CRUD (profile, protocols, meals,
// movement, groups, posts, comments, messages, journey content).
// The AI-generation logic that used to live inside Bubble's backend
// workflows (turning a profile into a protocol, meals, a movement
// plan, a journey, week/recovery content) is NOT reimplemented here —
// see workflows.ts for what's still pending on that front.
// ─────────────────────────────────────────────────────────────
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  arrayRemove,
  arrayUnion,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "./firebase";
import { getUserId } from "./auth";

function uid(): string {
  const id = getUserId();
  if (!id) throw new Error("Not authenticated");
  return id;
}

async function displayName(userId: string): Promise<string> {
  const snap = await getDoc(doc(db, "users", userId));
  return (snap.data()?.first_name as string) || "Member";
}

// ── Profile ──────────────────────────────────────────────────
export async function getProfile(): Promise<any> {
  const snap = await getDoc(doc(db, "users", uid()));
  if (!snap.exists()) throw new Error("Profile not found");
  return { _id: snap.id, ...snap.data() };
}

export async function updateProfile(data: Record<string, unknown>) {
  await setDoc(doc(db, "users", uid()), data, { merge: true });
}

// ── Protocol ─────────────────────────────────────────────────
export async function getTodayProtocol(): Promise<any> {
  const q = query(
    collection(db, "protocols"),
    where("user", "==", uid()),
    orderBy("Created Date", "desc"),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { _id: d.id, ...d.data() };
}

// ── Meals ─────────────────────────────────────────────────────
export async function getMeals(protocolId: string): Promise<any[]> {
  const q = query(collection(db, "meals"), where("protocol", "==", protocolId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function createMeal(data: {
  protocol: string;
  meal_type: string;
  name: string;
  description: string;
  nutrients: string;
  baby_benefit?: string;
  mother_benefit?: string;
}) {
  const ref = await addDoc(collection(db, "meals"), { ...data, user: uid() });
  return ref.id;
}

// ── Movement ─────────────────────────────────────────────────
export async function createMovement(data: {
  protocol: string;
  practice_id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  exercises_json: string; // JSON string built by the caller
  why: string;
  guidance: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "movementPractices"), {
    ...data,
    exercises_json: JSON.parse(data.exercises_json || "[]"),
    user: uid(),
  });
  return ref.id;
}

export async function getMovementPractices(protocolId: string): Promise<any[]> {
  const q = query(
    collection(db, "movementPractices"),
    where("protocol", "==", protocolId),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

// ── Groups ────────────────────────────────────────────────────
export async function getMyGroups(): Promise<any[]> {
  const q = query(collection(db, "groups"), where("members", "array-contains", uid()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function getAllGroups(): Promise<any[]> {
  const snap = await getDocs(collection(db, "groups"));
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function getGroupPosts(groupId: string): Promise<any[]> {
  const q = query(
    collection(db, "posts"),
    where("group", "==", groupId),
    orderBy("Created Date", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function getPost(postId: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "posts", postId));
  if (!snap.exists()) return null;
  return { _id: snap.id, ...snap.data() };
}

export async function getGroup(groupId: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists()) return null;
  return { _id: snap.id, ...snap.data() };
}

export async function getGroupMessages(groupId: string): Promise<any[]> {
  const q = query(
    collection(db, "groupMessages"),
    where("group", "==", groupId),
    orderBy("Created Date", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function sendGroupMessage(
  groupId: string,
  content: string,
): Promise<string> {
  const id = uid();
  const ref = await addDoc(collection(db, "groupMessages"), {
    group: groupId,
    content,
    sender: id,
    sender_name: await displayName(id),
    "Created Date": Date.now(),
  });
  return ref.id;
}

export async function createGroupPost(
  groupId: string,
  content: string,
  image: string,
): Promise<string> {
  const id = uid();
  const ref = await addDoc(collection(db, "posts"), {
    group: groupId,
    content,
    Image: image,
    author: id,
    author_name: await displayName(id),
    likes: 0,
    "Created Date": Date.now(),
  });
  return ref.id;
}

// ── Posts ─────────────────────────────────────────────────────
export async function getPosts(): Promise<any[]> {
  const q = query(collection(db, "posts"), orderBy("Created Date", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function createPost(content: string): Promise<string> {
  const id = uid();
  const ref = await addDoc(collection(db, "posts"), {
    content,
    author: id,
    author_name: await displayName(id),
    likes: 0,
    "Created Date": Date.now(),
  });
  return ref.id;
}

// ── Like post (toggle, safe against double-counting) ───────────
export async function likePost(postId: string) {
  const id = uid();
  const ref = doc(db, "posts", postId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const likedBy: string[] = snap.data()?.likedBy || [];
    if (likedBy.includes(id)) {
      tx.update(ref, { likedBy: arrayRemove(id), likes: increment(-1) });
    } else {
      tx.update(ref, { likedBy: arrayUnion(id), likes: increment(1) });
    }
  });
}

// ── Comments ─────────────────────────────────────────────────
export async function getComments(postId: string): Promise<any[]> {
  const q = query(
    collection(db, "comments"),
    where("post", "==", postId),
    orderBy("Created Date", "asc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function createComment(
  postId: string,
  content: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "comments"), {
    post: postId,
    content,
    author: uid(),
    "Created Date": Date.now(),
  });
  return ref.id;
}

// ── Journey phases / milestones ─────────────────────────────
export async function getJourneyPhases(): Promise<any[]> {
  const q = query(collection(db, "journeyPhases"), where("user", "==", uid()));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function getMilestones(phaseId: string): Promise<any[]> {
  const q = query(collection(db, "milestones"), where("phase", "==", phaseId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
}

export async function createJourneyPhase(data: {
  protocol: string;
  phase_number: number;
  title: string;
  week_range: string;
  status: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "journeyPhases"), { ...data, user: uid() });
  return ref.id;
}

export async function createMilestone(data: {
  phase: string;
  week_label: string;
  title: string;
  summary: string;
  status: string;
  what_happening: string;
  focus_goals: string;
  actions: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "milestones"), { ...data, user: uid() });
  return ref.id;
}

export async function getMilestone(milestoneId: string): Promise<any | null> {
  const snap = await getDoc(doc(db, "milestones", milestoneId));
  if (!snap.exists()) return null;
  return { _id: snap.id, ...snap.data() };
}

// ── Week Detail (pregnancy) ────────────────────────────────────
export async function getWeekDetail(weekNumber: number): Promise<any | null> {
  const q = query(
    collection(db, "weekDetails"),
    where("week_number", "==", weekNumber),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { _id: d.id, ...d.data() };
}

export async function createWeekDetail(data: {
  week_number: number;
  trimester: string;
  baby_milestone: string;
  nutrition_focus: string;
  movement_focus: string;
  supplements: string;
  appointments: string;
  avoid_today: string;
  job_note: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "weekDetails"), data);
  return ref.id;
}

// ── Recovery Detail (Postpartum) ─────────────────────────────
export async function getRecoveryDetail(weekNumber: number): Promise<any | null> {
  const q = query(
    collection(db, "recoveryDetails"),
    where("week_number", "==", weekNumber),
    limit(1),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { _id: d.id, ...d.data() };
}

export async function createRecoveryDetail(data: {
  week_number: number;
  phase: string;
  hormone_note: string;
  nutrition_focus: string;
  movement_focus: string;
  supplements: string;
  priorities: string;
  checkups: string;
  avoid_today: string;
  job_note: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, "recoveryDetails"), data);
  return ref.id;
}