'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackHeader({ href }: { href: string }) {
  const router = useRouter()
  return (
    <button onClick={() => href === '#' ? router.back() : router.push(href)}
      className="flex items-center gap-1 px-5 py-4 bg-transparent border-none cursor-pointer text-secondary hover:text-primary transition-colors">
      <ChevronLeft size={18} />
      <span className="text-sm">Back</span>
    </button>
  )
}
