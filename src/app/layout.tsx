import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Pregnancy Optimization',
  description: 'Personalized fertility and pregnancy optimization powered by AI',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Bloom',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#D4B06A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  )
}
