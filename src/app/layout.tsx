import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Pregnancy Optimization',
  description: 'Personalized fertility and pregnancy optimization powered by AI',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
