'use client'
import { useEffect, useState } from 'react'
import Button from '@/components/shared/Button'
import { useRouter } from 'next/navigation'

const checks = [
  'Daily AI protocol generated',
  'Biological calendar synced',
  'Partner data integrated',
  'Supplement stack configured',
]

export default function StepComplete() {
  const router = useRouter()
  const [visible, setVisible] = useState<number[]>([])

  useEffect(() => {
    checks.forEach((_, i) => {
      setTimeout(() => setVisible((v) => [...v, i]), 600 + i * 400)
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen px-6 pt-20 pb-10 items-center text-center">
      {/* Gold ring icon */}
      <div
        className="w-20 h-20 rounded-full bg-gold-light border-2 border-gold flex items-center justify-center mb-8 fade-up"
        style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>

      <span className="text-xs text-gold uppercase tracking-widest font-medium mb-3 fade-up-1">
        AI Pregnancy Optimized
      </span>

      <h2 className="font-serif text-3xl text-charcoal mb-3 fade-up-2">
        System Calibrated,<br />Welcome
      </h2>

      <p className="text-sm text-muted mb-10 leading-relaxed fade-up-3">
        Your personalized optimization protocol is ready.
        We're in this together.
      </p>

      {/* Checklist */}
      <div className="w-full flex flex-col gap-3 mb-auto">
        {checks.map((item, i) => (
          <div
            key={item}
            className={`flex items-center gap-3 transition-all duration-500 ${
              visible.includes(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              visible.includes(i) ? 'bg-gold' : 'bg-border'
            }`}>
              {visible.includes(i) && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </div>
            <span className="text-sm text-charcoal text-left">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-10 w-full">
        <Button fullWidth onClick={() => router.push('/dashboard')}>
          Enter Dashboard →
        </Button>
      </div>
    </div>
  )
}
