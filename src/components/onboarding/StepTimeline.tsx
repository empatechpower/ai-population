import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import { useOnboarding } from "@/store/onboarding";

export default function StepTimeline({ onNext }: { onNext: () => void }) {
  const { data, setField } = useOnboarding();

  return (
    <div className="flex flex-col min-h-screen px-6 pt-6 pb-10">
      <div className="mb-8 fade-up">
        <span className="text-xs text-gold uppercase tracking-widest font-medium">
          Timeline
        </span>
        <h2 className="font-serif text-3xl text-charcoal mt-2 leading-snug">
          Let's map your
          <br />
          timeline
        </h2>
      </div>

      <div className="flex flex-col gap-5 flex-1 fade-up-1">
        <Input
          label="Target conception season"
          placeholder="e.g. Spring 2025"
          value={data.target_conception_season}
          onChange={(e) => setField("target_conception_season", e.target.value)}
        />
        <Input
          label="Number of previous children"
          type="number"
          placeholder="0"
          min="0"
          value={data.previous_children}
          onChange={(e) => setField("previous_children", e.target.value)}
        />
        <div className="p-4 rounded-2xl bg-gold-light border border-gold/20">
          <p className="text-xs text-gold font-medium uppercase tracking-wider mb-1">
            Why we ask
          </p>
          <p className="text-sm text-charcoal/70">
            Understanding your timeline helps us calibrate your AI protocol with
            the right seasonal and biological adjustments.
          </p>
        </div>
      </div>

      <div className="mt-8 fade-up-2">
        <Button fullWidth onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
