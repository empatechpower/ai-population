'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Apple, Zap, Users } from 'lucide-react'

const GOLD = '#D4B06A'
const MUTED = '#9A9094'

function JourneyIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
      stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="18" r="1.8" /><circle cx="11" cy="11" r="1.8" /><circle cx="18" cy="4" r="1.8" />
      <path d="M5.5 16.6 C7.2 14 9.2 12.4 9.4 12.8" /><path d="M12.6 9.8 C14.3 7.4 16.4 5.5 16.6 5.8" />
    </svg>
  )
}

const navItems = [
  { href: '/dashboard',  label: 'Today',     icon: (c: string) => <Home size={22} color={c} /> },
  { href: '/journey',    label: 'Journey',   icon: (c: string) => <JourneyIcon color={c} />,
    activePaths: ['/journey'] },
  { href: '/nutrition',  label: 'Nutrition', icon: (c: string) => <Apple size={22} color={c} /> },
  { href: '/movement',   label: 'Movement',  icon: (c: string) => <Zap size={22} color={c} /> },
  { href: '/community',  label: 'Community', icon: (c: string) => <Users size={22} color={c} /> },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  function isActive(item: typeof navItems[0]) {
    if (item.activePaths) return item.activePaths.some(p => pathname.startsWith(p))
    return pathname.startsWith(item.href)
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map(item => {
          const active = isActive(item)
          const color = active ? GOLD : MUTED
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-1 px-3 py-2 bg-transparent border-none cursor-pointer min-w-[52px]">
              {item.icon(color)}
              <span style={{ fontSize: 10, fontWeight: active ? 500 : 400, color, letterSpacing: '0.02em' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex justify-center pb-1">
        <div className="w-[120px] h-1 rounded-full bg-black/10" />
      </div>
    </nav>
  )
}
