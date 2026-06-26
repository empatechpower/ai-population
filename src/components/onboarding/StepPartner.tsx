import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useOnboarding } from "@/store/onboarding";
import { getAllJobTitles, lookupJob } from "@/data/job_index";
import { useState } from "react";
const activityOptions = ["Sedentary", "Light", "Moderate", "Active"];
const allMaleJobs = getAllJobTitles("male");
export default function StepPartner({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { data, setField } = useOnboarding();
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);

  const filtered = allMaleJobs
    .filter((j) => j.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 8);
  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="mb-8 fade-up">
        <span className="text-xs text-gold uppercase tracking-widest font-medium">
          Partner Data · 5 of 5
        </span>
        <h2 className="font-serif text-3xl text-charcoal mt-2 leading-snug">
          Your partner's
          <br />
          profile
        </h2>
        <p className="text-sm text-muted mt-2">
          Partner biology attributes significantly to fertility outcomes. You
          can skip this for now.
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1 fade-up-1">
        <Input
          label="Partner's Age"
          type="number"
          placeholder="32"
          value={data.partner_age}
          onChange={(e) => setField("partner_age", e.target.value)}
        />
        {/* <Input
          label="Partner's Job Type"
          placeholder="e.g. Engineer, Nurse..."
          value={data.partner_job_type}
          onChange={(e) => setField("partner_job_type", e.target.value)}
        /> */}
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
                    setField("partners_job_type", job);
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
        <Input
          label="Partner's Diet"
          placeholder="e.g. Omnivore, Vegan..."
          value={data.partner_diet}
          onChange={(e) => setField("partner_diet", e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted uppercase tracking-wider">
            Partner's Activity Level
          </label>
          <div className="flex gap-2 flex-wrap">
            {activityOptions.map((opt) => (
              <button
                key={opt}
                onClick={() => setField("partner_activity", opt)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium border transition-all ${
                  data.partner_activity === opt
                    ? "bg-gold text-white border-gold"
                    : "bg-white text-muted border-border hover:border-gold/40"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 fade-up-2">
        <Button fullWidth onClick={onNext}>
          Continue
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted text-center hover:text-charcoal transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
