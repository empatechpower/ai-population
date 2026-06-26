// ─────────────────────────────────────────────────────────────
// Bubble Data API + Workflow API — complete endpoint reference
//
// BUBBLE BASE URL: set in .env.local as NEXT_PUBLIC_BUBBLE_BASE_URL
// e.g.  https://your-app.bubbleapps.io/version-test/api/1.1
//
// ── Data API endpoints (auto-generated when you expose types) ──
//   GET    /api/1.1/obj/user/me                  → current user profile
//   PATCH  /api/1.1/obj/user/me                  → update current user
//   GET    /api/1.1/obj/protocol?constraints=[]   → search protocols
//   GET    /api/1.1/obj/protocol/<id>             → single protocol
//   POST   /api/1.1/obj/protocol                 → create protocol
//   GET    /api/1.1/obj/meal?constraints=[]       → search meals
//   POST   /api/1.1/obj/meal                     → create meal
//   GET    /api/1.1/obj/post                     → list posts
//   POST   /api/1.1/obj/post                     → create post
//   GET    /api/1.1/obj/comment?constraints=[]   → search comments
//   POST   /api/1.1/obj/comment                  → create comment
//   GET    /api/1.1/obj/message?constraints=[]   → search messages
//   POST   /api/1.1/obj/message                  → create message
//
// ── Workflow API endpoints (you build these in Bubble backend) ──
//   POST   /api/1.1/wf/signup                    → create + login user
//   POST   /api/1.1/wf/login                     → login user
//   POST   /api/1.1/wf/onboarding_complete        → save profile + trigger AI
//   POST   /api/1.1/wf/process_protocol           → AI → create Protocol record
//   POST   /api/1.1/wf/process_score             → AI → save fertility_score
//   POST   /api/1.1/wf/generate_nutrition         → AI → create Meal records
//   POST   /api/1.1/wf/recalibrate               → re-run score + protocol
//   POST   /api/1.1/wf/like_post                  → increment post likes
//   POST   /api/1.1/wf/update_user               → save profile fields (alt to PATCH)
//   GET    /api/1.1/wf/get_current_user           → return current user object
//   GET    /api/1.1/wf/get_todays_protocol        → return today's protocol
//   GET    /api/1.1/wf/get_meals?protocol=<id>    → return meals for protocol
//
// NOTE ON WORKFLOW vs DATA API:
//   If you created custom GET workflows (get_current_user, get_todays_protocol,
//   get_meals) use those. If you enabled the Data API and exposed the types,
//   you can use /obj/ endpoints directly — they're more reliable.
//   This file tries the Data API first with workflow fallbacks.
// ─────────────────────────────────────────────────────────────
import { bubbleGet, bubblePost, bubblePatch } from "./bubble";
import { getToken, getUserId } from "./auth";

function tok(): string {
  const t = getToken();
  if (!t) throw new Error("Not authenticated");
  return t;
}

function constraints(
  list: { key: string; constraint_type: string; value: unknown }[],
) {
  return JSON.stringify(list);
}

// ── Profile ──────────────────────────────────────────────────
// Uses Data API /obj/user/me — requires Data API enabled + User exposed
// Falls back to /wf/get_current_user workflow if you built one
export async function getProfile() {
  const res = await bubbleGet("/wf/get_current_user", undefined, tok());
  return res.response.results;
}

// Uses Data API PATCH — requires privacy rule: Current User can Modify all fields
// Falls back to /wf/update_user workflow
export async function updateProfile(data: Record<string, unknown>) {
  // Bubble PATCH /obj/user/me updates the authenticated user's fields
  return bubblePost("/wf/update_user", data, tok());
}

// ── Protocol ─────────────────────────────────────────────────
export async function getProtocol(id: string) {
  const res = await bubbleGet(`/obj/protocol/${id}`, undefined, tok());
  return res.response;
}

// Fetch today's protocol — tries Data API search first, then workflow
export async function getTodayProtocol() {
  const res = await bubbleGet("/wf/get_todays_protocol", undefined, tok());
  return res.response?.results ?? null;
}

// ── Meals ─────────────────────────────────────────────────────
// Tries Data API search first, falls back to custom workflow
export async function getMeals(protocolId: string) {
  const res = await bubbleGet(
    "/wf/get_meals",
    {
      protocol: protocolId,
    },
    tok(),
  );
  return res.response?.results ?? [];
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
  const res = await bubblePost("/wf/create_meal", data, tok());
  return res;
}
export async function createMovement(data: {
  protocol: string;
  practice_id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  exercises_json: string;
  why: string;
  guidance: string;
}): Promise<string> {
  const res = await bubblePost("/wf/create_movement", data, tok());
  return res.id as string;
}
export interface MovementPractice {
  _id?: string;
  protocol: string;
  practice_id: string;
  title: string;
  subtitle: string;
  duration: string;
  category: string;
  exercises: string; // JSON string — parse before use
  why: string;
  guidance?: string;
}

export async function getMovementPractices(
  protocolId: string,
): Promise<MovementPractice[]> {
  try {
    const res = await bubbleGet(
      "/wf/getMovementPractices",
      {
        protocol: protocolId,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

// ── Groups ────────────────────────────────────────────────────
export async function getMyGroups(): Promise<any[]> {
  try {
    const uid = getUserId();
    if (!uid) return [];
    const res = await bubbleGet("/wf/getMyGroups", undefined, tok());
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function getAllGroups(): Promise<any[]> {
  try {
    const res = await bubbleGet("/wf/getAllGroups", undefined, tok());
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function getGroupPosts(groupId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/getGroupPosts",
      {
        groupId: groupId,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}
export async function getPost(postId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/get_a_post",
      {
        postId: postId,
      },
      tok(),
    );
    return res.response?.results;
  } catch {
    return [];
  }
}
export async function getGroup(groupId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/get_a_group",
      {
        groupId: groupId,
      },
      tok(),
    );
    return res.response?.results;
  } catch {
    return [];
  }
}

export async function getGroupMessages(groupId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/getGroupMessages",
      {
        groupId: groupId,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function sendGroupMessage(
  groupId: string,
  content: string,
): Promise<string> {
  const res = await bubblePost(
    "/wf/sendGroupMessage",
    { groupId: groupId, content },
    tok(),
  );
  return res.id as string;
}

export async function createGroupPost(
  groupId: string,
  content: string,
  image: string,
): Promise<string> {
  const res = await bubblePost(
    "/wf/createGroupPost",
    {
      groupId: groupId,
      content,
      image: image,
    },
    tok(),
  );
  return res.id as string;
}
// ── Posts ─────────────────────────────────────────────────────
// Uses Data API /obj/post — requires Post type exposed in Data API
export async function getPosts(): Promise<any[]> {
  try {
    const res = await bubbleGet("/wf/get_all_posts", undefined, tok());
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function createPost(content: string): Promise<string> {
  // Bubble auto-attaches the author from the session token
  const res = await bubblePost("/obj/post", { content }, tok());
  return res.id as string;
}

// ── Like post ─────────────────────────────────────────────────
// Uses workflow (handles toggle logic safely)
export async function likePost(postId: string) {
  return bubblePost("/wf/like_post", { post_id: postId }, tok());
}

// ── Comments ─────────────────────────────────────────────────
export async function getComments(postId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/getComments",
      {
        postId: postId,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function createComment(
  postId: string,
  content: string,
): Promise<string> {
  const res = await bubblePost(
    "/wf/createComment",
    { postId: postId, content },
    tok(),
  );
  return res.id as string;
}

// ── Messages ─────────────────────────────────────────────────
// threadId is a string field on Message (use 'community' as the global thread)
export async function getMessages(threadId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/obj/message",
      {
        constraints: constraints([
          { key: "thread", constraint_type: "equals", value: threadId },
        ]),
        sort_field: "Created Date",
        descending: "false",
        limit: 50,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function sendMessage(
  threadId: string,
  content: string,
): Promise<string> {
  const res = await bubblePost(
    "/obj/message",
    { thread: threadId, content },
    tok(),
  );
  return res.id as string;
}

export async function getJourneyPhases(): Promise<any[]> {
  try {
    const res = await bubbleGet("/wf/journeyphase", undefined, tok());
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

export async function getMilestones(phaseId: string): Promise<any[]> {
  try {
    const res = await bubbleGet(
      "/wf/milestone",
      {
        phaseId: phaseId,
      },
      tok(),
    );
    return res.response?.results ?? [];
  } catch {
    return [];
  }
}

// export async function createJourneyPhase(data: {
//   protocol: string;
//   phase_number: number;
//   title: string;
//   week_range: string;
//   status: string;
// }): Promise<string> {
//   const res = await bubblePost("/wf/create_journeyphase", data, tok());
//   return res._id as string;
// }
export async function createJourneyPhase(data: {
  protocol: string;
  phase_number: number;
  title: string;
  week_range: string;
  status: string;
}): Promise<string> {
  const res = await bubblePost("/wf/create_journeyphase", data, tok());
  return res?.response?.results?._id as string;
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
  const res = await bubblePost("/wf/create_milestone", data, tok());
  return res.id as string;
}
export async function getWeekDetail(weekNumber: number): Promise<any | null> {
  try {
    const res = await bubbleGet(
      "/wf/get_weekdetail",
      {
        week_number: weekNumber,
      },
      tok(),
    );
    return res.response?.results ?? null;
  } catch {
    return null;
  }
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
  const res = await bubblePost("/wf/create_weekdetail", data, tok());
  return res?.response?.results?._id as string;
}

// ── Recovery Detail (Postpartum) ─────────────────────────────
export async function getRecoveryDetail(
  weekNumber: number,
): Promise<any | null> {
  try {
    const res = await bubbleGet(
      "/wf/get_recoverydetail",
      {
        week_number: weekNumber,
      },

      tok(),
    );
    return res.response?.results ?? null;
  } catch {
    return null;
  }
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
  const res = await bubblePost("/wf/create_recoverydetail", data, tok());
  return res?.response?.results?._id as string;
}
// ── Single milestone by ID ────────────────────────────────────
export async function getMilestone(milestoneId: string): Promise<any | null> {
  try {
    const res = await bubbleGet(
      "/wf/get_a_milestone",
      {
        milestoneId: milestoneId,
      },
      tok(),
    );
    return res.response?.results;
  } catch {
    return null;
  }
}
