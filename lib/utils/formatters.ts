export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export function formatMonth(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
}

export function getFirstName(fullName: string): string {
  return fullName.split(' ')[0]
}
