'use client'
import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { CategoryBadge } from '../ui/CategoryBadge'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { Database } from '@/lib/supabase/types'
import type { CategoryKey } from '@/lib/utils/categories'

type Transaction = Database['public']['Tables']['transactions']['Row']
type SortKey = 'date' | 'description' | 'category' | 'value'

interface TransactionTableProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function TransactionTable({ transactions, onDelete }: TransactionTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(false) }
  }

  const sorted = [...transactions].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'date') cmp = a.date.localeCompare(b.date)
    else if (sortKey === 'description') cmp = a.description.localeCompare(b.description)
    else if (sortKey === 'category') cmp = a.category.localeCompare(b.category)
    else if (sortKey === 'value') cmp = a.value - b.value
    return sortAsc ? cmp : -cmp
  })

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-text-tertiary">
      {sortKey === col ? (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronDown size={12} className="opacity-30" />}
    </span>
  )

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border py-16 text-center">
        <p className="text-sm text-text-tertiary">Nenhuma transação encontrada</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {[
              { key: 'date' as SortKey, label: 'Data' },
              { key: 'description' as SortKey, label: 'Descrição' },
              { key: 'category' as SortKey, label: 'Categoria' },
              { key: 'value' as SortKey, label: 'Valor' },
            ].map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary cursor-pointer hover:text-text-primary select-none"
              >
                <span className="flex items-center">{col.label}<SortIcon col={col.key} /></span>
              </th>
            ))}
            <th className="px-4 py-3 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(tx => (
            <tr
              key={tx.id}
              onMouseEnter={() => setHoveredId(tx.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="border-b border-border-light last:border-0 hover:bg-[#FAFAFA] transition-colors"
            >
              <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{formatDate(tx.date)}</td>
              <td className="px-4 py-3 text-sm text-text-primary font-medium">{tx.description}</td>
              <td className="px-4 py-3">
                <CategoryBadge category={tx.category as CategoryKey} />
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-text-primary tabular-nums">
                {formatCurrency(tx.value)}
              </td>
              <td className="px-4 py-3">
                {hoveredId === tx.id && (
                  <button
                    onClick={() => onDelete(tx.id)}
                    className="text-text-tertiary hover:text-negative transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
