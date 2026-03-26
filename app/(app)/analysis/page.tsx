'use client'
import { useState, useEffect, useMemo } from 'react'
import { TrendingDown, TrendingUp, Minus, Download, Calendar } from 'lucide-react'
import { BarChart } from '@/components/charts/BarChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { formatCurrency } from '@/lib/utils/formatters'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/utils/export'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function AnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<3 | 6 | 12>(6)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase.from('transactions').select('*').order('date')
      setTransactions((data as Transaction[]) || [])
      setLoading(false)
    }
    fetch()
  }, [])

  // ── Dados mensais ────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const now = new Date()
    const months = []
    for (let i = period - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = `${MONTH_NAMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
      const txs = transactions.filter(t => t.date.startsWith(key))
      const receitas = txs.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0)
      const despesas = txs.filter(t => t.value > 0 && t.category !== 'invest').reduce((s, t) => s + t.value, 0)
      const invest = txs.filter(t => t.category === 'invest').reduce((s, t) => s + t.value, 0)
      const economia = receitas - despesas - invest
      months.push({ month: label, key, receitas, despesas, economia, invest })
    }
    return months
  }, [transactions, period])

  // ── Métricas do período ───────────────────────────────────────────────────────
  const periodMetrics = useMemo(() => {
    const totalReceitas = monthlyData.reduce((s, m) => s + m.receitas, 0)
    const totalDespesas = monthlyData.reduce((s, m) => s + m.despesas, 0)
    const totalEconomia = monthlyData.reduce((s, m) => s + m.economia, 0)
    const totalInvest   = monthlyData.reduce((s, m) => s + m.invest, 0)
    const taxaEconomia  = totalReceitas > 0 ? (totalEconomia / totalReceitas) * 100 : 0

    const months = monthlyData.length
    const avgDespesas = months > 0 ? totalDespesas / months : 0
    const avgReceitas = months > 0 ? totalReceitas / months : 0

    // Tendência: compara primeira e segunda metade do período
    const half = Math.floor(months / 2)
    const firstHalf  = monthlyData.slice(0, half).reduce((s, m) => s + m.despesas, 0) / (half || 1)
    const secondHalf = monthlyData.slice(half).reduce((s, m) => s + m.despesas, 0) / ((months - half) || 1)
    const trend = secondHalf - firstHalf

    return { totalReceitas, totalDespesas, totalEconomia, totalInvest, taxaEconomia, avgDespesas, avgReceitas, trend }
  }, [monthlyData])

  // ── Previsão próximo mês ──────────────────────────────────────────────────────
  const prediction = useMemo(() => {
    const last3 = monthlyData.slice(-3)
    if (last3.length === 0) return null
    const avgDespesas = last3.reduce((s, m) => s + m.despesas, 0) / last3.length
    const avgReceitas = last3.reduce((s, m) => s + m.receitas, 0) / last3.length
    const next = new Date()
    next.setMonth(next.getMonth() + 1)
    const label = `${MONTH_NAMES[next.getMonth()]} ${next.getFullYear()}`
    return { label, despesas: avgDespesas, receitas: avgReceitas }
  }, [monthlyData])

  // ── Top categorias ────────────────────────────────────────────────────────────
  const topCategories = useMemo(() => {
    const keys = monthlyData.map(m => m.key)
    const map = new Map<CategoryKey, number>()
    transactions
      .filter(t => t.value > 0 && keys.some(k => t.date.startsWith(k)))
      .forEach(t => {
        const k = t.category as CategoryKey
        map.set(k, (map.get(k) || 0) + t.value)
      })
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, total]) => ({ category, total }))
  }, [transactions, monthlyData])

  const totalTopCategories = topCategories.reduce((s, c) => s + c.total, 0)

  // ── Evolução mês a mês ────────────────────────────────────────────────────────
  const monthOverMonth = useMemo(() => {
    if (monthlyData.length < 2) return null
    const curr = monthlyData[monthlyData.length - 1]
    const prev = monthlyData[monthlyData.length - 2]
    const diff = curr.despesas - prev.despesas
    const pct = prev.despesas > 0 ? (diff / prev.despesas) * 100 : 0
    return { diff, pct }
  }, [monthlyData])

  const handleExportCSV = () => {
    const keys = monthlyData.map(m => m.key)
    const txs = transactions.filter(t => keys.some(k => t.date.startsWith(k)))
    exportToCSV(txs, `relatorio-${period}meses`)
  }

  if (loading) {
    return (
      <main className="p-4 md:p-8 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-border rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="h-24 bg-border rounded-xl" />)}
          </div>
          <div className="h-72 bg-border rounded-xl" />
        </div>
      </main>
    )
  }

  return (
    <main className="p-4 md:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-1">Análise Financeira</h1>
          <p className="text-sm text-text-secondary">Tendências, comparativos e previsões dos seus gastos.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Período */}
          <div className="flex items-center gap-1 bg-bg-surface border border-accent/30 rounded-lg p-1">
            {([3, 6, 12] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === p ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {p}M
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-accent/30 rounded-lg bg-bg-surface hover:bg-bg-page text-text-secondary transition-colors"
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">Total Receitas</p>
          <p className="text-2xl font-bold text-positive">{formatCurrency(periodMetrics.totalReceitas)}</p>
          <p className="text-xs text-text-tertiary mt-1">Média: {formatCurrency(periodMetrics.avgReceitas)}/mês</p>
        </div>
        <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">Total Despesas</p>
          <p className="text-2xl font-bold text-negative">{formatCurrency(periodMetrics.totalDespesas)}</p>
          <p className="text-xs text-text-tertiary mt-1">Média: {formatCurrency(periodMetrics.avgDespesas)}/mês</p>
        </div>
        <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">Economia Líquida</p>
          <p className={`text-2xl font-bold ${periodMetrics.totalEconomia >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatCurrency(periodMetrics.totalEconomia)}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            Taxa: {periodMetrics.taxaEconomia >= 0 ? periodMetrics.taxaEconomia.toFixed(1) : '0.0'}%
          </p>
        </div>
        <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-2">Tendência Gastos</p>
          <div className="flex items-center gap-2">
            {periodMetrics.trend > 0 ? (
              <TrendingUp size={20} className="text-negative" />
            ) : periodMetrics.trend < 0 ? (
              <TrendingDown size={20} className="text-positive" />
            ) : (
              <Minus size={20} className="text-text-tertiary" />
            )}
            <p className={`text-2xl font-bold ${periodMetrics.trend > 0 ? 'text-negative' : periodMetrics.trend < 0 ? 'text-positive' : 'text-text-primary'}`}>
              {periodMetrics.trend > 0 ? '+' : ''}{formatCurrency(Math.abs(periodMetrics.trend))}
            </p>
          </div>
          <p className="text-xs text-text-tertiary mt-1">vs primeira metade do período</p>
        </div>
      </div>

      {/* Bar chart + previsão */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-1 h-3.5 rounded-full bg-accent" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Receitas vs Despesas</p>
            </div>
            {monthOverMonth && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${monthOverMonth.diff > 0 ? 'bg-negative-light text-negative' : 'bg-positive-light text-positive'}`}>
                {monthOverMonth.diff > 0 ? '+' : ''}{monthOverMonth.pct.toFixed(1)}% vs mês anterior
              </span>
            )}
          </div>
          <BarChart data={monthlyData} />
        </div>

        <div className="space-y-4">
          {/* Previsão */}
          {prediction && (
            <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} className="text-accent" />
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Previsão — {prediction.label}</p>
              </div>
              <p className="text-xs text-text-tertiary mb-1">Despesas previstas</p>
              <p className="text-xl font-bold text-negative mb-3">{formatCurrency(prediction.despesas)}</p>
              <p className="text-xs text-text-tertiary mb-1">Receitas previstas</p>
              <p className="text-xl font-bold text-positive mb-3">{formatCurrency(prediction.receitas)}</p>
              <div className="h-px bg-border my-2" />
              <p className="text-xs text-text-tertiary mb-1">Economia estimada</p>
              <p className={`text-lg font-bold ${(prediction.receitas - prediction.despesas) >= 0 ? 'text-positive' : 'text-negative'}`}>
                {formatCurrency(prediction.receitas - prediction.despesas)}
              </p>
              <p className="text-[10px] text-text-tertiary mt-2">Baseado na média dos últimos 3 meses</p>
            </div>
          )}

          {/* Mês a mês */}
          <div className="bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-3.5 rounded-full bg-accent" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Resumo Mensal</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...monthlyData].reverse().map(m => (
                <div key={m.key} className="flex items-center justify-between py-1 border-b border-border-light last:border-0">
                  <span className="text-xs text-text-secondary">{m.month}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-positive tabular-nums">+{formatCurrency(m.receitas)}</span>
                    <span className="text-xs text-negative tabular-nums">-{formatCurrency(m.despesas)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top categorias + donut */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3.5 rounded-full bg-accent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Distribuição por Categoria</p>
          </div>
          <DonutChart data={topCategories} />
        </div>
        <div className="lg:col-span-3 bg-bg-surface border border-accent/30 rounded-xl p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3.5 rounded-full bg-accent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Top Categorias — Últimos {period} meses</p>
          </div>
          {topCategories.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-text-tertiary">Sem dados para exibir</div>
          ) : (
            <div className="space-y-3">
              {topCategories.map(({ category, total }) => {
                const cat = CATEGORIES[category]
                const pct = totalTopCategories > 0 ? (total / totalTopCategories) * 100 : 0
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="text-sm text-text-primary">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-text-tertiary">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-semibold text-text-primary tabular-nums">{formatCurrency(total)}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
