'use client'
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  variant?: 'primary' | 'outline'
}
export default function Button({ children, onClick, disabled, fullWidth, variant = 'primary' }: ButtonProps) {
  const base = 'flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-base font-semibold transition-all cursor-pointer border-none'
  const variants = {
    primary: disabled ? 'bg-gold/40 text-white cursor-not-allowed' : 'bg-gold text-white hover:bg-gold/90',
    outline: 'bg-transparent border border-border text-secondary hover:text-primary',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}>
      {children}
    </button>
  )
}
