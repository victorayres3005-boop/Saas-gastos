'use client'
import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useBudgets } from '@/lib/hooks/useBudgets'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useRecurring } from '@/lib/hooks/useRecurring'
import { BudgetRow } from '@/components/budget/BudgetRow'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils/formatters'
import { CATEGORIES, EXPENSE_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { useToast } from '@/components/ui/Toast'
import { upsertBudget } from '@/app/actions/budgets'

export default function BudgetPage() {
  const now = new Date()
  const { budgets, loading: budgetsLoading, upsertBudget: upsertLocal } = useBudgets()
  const { transactions, loading: txLoading } = useTransactions(now.getMonth(), now.getFullYear())
  const { items: recurring } = useRecurring()
  const { showToast } = useToast()

  // Apenas despesas (value > 0)
  const spentByCategory = useMemo(() => {
    const map = new Map<CategoryKey, number>()
    transactions.filter(t => t.value > 0).forEach(t => {
      const k = t.category as CategoryKey
      map.set(k, (map.get(k) || 0) + t.value)
    })
    return map
  }, [transactions])

  // Recorrentes ativos de despesa por categoria (mensal)
  const recurringByCategory = useMemo(() => {
    const map = new Map<CategoryKey, number>()
    recurring.filter(r => r.active && r.value > 0).forEach(r => {
      const k = r.category as CategoryKey
      let monthly = r.value
      if (r.frequency === 'weekly') monthly = r.value * 4.33
      else if (r.frequency === 'yearly') monthly = r.value / 12
      map.set(k, (map.get(k) || 0) + monthly)
    })
    return map
  }, [recurring])

  const totalBudgeted = budgets.filter(b => EXPENSE_CATEGORIES.includes(b.category as CategoryKey)).reduce((s, b) => s + b.limit_value, 0)
  const totalSpent = transactions.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0)

  const alerts = useMemo(() => {
    return EXPENSE_CATEGORIES.filter(cat => {
      const budget = budgets.find(b => b.category === cat)
      const spent = spentByCategory.get(cat) || 0
      const limit = budget?.limit_value || 0
      return limit > 0 && (spent / limit) >= 0.8
    })
  }, [budgets, spentByCategory])

  const handleUpdate = async (category: CategoryKey, limit: number) => {
    upsertLocal(category, limit)
    const result = await upsertBudget(category, limit)
    if (result.error) showToast('Erro ao salvar', 'error')
    else showToast('Orçamento atualizado!')
  }

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Orçamento</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2 mb-5">
          {alerts.map(cat => {
            const budget = budgets.find(b => b.category === cat)!
            const spent = spentByCategory.get(cat) || 0
            const pct = Math.round((spent / budget.limit_value) * 100)
            return (
              <div key={cat} className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm border ${pct >= 100 ? 'bg-negative-light border-negative/20 text-negative' : 'bg-warning-light border-warning/20 text-warning'}`}>
                <AlertTriangle size={15} />
                <span>
                  <strong>{CATEGORIES[cat].label}</strong>: {pct}% do orçamento utilizado — {pct >= 100 ? 'limite excedido!' : 'atenção!'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Resumo */}
      <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Total Orçado</p>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Total Gasto</p>
            <p className="text-2xl font-bold text-negative">{formatCurrency(totalSpent)}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-1">Disponível</p>
            <p className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </div>
        </div>
      </div>

      {/* Linhas de categoria */}
      <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
        <div className="flex items-center justify-between mb-1 pb-2 border-b border-border">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Categoria</span>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary w-36 text-right">Limite Mensal</span>
        </div>
        {budgetsLoading || txLoading ? (
          <div className="flex flex-col">
            {Array(EXPENSE_CATEGORIES.length).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border-light last:border-0">
                <Skeleton className="h-5 w-24 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
                <Skeleton className="h-4 w-20 flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          EXPENSE_CATEGORIES.map(cat => {
            const budget = budgets.find(b => b.category === cat)
            const spent = spentByCategory.get(cat) || 0
            const recurringAmount = recurringByCategory.get(cat) || 0
            const limit = budget?.limit_value || 0
            return (
              <BudgetRow
                key={cat}
                category={cat}
                spent={spent}
                limit={limit}
                recurringAmount={recurringAmount}
                onUpdate={(newLimit) => handleUpdate(cat, newLimit)}
              />
            )
          })
        )}
      </div>
    </main>
  )
}
