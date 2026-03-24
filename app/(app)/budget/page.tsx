'use client'
import { useMemo } from 'react'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { BudgetRow } from '@/components/budget/BudgetRow'
import { formatCurrency } from '@/lib/utils/formatters'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { useToast } from '@/components/ui/Toast'

export default function BudgetPage() {
  const now = new Date()
  const { budgets, loading: budgetsLoading, upsertBudget } = useBudgets()
  const { transactions, loading: txLoading } = useTransactions(now.getMonth(), now.getFullYear())
  const { showToast } = useToast()

  const spentByCategory = useMemo(() => {
    const map = new Map<CategoryKey, number>()
    transactions.forEach(t => {
      const k = t.category as CategoryKey
      map.set(k, (map.get(k) || 0) + t.value)
    })
    return map
  }, [transactions])

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit_value, 0)
  const totalSpent = transactions.reduce((s, t) => s + t.value, 0)

  const handleUpdate = async (category: CategoryKey, limit: number) => {
    await upsertBudget(category, limit)
    showToast('Orçamento atualizado!')
  }

  const categories = Object.keys(CATEGORIES) as CategoryKey[]

  return (
    <main className="p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Orçamento</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Total Orçado</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Total Gasto</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Saldo</p>
            <p className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget rows */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-1 pb-2 border-b border-border">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Categoria</span>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary w-36 text-right">Limite Mensal</span>
          </div>
        </div>
        {budgetsLoading || txLoading ? (
          <div className="py-8 text-center text-sm text-text-tertiary">Carregando...</div>
        ) : (
          categories.map(cat => {
            const budget = budgets.find(b => b.category === cat)
            const spent = spentByCategory.get(cat) || 0
            const limit = budget?.limit_value || 0
            return (
              <BudgetRow
                key={cat}
                category={cat}
                spent={spent}
                limit={limit}
                onUpdate={(newLimit) => handleUpdate(cat, newLimit)}
              />
            )
          })
        )}
      </div>
    </main>
  )
}
