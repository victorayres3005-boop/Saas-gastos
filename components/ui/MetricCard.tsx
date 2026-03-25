import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/formatters'

interface MetricCardProps {
  label: string
  value: number
  change?: number
  isCurrency?: boolean
  subtitle?: string
  isCount?: boolean
  variant?: 'default' | 'positive' | 'negative' | 'warning'
  icon?: React.ReactNode
}

const variantStyles = {
  default:  { border: 'border-l-accent',   badge: 'bg-accent/10 text-accent-text' },
  positive: { border: 'border-l-positive', badge: 'bg-positive-light text-positive' },
  negative: { border: 'border-l-negative', badge: 'bg-negative-light text-negative' },
  warning:  { border: 'border-l-warning',  badge: 'bg-warning-light text-warning' },
}

export function MetricCard({ label, value, change, isCurrency = true, subtitle, isCount, variant = 'default', icon }: MetricCardProps) {
  const isPositive = change !== undefined && change <= 0
  const displayValue = isCount ? value.toString() : isCurrency ? formatCurrency(value) : value.toString()
  const styles = variantStyles[variant]

  return (
    <div className={`bg-bg-surface rounded-xl border border-border border-l-4 ${styles.border} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</p>
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${styles.badge}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-[26px] font-bold text-text-primary leading-none mb-2 tabular-nums">{displayValue}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-positive' : 'text-negative'}`}>
          {isPositive ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
          <span>{change > 0 ? '+' : ''}{change.toFixed(1)}% vs mês anterior</span>
        </div>
      )}
      {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
    </div>
  )
}
