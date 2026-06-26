'use client'
import { useEffect, useState } from 'react'

export default function FertilityScoreRing({ score, size = 168 }: { score: number; size?: number }) {
  const sw = 11
  const radius = (size - sw * 2) / 2
  const circ = 2 * Math.PI * radius
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 400)
    return () => clearTimeout(t)
  }, [score])

  const offset = circ - (animated / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#E8E1D6" strokeWidth={sw} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#C6A769" strokeWidth={sw}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 2s ease-out' }} />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-5xl font-semibold text-primary leading-none tracking-tight">{score}</span>
        <span className="text-2xs text-muted mt-1 tracking-widest uppercase">/ 100</span>
      </div>
    </div>
  )
}
