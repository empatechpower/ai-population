'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface InfoItem {
  icon:  string
  title: string
  body:  string
}

interface InfoBoxProps {
  id:          string
  emoji:       string
  title:       string
  subtitle?:   string
  conclusion?: string
  items:       InfoItem[]
  accentColor?: string
  defaultOpen?: boolean
}

export default function InfoBox({
  id, emoji, title, subtitle, conclusion, items,
  accentColor = '#D4B06A',
  defaultOpen = false,
}: InfoBoxProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-card rounded-[22px] border border-border overflow-hidden"
      style={{ borderLeft: `3px solid ${accentColor}` }}>

      {/* Header — always visible, tappable */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 bg-transparent border-0 cursor-pointer text-left flex items-start gap-3">
        <span className="text-2xl flex-shrink-0 mt-0.5">{emoji}</span>
        <div className="flex-1">
          <p className="text-base font-semibold text-primary leading-tight">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted mt-0.5 leading-snug font-serif italic">{subtitle}</p>
          )}
        </div>
        <div className="flex-shrink-0 mt-1">
          {open
            ? <ChevronUp size={16} className="text-muted" />
            : <ChevronDown size={16} className="text-muted" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5">
          <div className="flex flex-col gap-3.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-primary mb-0.5">{item.title}</p>
                  <p className="text-sm text-secondary leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          {conclusion && (
            <div className="mt-4 px-3.5 py-3 rounded-2xl"
              style={{ background: `${accentColor}10`, borderLeft: `2px solid ${accentColor}40` }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: accentColor }}>Conclusion</p>
              <p className="text-sm text-secondary leading-relaxed font-serif italic">
                {conclusion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
