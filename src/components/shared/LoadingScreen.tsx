'use client'
export default function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent spin" />
      <p className="text-sm text-muted text-center">{message}</p>
    </div>
  )
}
