// ─────────────────────────────────────────────────────────────
// Bubble Workflow API
// All backend workflows use POST (not GET).
// Parameters are sent as JSON body.
// ─────────────────────────────────────────────────────────────
import { bubbleGet, bubblePost } from "./bubble";
import { getToken } from "./auth";
import { Job } from "@/data/job_index";
import { OnboardingData } from "@/store/onboarding";
import { MilkContext, WeekContext } from "@/data/weekContext";

function tok(): string {
  const t = getToken();
  if (!t) throw new Error("Not authenticated");
  return t;
}

// export async function triggerOnboardingComplete(
//   userId: string,
//   profileData: OnboardingData,
//   femaleJob: Job | null,
//   maleJob: Job | null,
// ) {
//   return bubblePost('/wf/onboarding_complete', {
//     calling_user:             userId,
//     first_name:               profileData.first_name,
//     age:                      Number(profileData.age) || 0,
//     journey_type:             profileData.journey_type,
//     target_conception_season: profileData.target_conception_season,
//     previous_children:        Number(profileData.previous_children) || 0,
//     nationality:              profileData.nationality,
//     country:                  profileData.country,
//     city:                     profileData.city,
//     job_type:                 profileData.job_type,
//     activity_level:           profileData.activity_level,
//     diet_type:                profileData.diet_type,
//     sun_exposure:             profileData.sun_exposure,
//     partner_age:              Number(profileData.partner_age) || 0,
//     partner_job_type:         profileData.partner_job_type,
//     partner_activity:         profileData.partner_activity,
//     partner_diet:             profileData.partner_diet,
//     female_job_risks:   femaleJob?.common_risks.join(', ')       ?? '',
//     female_nutrients:   femaleJob?.nutrient_risks.join(', ')     ?? '',
//     female_foods:       femaleJob?.recommended_foods?.join(', ') ?? '',
//     male_job_risks:     maleJob?.common_risks.join(', ')         ?? '',
//     male_nutrients:     maleJob?.nutrient_risks.join(', ')       ?? '',
//     male_foods:         maleJob?.recommended_foods?.join(', ')   ?? '',
//     male_sperm_impact:  (maleJob as any)?.fertility_impact?.sperm    ?? '',
//     male_hormone_impact:(maleJob as any)?.fertility_impact?.hormones ?? '',
//     baby_impact:        (maleJob as any)?.fertility_impact?.baby_impact ?? '',
//   }, tok())
// }
export async function triggerOnboardingComplete(userId: string) {
  return bubbleGet(
    "/wf/onboarding_complete",
    {
      calling_user: userId,
    },
    tok(),
  );
}
export async function triggerGenerateProtocol(userId: string) {
  return bubbleGet("/wf/process_protocol", { calling_user: userId }, tok());
}

export async function triggerGenerateScore(userId: string) {
  return bubbleGet("/wf/process_score", { calling_user: userId }, tok());
}

// export async function triggerGenerateNutrition(userId: string) {
//   return bubbleGet("/wf/generate_nutrition", { calling_user: userId }, tok());
// }

export async function triggerGenerateNutrition(
  userId: string,
  weekCtx: WeekContext,
  milkCtx?: MilkContext,
) {
  return bubbleGet(
    "/wf/generate_nutrition",
    {
      calling_user: userId,
      week_context: weekCtx.week_context,
      food_matches: weekCtx.food_matches,
      food_detail: weekCtx.food_detail,
      // Postpartum milk optimization — empty strings for non-postpartum
      milk_logic: milkCtx?.milk_logic ?? "",
      key_nutrients_milk: milkCtx?.key_nutrients ?? "",
      blood_support: milkCtx?.blood_support ?? "",
      milk_boosters: milkCtx?.milk_boosters ?? "",
      evening_feeding: milkCtx?.evening_feeding ?? "",
      oral_health: milkCtx?.oral_health ?? "",
      environment: milkCtx?.environment ?? "",
      electrical: milkCtx?.electrical ?? "",
    },
    tok(),
  );
}

export async function triggerRecalibrate(userId: string) {
  return bubblePost("/wf/recalibrate", { calling_user: userId }, tok());
}

export async function triggerLikePost(postId: string) {
  return bubblePost("/wf/like_post", { post_id: postId }, tok());
}
export async function triggerGenerateMovement() {
  return bubbleGet("/wf/generate_movement", undefined, tok());
}

export async function triggerJoinGroup(groupId: string) {
  return bubblePost("/wf/join_group", { groupId: groupId }, tok());
}

export async function triggerLeaveGroup(groupId: string) {
  return bubblePost("/wf/leave_group", { groupId: groupId }, tok());
}
export async function triggerGenerateJourney(userId: string) {
  return bubblePost("/wf/generate_journey", { calling_user: userId }, tok());
}
export async function triggerGenerateWeekDetail() {
  return bubbleGet("/wf/generate_week_detail", undefined, tok());
}
export async function triggerGenerateRecoveryDetail() {
  return bubbleGet("/wf/generate_recovery_detail", undefined, tok());
}
