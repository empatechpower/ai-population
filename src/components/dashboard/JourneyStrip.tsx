export default function JourneyStrip({ journeyType }: { journeyType: string }) {
  const label = journeyType === 'currently_pregnant'
    ? 'Week 11'
    : journeyType === 'postpartum'
    ? 'Week 4'
    : 'Cycle Day 14'

  const sub = journeyType === 'currently_pregnant'
    ? '2nd Trimester'
    : journeyType === 'postpartum'
    ? 'Recovery Phase'
    : 'Fertile Window'

  return (
    <div className="px-5 mb-4">
      <div className="flex gap-3">
        <div className="flex-1 bg-gold rounded-2xl px-4 py-3">
          <p className="text-[10px] text-white/70 uppercase tracking-wider font-medium">Your Journey</p>
          <p className="text-white font-medium text-sm mt-0.5">{label}</p>
          <p className="text-white/80 text-xs">{sub}</p>
        </div>
        <div className="flex-1 bg-white border border-border rounded-2xl px-4 py-3">
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium">What's Next</p>
          <p className="text-charcoal font-medium text-sm mt-0.5">
            {journeyType === 'currently_pregnant' ? 'Prenatal checkup' : 'Supplement dose'}
          </p>
          <p className="text-gold text-xs">in 3 days</p>
        </div>
      </div>
    </div>
  )
}
