// ─────────────────────────────────────────────────────────────
// Dynamic dataset fetching from Bubble
// Replaces static JSON imports for jobs, foods, and milk data.
// Falls back to local JSON if Bubble is unreachable or returns 0 results.
// ─────────────────────────────────────────────────────────────

import { bubbleGet } from "./bubble";
import { getToken } from "./auth";

// Local JSON fallbacks
import femaleJobsData from "@/data/female_jobs.json";
import maleJobsData from "@/data/male_jobs.json";
import foodsData from "@/data/pregnancy_foods.json";

// ── Types ─────────────────────────────────────────────────────
export interface BubbleFemaleJob {
  _id: string;
  job_text: string;
  common_risks_list_text: string[];
  nutrient_risks_list_text: string[];
}

export interface BubbleMaleJob {
  _id: string;
  job_text: string;
  common_risks_list_text: string[];
  nutrient_risks_list_text: string[];
  sperm_impact_text: string;
  hormone_impact_text: string;
  recommended_foods_list_text: string[];
  supplements_list_text: string[];
}

export interface BubbleFood {
  _id: string;
  food_text: string;
  stage_text: string;
  baby_effect_text: string;
  mother_effect_text: string;
  nutrients_list_text: string[];
  science_text: string;
}

export interface NormalisedJob {
  id: string;
  job: string;
  gender: string;
  common_risks: string[];
  nutrient_risks: string[];
  sperm_impact?: string;
  hormone_impact?: string;
  recommended_foods?: string[];
  supplements?: string[];
}

export interface NormalisedFood {
  id: string;
  food: string;
  stage: string;
  baby_effect: string;
  mother_effect: string;
  nutrients: string[];
  science: string;
}

// ── Fetch all female jobs from Bubble ────────────────────────
// Fetches all pages by looping until remaining = 0
async function fetchAllFromBubble(type: string, token: string): Promise<any[]> {
  const PAGE = 50;
  const results: any[] = [];
  let cursor = 0;
  let remaining = 1; // start > 0 to enter loop

  while (remaining > 0) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BUBBLE_BASE_URL}/obj/${type}?sort_field=Created%20Date&limit=${PAGE}&cursor=${cursor}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const d = await res.json();
    const page = d.response?.results ?? [];
    results.push(...page);
    remaining = d.response?.remaining ?? 0;
    cursor += page.length;
    if (page.length === 0) break;
  }
  return results;
}

// ── Female Jobs ───────────────────────────────────────────────
let femaleJobsCache: NormalisedJob[] | null = null;

export async function getFemaleJobs(): Promise<NormalisedJob[]> {
  if (femaleJobsCache) return femaleJobsCache;

  try {
    const token = getToken();
    if (!token) throw new Error("no token");

    const raw = await fetchAllFromBubble("femalejob", token);
    if (raw.length === 0) throw new Error("empty");

    femaleJobsCache = raw.map((j: BubbleFemaleJob) => ({
      id: j._id,
      job: j.job_text,
      gender: "female",
      common_risks: j.common_risks_list_text ?? [],
      nutrient_risks: j.nutrient_risks_list_text ?? [],
    }));
  } catch {
    // Fallback to local JSON
    femaleJobsCache = (femaleJobsData.female_jobs as any[]).map((j) => ({
      id: String(j.id),
      job: j.job,
      gender: "female",
      common_risks: j.common_risks ?? [],
      nutrient_risks: j.nutrient_risks ?? [],
    }));
  }

  return femaleJobsCache!;
}

// ── Male Jobs ─────────────────────────────────────────────────
let maleJobsCache: NormalisedJob[] | null = null;

export async function getMaleJobs(): Promise<NormalisedJob[]> {
  if (maleJobsCache) return maleJobsCache;

  try {
    const token = getToken();
    if (!token) throw new Error("no token");

    const raw = await fetchAllFromBubble("malejob", token);
    if (raw.length === 0) throw new Error("empty");

    maleJobsCache = raw.map((j: BubbleMaleJob) => ({
      id: j._id,
      job: j.job_text,
      gender: "male",
      common_risks: j.common_risks_list_text ?? [],
      nutrient_risks: j.nutrient_risks_list_text ?? [],
      sperm_impact: j.sperm_impact_text,
      hormone_impact: j.hormone_impact_text,
      recommended_foods: j.recommended_foods_list_text ?? [],
      supplements: j.supplements_list_text ?? [],
    }));
  } catch {
    maleJobsCache = (maleJobsData.male_jobs as any[]).map((j) => ({
      id: String(j.id),
      job: j.job,
      gender: "male",
      common_risks: j.common_risks ?? [],
      nutrient_risks: j.nutrient_risks ?? [],
      sperm_impact: j.fertility_impact?.sperm,
      hormone_impact: j.fertility_impact?.hormones,
      recommended_foods: j.recommended_foods ?? [],
      supplements: j.supplements ?? [],
    }));
  }

  return maleJobsCache!;
}

// ── Lookup job by title (replaces job_index.ts lookupJob) ────
export async function lookupJobDynamic(
  jobTitle: string,
  gender: "male" | "female",
): Promise<NormalisedJob | null> {
  if (!jobTitle?.trim()) return null;
  const jobs =
    gender === "female" ? await getFemaleJobs() : await getMaleJobs();
  const key = jobTitle.toLowerCase().trim();
  return (
    jobs.find((j) => {
      const jk = j.job.toLowerCase();
      return jk === key || jk.includes(key) || key.includes(jk);
    }) ?? null
  );
}

// Get all job titles for autocomplete dropdowns
export async function getAllJobTitlesDynamic(
  gender: "male" | "female",
): Promise<string[]> {
  const jobs =
    gender === "female" ? await getFemaleJobs() : await getMaleJobs();
  return jobs.map((j) => j.job).sort();
}

// ── Pregnancy Foods ───────────────────────────────────────────
let foodsCache: NormalisedFood[] | null = null;

export async function getPregnancyFoods(): Promise<NormalisedFood[]> {
  if (foodsCache) return foodsCache;

  try {
    const token = getToken();
    if (!token) throw new Error("no token");

    const raw = await fetchAllFromBubble("pregnancyfood", token);
    if (raw.length === 0) throw new Error("empty");

    foodsCache = raw.map((f: BubbleFood) => ({
      id: f._id,
      food: f.food_text,
      stage: f.stage_text,
      baby_effect: f.baby_effect_text,
      mother_effect: f.mother_effect_text,
      nutrients: f.nutrients_list_text ?? [],
      science: f.science_text ?? "",
    }));
  } catch {
    foodsCache = (foodsData.foods as any[]).map((f) => ({
      id: String(f.id),
      food: f.food,
      stage: f.stage,
      baby_effect: f.baby_effect,
      mother_effect: f.mother_effect,
      nutrients: f.nutrients ?? [],
      science: f.science ?? "",
    }));
  }

  return foodsCache!;
}

// Clear caches (call after admin edits a dataset)
export function clearDatasetCaches() {
  femaleJobsCache = null;
  maleJobsCache = null;
  foodsCache = null;
}
