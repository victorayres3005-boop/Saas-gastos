'use client'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface TopBarProps {
  onSearch?: (query: string) => void
}

export function TopBar({ onSearch }: TopBarProps) {
  const [query, setQuery] = useState('')

  return (
    <div className="bg-bg-surface border-b border-border px-8 py-3 sticky top-0 z-20">
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar transações..."
          value={query}
          onChange={e => { setQuery(e.target.value); onSearch?.(e.target.value) }}
          className="w-full h-8 pl-8 pr-3 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary bg-bg-page outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all"
        />
      </div>
    </div>
  )
}
