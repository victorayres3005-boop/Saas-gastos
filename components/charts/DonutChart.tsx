'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'

interface DonutChartProps {
  data: { category: CategoryKey; total: number }[]
}

export function DonutChart({ data }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = data.map(d => ({
    name: CATEGORIES[d.category].label,
    value: d.total,
    color: CATEGORIES[d.category].color,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
