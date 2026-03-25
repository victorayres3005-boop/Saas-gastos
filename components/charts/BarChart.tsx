'use client'
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils/formatters'

interface BarChartProps {
  data: { month: string; receitas: number; despesas: number; economia: number }[]
}

export function BarChart({ data }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-text-tertiary">
        Sem dados para exibir
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <ReBarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(Number(value)),
            name === 'receitas' ? 'Receitas' : name === 'despesas' ? 'Despesas' : 'Economia',
          ]}
          contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v === 'receitas' ? 'Receitas' : v === 'despesas' ? 'Despesas' : 'Economia'}</span>} />
        <Bar dataKey="receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="economia" fill="#FF6B35" radius={[4, 4, 0, 0]} />
      </ReBarChart>
    </ResponsiveContainer>
  )
}
