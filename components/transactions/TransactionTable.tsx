'use client'
import { useState } from 'react'
import { Trash2, ChevronUp, ChevronDown, Pencil, ArrowLeftRight } from 'lucide-react'
import { CategoryBadge } from '../ui/CategoryBadge'
import { AccountBadge } from '../ui/AccountBadge'
import { EmptyState } from '../ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { Database } from '@/lib/supabase/types'
import type { CategoryKey } from '@/lib/utils/categories'
import type { Account } from '@/lib/hooks/useAccounts'

type Transaction = Database['public']['Tables']['transactions']['Row']
type SortKey = 'date' | 'description' | 'category' | 'value'

interface TransactionTableProps {
  transactions: Transaction[]
  onDelete: (id: string) => void
  onEdit: (tx: Transaction) => void
  accounts?: Account[]
}

export function TransactionTable({ transactions, onDelete, onEdit, accounts = [] }: TransactionTableProps) {
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

  const showAccounts = accounts.length > 0

  if (transactions.length === 0) {
    return (
      <div className="bg-bg-surface rounded-xl border border-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
        <EmptyState
          icon={ArrowLeftRight}
          title="Nenhuma transação encontrada"
          description="Tente ajustar os filtros ou adicione uma nova transação para este período."
        />
      </div>
    )
  }

  return (
    <div className="bg-bg-surface rounded-xl border border-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-bg-page">
            {[
              { key: 'date' as SortKey, label: 'Data' },
              { key: 'description' as SortKey, label: 'Descrição' },
              { key: 'category' as SortKey, label: 'Categoria' },
            ].map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3 text-left text-xs font-semibold text-text-secondary cursor-pointer hover:text-text-primary select-none"
              >
                <span className="flex items-center">{col.label}<SortIcon col={col.key} /></span>
              </th>
            ))}
            {showAccounts && (
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary select-none">
                Conta
              </th>
            )}
            <th
              onClick={() => handleSort('value')}
              className="px-4 py-3 text-left text-xs font-semibold text-text-secondary cursor-pointer hover:text-text-primary select-none"
            >
              <span className="flex items-center">Valor<SortIcon col="value" /></span>
            </th>
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {sorted.map(tx => {
            const account = tx.account_id ? accounts.find(a => a.id === tx.account_id) : undefined
            const isIncome = tx.value < 0
            return (
              <tr
                key={tx.id}
                onMouseEnter={() => setHoveredId(tx.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="border-b border-border-light last:border-0 hover:bg-bg-page transition-colors"
              >
                <td className="px-4 py-3 text-sm text-text-secondary whitespace-nowrap">{formatDate(tx.date)}</td>
                <td className="px-4 py-3 text-sm text-text-primary font-medium">
                  <div>{tx.description}</div>
                  {tx.notes && <div className="text-xs text-text-tertiary mt-0.5">{tx.notes}</div>}
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={tx.category as CategoryKey} />
                </td>
                {showAccounts && (
                  <td className="px-4 py-3">
                    {account ? <AccountBadge account={account} size="sm" /> : <span className="text-xs text-text-tertiary">—</span>}
                  </td>
                )}
                <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: isIncome ? 'var(--positive)' : 'var(--negative)' }}>
                  {isIncome ? '+' : '-'}{formatCurrency(Math.abs(tx.value))}
                </td>
                <td className="px-4 py-3">
                  <div className={`flex items-center gap-1 transition-opacity ${hoveredId === tx.id ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                      onClick={() => onEdit(tx)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-light transition-colors"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-negative hover:bg-negative-light transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
