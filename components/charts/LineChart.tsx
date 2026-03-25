'use client'
import { useState } from 'react'
import {
  LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'

interface LineChartProps {
  data: { month: string; [key: string]: number | string }[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string; dataKey: string }[]
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null

  const items = payload
    .filter(p => p.value !== 0)
    .sort((a, b) => b.value - a.value)

  if (items.length === 0) return null

  return (
    <div className="bg-bg-surface border border-border rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.10)] p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-text-secondary mb-2 capitalize">{label}</p>
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-text-secondary">{item.name}</span>
            </div>
            <span className="text-xs font-semibold text-text-primary tabular-nums">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomLegend({ activeKeys, onToggle, visibleCategories }: {
  activeKeys: Set<string>
  onToggle: (key: string) => void
  visibleCategories: CategoryKey[]
}) {
  return (
    <div className="flex flex-wrap gap-2 mt-3 px-1">
      {visibleCategories.map(cat => {
        const c = CATEGORIES[cat]
        const active = activeKeys.has(cat)
        return (
          <button
            key={cat}
            onClick={() => onToggle(cat)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
            style={active
              ? { backgroundColor: c.bg, color: c.text, borderColor: c.color + '40' }
              : { backgroundColor: 'var(--bg-page)', color: 'var(--text-tertiary)', borderColor: 'var(--border)', opacity: 0.6 }
            }
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: active ? c.color : 'var(--text-tertiary)' }} />
            {c.label}
          </button>
        )
      })}
    </div>
  )
}

export function LineChart({ data }: LineChartProps) {
  // Detecta quais categorias têm algum dado
  const categoriesWithData = (Object.keys(CATEGORIES) as CategoryKey[]).filter(cat =>
    data.some(row => typeof row[cat] === 'number' && (row[cat] as number) !== 0)
  )

  // Começa com todas ativas
  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => new Set(categoriesWithData))

  const toggleKey = (key: string) => {
    setActiveKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        // Não deixa desativar a última
        if (next.size === 1) return prev
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (data.length === 0 || categoriesWithData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <ReLineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => v === 0 ? '' : `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 2' }} />
          {categoriesWithData.map(cat => (
            <Line
              key={cat}
              type="monotone"
              dataKey={cat}
              name={CATEGORIES[cat].label}
              stroke={CATEGORIES[cat].color}
              strokeWidth={activeKeys.has(cat) ? 2 : 0}
              dot={false}
              activeDot={activeKeys.has(cat) ? { r: 4, strokeWidth: 2, stroke: '#fff' } : false}
              hide={!activeKeys.has(cat)}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>

      <CustomLegend
        activeKeys={activeKeys}
        onToggle={toggleKey}
        visibleCategories={categoriesWithData}
      />
    </div>
  )
}
