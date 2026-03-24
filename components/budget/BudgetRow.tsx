'use client'
import { useState } from 'react'
import { Check, Edit2 } from 'lucide-react'
import { CategoryBadge } from '../ui/CategoryBadge'
import { ProgressBar } from '../ui/ProgressBar'
import { formatCurrency } from '@/lib/utils/formatters'
import type { CategoryKey } from '@/lib/utils/categories'

interface BudgetRowProps {
  category: CategoryKey
  spent: number
  limit: number
  onUpdate: (limit: number) => void
}

export function BudgetRow({ category, spent, limit, onUpdate }: BudgetRowProps) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(limit.toString())

  const handleSave = () => {
    const val = parseFloat(inputValue)
    if (val > 0) { onUpdate(val); setEditing(false) }
  }

  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const statusColor = pct >= 100 ? 'text-negative' : pct >= 80 ? 'text-warning' : 'text-text-secondary'

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-light last:border-0">
      <div className="w-36 flex-shrink-0">
        <CategoryBadge category={category} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="text-sm text-text-secondary">{formatCurrency(spent)}</span>
          <span className={`text-sm font-medium ${statusColor}`}>{pct.toFixed(0)}%</span>
        </div>
        <ProgressBar value={spent} max={limit} />
      </div>
      <div className="w-36 flex-shrink-0 flex items-center gap-2 justify-end">
        {editing ? (
          <>
            <input
              type="number"
              step="0.01"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="w-28 h-7 px-2 border border-accent rounded-lg text-sm outline-none text-right"
              autoFocus
            />
            <button onClick={handleSave} className="text-positive hover:text-green-700">
              <Check size={15} />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-medium text-text-primary">{formatCurrency(limit)}</span>
            <button onClick={() => { setInputValue(limit.toString()); setEditing(true) }} className="text-text-tertiary hover:text-text-primary">
              <Edit2 size={13} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
