import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useOnboarding } from "@/store/onboarding";
import { getAllJobTitles, lookupJob } from "@/data/job_index";
import { useState } from "react";
const allFemaleJobs = getAllJobTitles("female");
const activityOptions = [
  "Sedentary",
  "Light",
  "Moderate",
  "Active",
  "Very Active",
];
const sunOptions = [
  "Minimal (<30 min)",
  "Moderate (30–60 min)",
  "High (>1 hour)",
];

export default function StepEnvironment({ onNext }: { onNext: () => void }) {
  const { data, setField } = useOnboarding();

  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);

  const filtered = allFemaleJobs
    .filter((j) => j.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="mb-8 fade-up">
        <span className="text-xs text-gold uppercase tracking-widest font-medium">
          Lifestyle & Environment · 4 of 5
        </span>
        <h2 className="font-serif text-3xl text-charcoal mt-2 leading-snug">
          Your environment
          <br />
          shapes everything
        </h2>
      </div>

      <div className="flex flex-col gap-4 flex-1 fade-up-1 overflow-y-auto">
        <Input
          label="Nationality"
          placeholder="Swiss"
          value={data.nationality}
          onChange={(e) => setField("nationality", e.target.value)}
        />
        <Input
          label="Country of Living"
          placeholder="Switzerland"
          value={data.country}
          onChange={(e) => setField("country", e.target.value)}
        />
        <Input
          label="City"
          placeholder="Zurich"
          value={data.city}
          onChange={(e) => setField("city", e.target.value)}
        />
        <div className="relative">
          <Input
            label="Your Job"
            placeholder="Type to search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowList(true);
            }}
            onFocus={() => setShowList(true)}
          />
          {showList && filtered.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-border rounded-xl mt-1 shadow-sm max-h-48 overflow-y-auto">
              {filtered.map((job) => (
                <button
                  key={job}
                  className="w-full text-left px-4 py-2.5 text-sm text-charcoal hover:bg-gold-light transition-colors"
                  onClick={() => {
                    setField("job_type", job);
                    setSearch(job);
                    setShowList(false);
                  }}
                >
                  {job}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Activity Level */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Activity Level
          </label>
          <div className="flex gap-2 flex-wrap">
            {activityOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setField("activity_level", opt)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                  data.activity_level === opt
                    ? "bg-gold text-white border-gold"
                    : "bg-white text-muted border-border hover:border-gold/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Diet Type"
          placeholder="e.g. Mediterranean, Vegan..."
          value={data.diet_type}
          onChange={(e) => setField("diet_type", e.target.value)}
        />

        {/* Sun Exposure */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Daily Sun Exposure
          </label>
          <div className="flex flex-col gap-2">
            {sunOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setField("sun_exposure", opt)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                  data.sun_exposure === opt
                    ? "bg-gold-light border-gold text-charcoal"
                    : "bg-white border-border text-muted hover:border-gold/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 fade-up-2">
        <Button
          fullWidth
          onClick={onNext}
          disabled={!data.city || !data.activity_level}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
