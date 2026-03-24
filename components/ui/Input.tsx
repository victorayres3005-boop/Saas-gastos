'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export function Input({ label, error, showPasswordToggle, className = '', type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`w-full h-9 px-3 border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary bg-white transition-all outline-none
            ${error ? 'border-negative focus:border-negative focus:shadow-[0_0_0_3px_rgba(220,38,38,0.12)]' : 'border-border focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]'}
            ${showPasswordToggle ? 'pr-10' : ''}
            ${className}`}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  )
}
