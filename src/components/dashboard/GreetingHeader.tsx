function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

export default function GreetingHeader({ name }: { name: string }) {
  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <button className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888580" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
      </div>
      <h1 className="font-serif text-2xl text-charcoal">
        Good {getGreeting()}, {name}
      </h1>
      <p className="text-xs text-muted mt-1 leading-relaxed">
        This is where everything begins — your body is already preparing for
        something remarkable.
      </p>
      <div className="mt-2">
        <span className="text-xs text-gold font-medium">
          ● Activity Window: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}–
          {new Date(Date.now() + 4 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  )
}
