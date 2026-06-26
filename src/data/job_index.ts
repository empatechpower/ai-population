// ─────────────────────────────────────────────────────────────
// job_index.ts — now a thin wrapper over lib/datasets.ts
//
// Sync functions still read from local JSON for onboarding
// dropdowns (fast, no await needed).
// Async lookups use Bubble data if available, JSON as fallback.
// ─────────────────────────────────────────────────────────────
import femaleJobsData from "./female_jobs.json";
import maleJobsData from "./male_jobs.json";

export interface FertilityImpact {
  sperm?: string;
  hormones?: string;
  baby_impact?: string;
  baby?: string;
  dna?: string;
  brain?: string;
}

export interface Job {
  id: number | string;
  job: string;
  gender: string;
  common_risks: string[];
  nutrient_risks: string[];
  fertility_impact?: FertilityImpact;
  recommended_foods?: string[];
  supplements?: string[];
}

// ── Sync lookup (reads local JSON — used in onboarding) ───────
const femaleIndex = new Map<string, Job>();
const maleIndex = new Map<string, Job>();

(femaleJobsData.female_jobs as Job[]).forEach((j) => {
  femaleIndex.set(j.job.toLowerCase(), j);
});

(maleJobsData.male_jobs as Job[]).forEach((j) => {
  maleIndex.set(j.job.toLowerCase(), j);
});

export function lookupJob(
  jobTitle: string,
  gender: "male" | "female",
): Job | null {
  if (!jobTitle || jobTitle.trim() === "") return null;
  const index = gender === "female" ? femaleIndex : maleIndex;
  const key = jobTitle.toLowerCase().trim();
  if (index.has(key)) return index.get(key)!;
  const match = Array.from(index.entries()).find(
    ([k]) => k.includes(key) || key.includes(k),
  );
  return match ? match[1] : null;
}

export function getAllJobTitles(gender: "male" | "female"): string[] {
  const source =
    gender === "female"
      ? (femaleJobsData.female_jobs as Job[])
      : (maleJobsData.male_jobs as Job[]);
  return source.map((j) => j.job).sort();
}

// ── Async lookup (tries Bubble first, falls back to JSON) ─────
export async function lookupJobAsync(
  jobTitle: string,
  gender: "male" | "female",
): Promise<Job | null> {
  try {
    const { lookupJobDynamic } = await import("@/lib/datasets");
    const result = await lookupJobDynamic(jobTitle, gender);
    if (result) return result as unknown as Job;
  } catch {}
  return lookupJob(jobTitle, gender);
}
