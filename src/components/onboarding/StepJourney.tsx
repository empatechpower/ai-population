import Button from "@/components/shared/Button";
import { useOnboarding } from "@/store/onboarding";

const options = [
  {
    value: "trying_to_conceive",
    label: "Trying to Conceive",
    sub: "Fertility tracking & conception support",
  },
  {
    value: "currently_pregnant",
    label: "Currently Pregnant",
    sub: "Pregnancy adjustment & monitoring",
  },
  {
    value: "postpartum",
    label: "Postpartum Recovery",
    sub: "Recovery, nutrition & bonding guidance",
  },
];

export default function StepJourney({ onNext }: { onNext: () => void }) {
  const { data, setField } = useOnboarding();
  const selected = data.journey_type;

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="mb-8 fade-up">
        <span className="text-xs text-gold uppercase tracking-widest font-medium">
          Your Status
        </span>
        <h2 className="font-serif text-3xl text-charcoal mt-2 leading-snug">
          What best describes
          <br />
          where you are now?
        </h2>
      </div>

      <div className="flex flex-col gap-3 flex-1 fade-up-1">
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setField("journey_type", opt.value)}
              className={`
                w-full text-left px-4 py-4 rounded-2xl border transition-all duration-200
                ${
                  active
                    ? "border-gold bg-gold-light"
                    : "border-border bg-white hover:border-gold/40"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-charcoal">
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{opt.sub}</p>
                </div>
                <div
                  className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${active ? "border-gold bg-gold" : "border-border"}
                `}
                >
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 fade-up-2">
        <Button fullWidth onClick={onNext} disabled={!selected}>
          Continue
        </Button>
      </div>
    </div>
  );
}
