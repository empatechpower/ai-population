import Button from '@/components/shared/Button'

const features = [
  'Biological & cycle intelligence',
  'AI-generated daily protocols',
  'Partner fertility integration',
  'Environmental adaptation',
]

export default function StepLanding({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col min-h-screen px-6 pt-16 pb-10">
      {/* Logo */}
      <div className="w-10 h-10 rounded-xl bg-gold-light flex items-center justify-center mb-12 fade-up">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      {/* Tag */}
      <div className="fade-up-1">
        <span className="text-xs font-medium text-gold uppercase tracking-widest">
          AI Optimization App
        </span>
      </div>

      {/* Headline */}
      <h1 className="font-serif text-4xl text-charcoal mt-3 mb-4 leading-tight fade-up-2">
        Optimize Your Path<br />to Parenthood
      </h1>

      {/* Subtext */}
      <p className="text-sm text-muted leading-relaxed mb-8 fade-up-3">
        We personalize everything to your biology, lifestyle, and environment.
        This is precision with heart.
      </p>

      {/* Features */}
      <div className="flex flex-col gap-3 mb-auto fade-up-4">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
            <span className="text-sm text-charcoal">{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 fade-up-5">
        <Button fullWidth onClick={onNext}>
          Begin your journey →
        </Button>
        <p className="text-center text-xs text-muted mt-3">
          Takes only 4 minutes · Nothing to buy
        </p>
      </div>
    </div>
  )
}
