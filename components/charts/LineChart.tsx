'use client'
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'

interface LineChartProps {
  data: { month: string; [key: string]: number | string }[]
}

export function LineChart({ data }: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
        Sem dados para exibir
      </div>
    )
  }

  const categories = Object.keys(CATEGORIES) as CategoryKey[]

  return (
    <ResponsiveContainer width="100%" height={220}>
      <ReLineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
        <Legend iconType="circle" iconSize={8} />
        {categories.map(cat => (
          <Line key={cat} type="monotone" dataKey={cat} name={CATEGORIES[cat].label} stroke={CATEGORIES[cat].color} strokeWidth={2} dot={false} />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
