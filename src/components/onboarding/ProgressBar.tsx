export default function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 px-5 pt-4">
      <div className="flex gap-1.5 flex-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i < current ? 'bg-gold' : 'bg-border'
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted whitespace-nowrap">{current} of {total}</span>
    </div>
  )
}
