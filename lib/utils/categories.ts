export const CATEGORIES = {
  // Despesas
  food:         { label: 'Alimentação',      color: '#16A34A', bg: '#F0FDF4', text: '#166534', type: 'expense' },
  saas:         { label: 'Assinaturas/SaaS', color: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8', type: 'expense' },
  transport:    { label: 'Transporte',       color: '#D97706', bg: '#FFFBEB', text: '#92400E', type: 'expense' },
  leisure:      { label: 'Lazer',            color: '#DB2777', bg: '#FDF2F8', text: '#9D174D', type: 'expense' },
  invest:       { label: 'Investimentos',    color: '#FF6B35', bg: '#FFF0EB', text: '#C94A1A', type: 'expense' },
  health:       { label: 'Saúde',            color: '#0891B2', bg: '#ECFEFF', text: '#155E75', type: 'expense' },
  education:    { label: 'Educação',         color: '#7C3AED', bg: '#F5F3FF', text: '#5B21B6', type: 'expense' },
  housing:      { label: 'Moradia',          color: '#374151', bg: '#F9FAFB', text: '#1F2937', type: 'expense' },
  other:        { label: 'Outros',           color: '#6B7280', bg: '#F3F4F6', text: '#374151', type: 'expense' },
  // Receitas
  salary:       { label: 'Salário',          color: '#16A34A', bg: '#F0FDF4', text: '#166534', type: 'income' },
  freelance:    { label: 'Freelance',        color: '#0891B2', bg: '#ECFEFF', text: '#155E75', type: 'income' },
  rent_income:  { label: 'Aluguel Recebido', color: '#7C3AED', bg: '#F5F3FF', text: '#5B21B6', type: 'income' },
  dividend:     { label: 'Rendimentos',      color: '#D97706', bg: '#FFFBEB', text: '#92400E', type: 'income' },
  other_income: { label: 'Outras Receitas',  color: '#6B7280', bg: '#F3F4F6', text: '#374151', type: 'income' },
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const EXPENSE_CATEGORIES = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'expense')
export const INCOME_CATEGORIES  = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'income')
