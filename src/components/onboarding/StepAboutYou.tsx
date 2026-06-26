import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useOnboarding } from "@/store/onboarding";
import { getAllJobTitles, lookupJob } from "@/data/job_index";
import { useState } from "react";
export default function StepAboutYou({ onNext }: { onNext: () => void }) {
  const { data, setField } = useOnboarding();
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const allFemaleJobs = getAllJobTitles("female");
  const canContinue = data.first_name && data.age;
  const filtered = allFemaleJobs
    .filter((j) => j.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="mb-8 fade-up">
        <span className="text-xs text-gold uppercase tracking-widest font-medium">
          About You · 3 of 5
        </span>
        <h2 className="font-serif text-3xl text-charcoal mt-2 leading-snug">
          Tell us about
          <br />
          yourself
        </h2>
        <p className="text-sm text-muted mt-2">
          Your personal data helps us calibrate your biological protocols with
          precision.
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1 fade-up-1">
        <Input
          label="First Name"
          placeholder="Sofia"
          value={data.first_name}
          onChange={(e) => setField("first_name", e.target.value)}
        />
        <Input
          label="Age"
          type="number"
          placeholder="28"
          value={data.age}
          onChange={(e) => setField("age", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Height (cm)"
            type="number"
            placeholder="165"
            value={data.height}
            onChange={(e) => setField("height", e.target.value)}
          />
          <Input
            label="Weight (kg)"
            type="number"
            placeholder="60"
            value={data.weight}
            onChange={(e) => setField("weight", e.target.value)}
          />
        </div>
      </div>

      <div className="mt-8 fade-up-2">
        <Button fullWidth onClick={onNext} disabled={!canContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}
