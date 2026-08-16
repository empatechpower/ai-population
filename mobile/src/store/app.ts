import { create } from "zustand";

export interface Profile {
  _id: string;
  first_name: string;
  name_text?: string;
  journey_type_text?: string;
  daily_sun_expore_text?: string;
  diet_type_text?: string;
  male_job_risks_text?: string;
  pregnant_boolean?: boolean;
  partners_activity_level_text?: string;
  skin_type_text?: string;
  age: number;
  height?: number;
  fertility_score_number?: number;
  weight?: number;
  journey_type: string;
  fertility_score: number;
  current_protocol?: string;
  onboarding_done: boolean;
  current_week_number?: number;
  // timeline
  target_conception_season?: string;
  previous_children?: number;
  // location
  city: string;
  country?: string;
  nationality?: string;
  // lifestyle
  job_type: string;
  activity_level: string;
  diet_type: string;
  sun_exposure?: string;
  // partner
  partner_age?: number;
  partners_job_type?: string;
  partner_activity?: string;
  partner_diet?: string;
  skin_type?: string;
  current_week?: number;
  // pregnancy
  due_date?: string;
  [key: string]: unknown;
}

export interface Protocol {
  _id: string;
  date: string;
  // daily AI fields
  nutrition_plan: string;
  supplements: string;
  movement: string;
  avoid_today: string;
  fertility_tip: string;
  // job intelligence fields (added after job system integration)
  female_risk_summary?: string;
  male_risk_summary?: string;
  baby_focus?: string;
  job_vitamins?: string;
  job_foods?: string;
  female_job_risks?: string;
  female_nutrients?: string;
  male_job_risks?: string;
  male_nutrients?: string;
  male_foods?: string;
  male_supplements?: string;
  male_sperm_impact?: string;
  male_hormone_impact?: string;
  baby_impact?: string;
  "Created Date"?: number;
  "Modified Date"?: number;
}

interface AppState {
  profile: Profile | null;
  protocol: Protocol | null;
  isLoading: boolean;
  setProfile: (p: Profile) => void;
  setProtocol: (p: Protocol) => void;
  setLoading: (v: boolean) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  protocol: null,
  isLoading: false,
  setProfile: (profile) => set({ profile }),
  setProtocol: (protocol) => set({ protocol }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ profile: null, protocol: null, isLoading: false }),
}));
