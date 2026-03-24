'use client'
import { useState, useMemo, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MetricCard } from '@/components/ui/MetricCard'
import { MetricCardSkeleton } from '@/components/ui/Skeleton'
import { DonutChart } from '@/components/charts/DonutChart'
import { LineChart } from '@/components/charts/LineChart'
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useProfile } from '@/lib/hooks/useProfile'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatMonthYear, getFirstName } from '@/lib/utils/formatters'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export default function DashboardPage() {
  const now = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const { transactions, loading } = useTransactions(currentDate.getMonth(), currentDate.getFullYear())
  const { profile } = useProfile()
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [activeCategories, setActiveCategories] = useState<Set<CategoryKey>>(new Set())
  const [prevMonthTxs, setPrevMonthTxs] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('transactions').select('*').order('date')
      setAllTransactions((data as Transaction[]) || [])
    }
    fetchAll()
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

  const filtered = useMemo(() => {
    if (activeCategories.size === 0) return transactions
    return transactions.filter(t => activeCategories.has(t.category as CategoryKey))
  }, [transactions, activeCategories])

  const toggleCategory = (cat: CategoryKey) => {
    setActiveCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Metrics
  const totalSpent = useMemo(() =>
    filtered.filter(t => t.category !== 'invest').reduce((s, t) => s + t.value, 0), [filtered])
  const totalInvested = useMemo(() =>
    filtered.filter(t => t.category === 'invest').reduce((s, t) => s + t.value, 0), [filtered])
  const txCount = filtered.length

  const prevSpent = prevMonthTxs.filter(t => t.category !== 'invest').reduce((s, t) => s + t.value, 0)
  const spentChange = prevSpent > 0 ? ((totalSpent - prevSpent) / prevSpent) * 100 : 0

  // Donut data
  const donutData = useMemo(() => {
    const map = new Map<CategoryKey, number>()
    filtered.forEach(t => {
      const k = t.category as CategoryKey
      map.set(k, (map.get(k) || 0) + t.value)
    })
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
  }, [filtered])

  // Line chart data (last 6 months)
  const lineData = useMemo(() => {
    const months: { month: string; [k: string]: number | string }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const row: { month: string; [k: string]: number | string } = { month: monthLabel }
      Object.keys(CATEGORIES).forEach(cat => {
        row[cat] = allTransactions
          .filter(t => t.category === cat && t.date.startsWith(monthKey))
          .reduce((s, t) => s + t.value, 0)
      })
      months.push(row)
    }
    return months
  }, [allTransactions, currentDate])

  // Heatmap data
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    allTransactions.forEach(t => {
      map.set(t.date, (map.get(t.date) || 0) + t.value)
    })
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }))
  }, [allTransactions])

  const firstName = profile ? getFirstName(profile.full_name) : ''

  return (
    <main className="p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-1">
            Olá, {firstName || '...'}
          </h1>
          <p className="text-sm text-text-secondary">Visão consolidada dos seus gastos.</p>
          {/* Category chips */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  activeCategories.has(cat)
                    ? 'border-transparent'
                    : 'border-border bg-white text-text-secondary hover:border-accent'
                }`}
                style={activeCategories.has(cat) ? { backgroundColor: CATEGORIES[cat].bg, color: CATEGORIES[cat].text, borderColor: 'transparent' } : {}}
              >
                {CATEGORIES[cat].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-bg-page text-text-secondary">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-text-primary capitalize min-w-[110px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border bg-white hover:bg-bg-page text-text-secondary">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array(4).fill(0).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <MetricCard label="Total Gasto" value={totalSpent} change={spentChange} />
            <MetricCard label="Total Investido" value={totalInvested} />
            <MetricCard label="Transações" value={txCount} isCurrency={false} isCount />
            <MetricCard label="Categorias Ativas" value={donutData.length} isCurrency={false} isCount subtitle={`de ${Object.keys(CATEGORIES).length} categorias`} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-4">Distribuição por Categoria</p>
          <DonutChart data={donutData} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-4">Últimos 6 Meses por Categoria</p>
          <LineChart data={lineData} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-4">Atividade de Gastos {currentDate.getFullYear()}</p>
        <ActivityHeatmap data={heatmapData} year={currentDate.getFullYear()} />
      </div>
    </main>
  )
}
