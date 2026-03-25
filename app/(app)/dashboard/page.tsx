'use client'
import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { MetricCardSkeleton, BalanceCardSkeleton, ChartCardSkeleton } from '@/components/ui/Skeleton'
import { DonutChart } from '@/components/charts/DonutChart'
import { LineChart } from '@/components/charts/LineChart'
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useRecurring } from '@/lib/hooks/useRecurring'
import { useProfile } from '@/lib/hooks/useProfile'
import { CATEGORIES, EXPENSE_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { AccountBadge } from '@/components/ui/AccountBadge'
import { formatCurrency, formatMonthYear, getFirstName } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export default function DashboardPage() {
  const now = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const { transactions, loading } = useTransactions(currentDate.getMonth(), currentDate.getFullYear())
  const { accounts } = useAccounts()
  const { items: recurring } = useRecurring()
  const { profile } = useProfile()
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<CategoryKey>>(new Set())
  const [prevMonthTxs, setPrevMonthTxs] = useState<Transaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('transactions').select('*').order('date')
      setAllTransactions((data as Transaction[]) || [])
    }
    fetchAll()
    const onEvent = () => fetchAll()
    const onVisible = () => { if (document.visibilityState === 'visible') fetchAll() }
    window.addEventListener('fintrack:transactions-updated', onEvent)
    window.addEventListener('fintrack:accounts-updated', onEvent)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('fintrack:transactions-updated', onEvent)
      window.removeEventListener('fintrack:accounts-updated', onEvent)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    const fetchPrev = async () => {
      const supabase = createClient()
      const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      const start = new Date(prevDate.getFullYear(), prevDate.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data } = await supabase.from('transactions').select('*').gte('date', start).lte('date', end)
      setPrevMonthTxs((data as Transaction[]) || [])
    }
    fetchPrev()
  }, [currentDate])

  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const displayTransactions = useMemo(() => {
    if (!selectedAccount) return transactions
    return transactions.filter(t => t.account_id === selectedAccount)
  }, [transactions, selectedAccount])

  const filtered = useMemo(() => {
    if (activeCategories.size === 0) return displayTransactions
    return displayTransactions.filter(t => activeCategories.has(t.category as CategoryKey))
  }, [displayTransactions, activeCategories])

  const toggleCategory = (cat: CategoryKey) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Recorrentes ativos
  const activeRecurring = useMemo(() => recurring.filter(r => r.active), [recurring])

  const monthlyAmount = (r: { value: number; frequency: string }) => {
    const v = Math.abs(r.value)
    if (r.frequency === 'monthly') return v
    if (r.frequency === 'weekly')  return v * 4.33
    if (r.frequency === 'yearly')  return v / 12
    return 0
  }

  // Balance overview
  const totalBalance = useMemo(() =>
    accounts.reduce((s, a) => s + a.balance, 0)
  , [accounts])


  // Valores filtrados por conta selecionada (para o Balance card)
  const accountForBalance = useMemo(() =>
    selectedAccount ? accounts.find(a => a.id === selectedAccount) : null
  , [accounts, selectedAccount])

  const accountTxsAllTime = useMemo(() =>
    selectedAccount ? allTransactions.filter(t => t.account_id === selectedAccount) : allTransactions
  , [allTransactions, selectedAccount])

  const displayBalance = selectedAccount && accountForBalance ? accountForBalance.balance : totalBalance
  const displaySpentAllTime = accountTxsAllTime.reduce((s, t) => s + t.value, 0)
  const displayExpenseAllTime = accountTxsAllTime.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0)


  // Saldo disponível = saldo inicial - transações realizadas (recorrentes são previsões, não deduzidos aqui)
  const availableBalance = displayBalance - displaySpentAllTime
  const spentPercent = displayBalance > 0 ? Math.min((displayExpenseAllTime / displayBalance) * 100, 100) : 0

  // Metrics mensais
  const totalSpent = useMemo(() =>
    filtered.filter(t => t.value > 0 && t.category !== 'invest').reduce((s, t) => s + t.value, 0), [filtered])
  const totalIncomeFromTx = useMemo(() =>
    filtered.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0), [filtered])
  const totalInvested = useMemo(() =>
    filtered.filter(t => t.category === 'invest' && t.value > 0).reduce((s, t) => s + t.value, 0), [filtered])
  const txCount = filtered.length

  const prevSpent = prevMonthTxs.filter(t => t.value > 0 && t.category !== 'invest').reduce((s, t) => s + t.value, 0)
  const spentChange = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0

  // Donut data — só despesas
  const donutData = useMemo(() => {
    const map = new Map<CategoryKey, number>()
    filtered.filter(t => t.value > 0).forEach(t => {
      const k = t.category as CategoryKey
      map.set(k, (map.get(k) || 0) + t.value)
    })
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
  }, [filtered])

  const recurringMonthlyExpense = useMemo(() =>
    activeRecurring.filter(r => r.value > 0).reduce((s, r) => s + monthlyAmount(r), 0), [activeRecurring])

  // Receitas recorrentes sem transação este mês (para o card de Receitas)
  const pendingRecurringIncome = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    return activeRecurring
      .filter(r => r.value < 0)
      .reduce((s, r) => {
        const hasTx = transactions.some(t =>
          t.date.startsWith(thisMonth) && t.value === r.value && t.description === r.description
        )
        return hasTx ? s : s + monthlyAmount(r)
      }, 0)
  }, [activeRecurring, transactions])

  // Receita total = transações reais + recorrentes ainda não processados
  const totalIncome = totalIncomeFromTx + pendingRecurringIncome

  // Line chart data (last 6 months)
  const lineData = useMemo(() => {
    const months: { month: string; [k: string]: number | string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const row: { month: string; [k: string]: number | string } = { month: monthLabel }
      const sourceTxs = selectedAccount ? allTransactions.filter(t => t.account_id === selectedAccount) : allTransactions
      Object.keys(CATEGORIES).forEach(cat => {
        row[cat] = sourceTxs
          .filter(t => t.category === cat && t.date.startsWith(monthKey))
          .reduce((s, t) => s + t.value, 0)
      })
      months.push(row)
    }
    return months
  }, [allTransactions, currentDate, selectedAccount])

  // Heatmap data
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    const sourceTxs = selectedAccount ? allTransactions.filter(t => t.account_id === selectedAccount) : allTransactions
    sourceTxs.forEach(t => {
      map.set(t.date, (map.get(t.date) || 0) + t.value)
    })
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }))
  }, [allTransactions, selectedAccount])

  const firstName = profile ? getFirstName(profile.full_name) : ''

  return (
    <main className="p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">
            Olá, <span className="text-accent">{firstName || '...'}</span>
          </h1>
          <p className="text-sm text-text-secondary">Visão consolidada dos seus gastos.</p>
          {/* Category chips */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {EXPENSE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategories.has(cat)
                    ? 'border-transparent'
                    : 'border-border bg-bg-surface text-text-secondary hover:border-accent'
                }`}
                style={activeCategories.has(cat) ? { backgroundColor: CATEGORIES[cat].bg, color: CATEGORIES[cat].text, borderColor: 'transparent' } : {}}
              >
                {CATEGORIES[cat].label}
              </button>
            ))}
          </div>
          {/* Account switcher */}
          {accounts.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                onClick={() => setSelectedAccount(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!selectedAccount ? 'bg-accent text-white border-accent' : 'border-border bg-bg-surface text-text-secondary hover:border-accent'}`}
              >
                Visão Geral
              </button>
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5"
                  style={selectedAccount === acc.id
                    ? { backgroundColor: acc.color, color: 'white', borderColor: acc.color }
                    : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedAccount === acc.id ? 'white' : acc.color }} />
                  {acc.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-bg-surface hover:bg-bg-page text-text-secondary hover:text-accent transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-accent capitalize min-w-[110px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-bg-surface hover:bg-bg-page text-text-secondary hover:text-accent transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Balance Overview */}
      {loading && accounts.length === 0 && <BalanceCardSkeleton />}
      {accounts.length > 0 && (
        <div className="bg-bg-surface rounded-xl border border-accent/30 border-t-2 border-t-accent p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
              {selectedAccount ? accounts.find(a => a.id === selectedAccount)?.name ?? 'Conta' : 'Saldo Geral'}
            </p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${spentPercent >= 90 ? 'bg-red-50 text-red-600' : spentPercent >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-green-50 text-green-600'}`}>
              {spentPercent.toFixed(1)}% comprometido
            </span>
          </div>

          <div className="flex items-end gap-8 mb-4 flex-wrap">
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Disponível</p>
              <p className={`text-2xl font-bold ${availableBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(availableBalance)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Saldo Total</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(displayBalance)}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary mb-0.5">Total Gasto</p>
              <p className="text-lg font-semibold text-text-primary">{formatCurrency(displayExpenseAllTime)}</p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="w-full h-2 bg-bg-page rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${spentPercent >= 90 ? 'bg-red-500' : spentPercent >= 70 ? 'bg-yellow-400' : 'bg-accent'}`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>

          {/* Breakdown por conta na visão geral */}
          {!selectedAccount && accounts.length > 1 && (
            <div className="flex gap-5 mt-4 flex-wrap">
              {accounts.map(acc => {
                const accSpent = allTransactions.filter(t => t.account_id === acc.id).reduce((s, t) => s + t.value, 0)
                const accAvail = acc.balance - accSpent
                return (
                  <div key={acc.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: acc.color }} />
                    <span className="text-xs text-text-secondary">{acc.name}:</span>
                    <span className={`text-xs font-semibold ${accAvail >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(accAvail)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard label="Despesas" value={totalSpent} change={spentChange} />
            <MetricCard label="Receitas" value={totalIncome} />
            <MetricCard label="Investido" value={totalInvested} />
            <MetricCard label="Transações" value={txCount} isCurrency={false} isCount />
          </>
        )}
      </div>

      {/* Empty state quando não há transações */}
      {!loading && transactions.length === 0 && (
        <div className="bg-bg-surface rounded-xl border border-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-8">
          <EmptyState
            icon={PlusCircle}
            title="Nenhuma transação neste mês"
            description="Adicione sua primeira transação para começar a visualizar seus dados financeiros."
          />
        </div>
      )}

      {/* Recorrentes */}
      {activeRecurring.length > 0 && (
        <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3.5 rounded-full bg-accent" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Compromissos Recorrentes</p>
            </div>
            <span className="text-xs text-text-tertiary">{formatCurrency(recurringMonthlyExpense)}/mês em despesas fixas</span>
          </div>
          <div className="flex flex-col gap-2">
            {activeRecurring.map(r => {
              const account = r.account_id ? accounts.find(a => a.id === r.account_id) : undefined
              const isIncome = r.value < 0
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-border-light last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{r.description}</p>
                    <p className="text-xs text-text-tertiary capitalize">{r.frequency === 'monthly' ? 'Mensal' : r.frequency === 'weekly' ? 'Semanal' : 'Anual'}</p>
                  </div>
                  {account && <AccountBadge account={account} size="sm" />}
                  <span className="text-sm font-semibold tabular-nums" style={{ color: isIncome ? '#16A34A' : '#DC2626' }}>
                    {isIncome ? '+' : '-'}{formatCurrency(Math.abs(r.value))}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          <div className="lg:col-span-2"><ChartCardSkeleton height={220} /></div>
          <div className="lg:col-span-3"><ChartCardSkeleton height={220} /></div>
        </div>
      )}
      {!loading && <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <div className="lg:col-span-2 bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3.5 rounded-full bg-accent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Distribuição por Categoria</p>
          </div>
          <DonutChart data={donutData} />
        </div>
        <div className="lg:col-span-3 bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3.5 rounded-full bg-accent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Últimos 6 Meses por Categoria</p>
          </div>
          <LineChart data={lineData} />
        </div>
      </div>}

      {/* Heatmap */}
      {loading
        ? <ChartCardSkeleton height={120} />
        : (
          <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-3.5 rounded-full bg-accent" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Atividade de Gastos {currentDate.getFullYear()}</p>
            </div>
            <ActivityHeatmap data={heatmapData} year={currentDate.getFullYear()} />
          </div>
        )
      }
    </main>
  )
}
