import type { Database } from '../supabase/types'
import { CATEGORIES } from './categories'
import type { CategoryKey } from './categories'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function exportToCSV(transactions: Transaction[], filename: string) {
  const header = 'Data,Descrição,Categoria,Valor'
  const rows = transactions.map(t => {
    const cat = CATEGORIES[t.category as CategoryKey]?.label || t.category
    return `"${t.date}","${t.description}","${cat}","${t.value.toFixed(2)}"`
  })
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
