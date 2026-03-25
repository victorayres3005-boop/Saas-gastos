'use client'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  loadingText?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]'

  const variants = {
    primary:   'bg-accent text-white hover:bg-accent-hover active:bg-accent-hover focus:ring-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.25)] hover:shadow-[0_3px_8px_rgba(255,107,53,0.35)]',
    secondary: 'bg-bg-surface text-text-primary border border-border hover:bg-bg-page hover:border-accent/40 focus:ring-border',
    ghost:     'text-text-secondary hover:bg-bg-page hover:text-text-primary focus:ring-border',
    danger:    'bg-negative text-white hover:bg-red-700 active:bg-red-800 focus:ring-negative/30',
  }

  const sizes = {
    sm: 'h-7 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-11 px-6 text-base',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="spinner" />}
      {loading && loadingText ? loadingText : children}
    </button>
  )
}
