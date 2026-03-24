import type { Database } from '../supabase/types'
import { CATEGORIES } from './categories'
import type { CategoryKey } from './categories'
import { formatCurrency } from './formatters'

type Transaction = Database['public']['Tables']['transactions']['Row']

export async function exportToPDF(
  transactions: Transaction[],
  month: string,
  year: number,
  userName: string
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header
  doc.setFillColor(255, 107, 53)
  doc.rect(0, 0, pageWidth, 35, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('FinanceTrack', margin, 16)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório de ${month} ${year}`, margin, 26)
  doc.text(userName, pageWidth - margin, 26, { align: 'right' })

  // Summary
  const total = transactions.reduce((s, t) => s + t.value, 0)
  const byCategory = new Map<string, number>()
  transactions.forEach(t => byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.value))

  doc.setTextColor(10, 10, 10)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo', margin, 50)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 107, 107)
  doc.text('Total gasto no período', margin, 60)
  doc.setTextColor(10, 10, 10)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(formatCurrency(total), margin, 70)

  // By category
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('Por categoria', margin, 88)

  let y = 98
  byCategory.forEach((value, cat) => {
    const label = CATEGORIES[cat as CategoryKey]?.label || cat
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(107, 107, 107)
    doc.text(`${label}`, margin, y)
    doc.setTextColor(10, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(value), pageWidth - margin, y, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(160, 160, 160)
    doc.text(`${pct}%`, pageWidth - margin - 45, y, { align: 'right' })
    y += 10
  })

  // Transactions table
  y += 10
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(10, 10, 10)
  doc.text('Transações', margin, y)
  y += 8

  // Table header
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F')
  doc.setFontSize(9)
  doc.setTextColor(107, 107, 107)
  doc.text('Data', margin + 2, y + 5.5)
  doc.text('Descrição', margin + 25, y + 5.5)
  doc.text('Categoria', margin + 105, y + 5.5)
  doc.text('Valor', pageWidth - margin - 2, y + 5.5, { align: 'right' })
  y += 10

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date))
  sorted.forEach((tx, i) => {
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F')
    }
    const dateStr = new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const label = CATEGORIES[tx.category as CategoryKey]?.label || tx.category
    doc.setFontSize(9)
    doc.setTextColor(107, 107, 107)
    doc.text(dateStr, margin + 2, y + 1)
    doc.setTextColor(10, 10, 10)
    const desc = tx.description.length > 45 ? tx.description.slice(0, 45) + '...' : tx.description
    doc.text(desc, margin + 25, y + 1)
    doc.setTextColor(107, 107, 107)
    doc.text(label, margin + 105, y + 1)
    doc.setTextColor(10, 10, 10)
    doc.setFont('helvetica', 'bold')
    doc.text(formatCurrency(tx.value), pageWidth - margin - 2, y + 1, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    y += 8
  })

  // Footer
  doc.setTextColor(160, 160, 160)
  doc.setFontSize(8)
  doc.text('Gerado pelo FinanceTrack', margin, 285)
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margin, 285, { align: 'right' })

  doc.save(`relatorio-${month.toLowerCase()}-${year}.pdf`)
}
