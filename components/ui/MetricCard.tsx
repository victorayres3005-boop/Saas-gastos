import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

interface MetricCardProps {
  label: string
  value: number
  change?: number
  isCurrency?: boolean
  subtitle?: string
  isCount?: boolean
}

export function MetricCard({ label, value, change, isCurrency = true, subtitle, isCount }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0
  const displayValue = isCount ? value.toString() : isCurrency ? formatCurrency(value) : value.toString()

  return (
    <div className="bg-bg-surface rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary mb-3">{label}</p>
      <p className="text-[28px] font-bold text-text-primary leading-none mb-2">{displayValue}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{isPositive ? '+' : ''}{change.toFixed(1)}% vs mês anterior</span>
        </div>
      )}
      {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
    </div>
  )
}
