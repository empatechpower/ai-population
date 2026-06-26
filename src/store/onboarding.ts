import { create } from "zustand";

export interface OnboardingData {
  journey_type: string;
  first_name: string;
  age: string;
  height: string;
  weight: string;
  target_conception_season: string;
  previous_children: string;
  nationality: string;
  country: string;
  city: string;
  job_type: string;
  activity_level: string;
  diet_type: string;
  sun_exposure: string;
  partner_age: string;
  partners_job_type: string;
  partner_activity: string;
  partner_diet: string;
  skin_type: string;
  current_week: string;
}

interface OnboardingState {
  step: number;
  data: OnboardingData;
  setField: (field: keyof OnboardingData, value: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

const defaultData: OnboardingData = {
  journey_type: "",
  first_name: "",
  age: "",
  height: "",
  weight: "",
  target_conception_season: "",
  previous_children: "",
  nationality: "",
  country: "",
  city: "",
  job_type: "",
  activity_level: "",
  diet_type: "",
  sun_exposure: "",
  partner_age: "",
  partners_job_type: "",
  partner_activity: "",
  partner_diet: "",
  skin_type: "",
  current_week: "",
};

export const useOnboarding = create<OnboardingState>((set) => ({
  step: 1,
  data: defaultData,
  setField: (field, value) =>
    set((s) => ({ data: { ...s.data, [field]: value } })),
  nextStep: () => set((s) => ({ step: s.step + 1 })),
  prevStep: () => set((s) => ({ step: Math.max(1, s.step - 1) })),
  reset: () => set({ step: 1, data: defaultData }),
}));
