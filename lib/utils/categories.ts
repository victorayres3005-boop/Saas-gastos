export const CATEGORIES = {
  // ── Despesas ────────────────────────────────────────────────────────────────
  food:         { label: 'Alimentação',      color: '#059669', bg: '#ECFDF5', text: '#065F46', type: 'expense' }, // emerald
  transport:    { label: 'Transporte',       color: '#F59E0B', bg: '#FFFBEB', text: '#78350F', type: 'expense' }, // amber
  housing:      { label: 'Moradia',          color: '#64748B', bg: '#F1F5F9', text: '#1E293B', type: 'expense' }, // slate
  health:       { label: 'Saúde',            color: '#3B82F6', bg: '#EFF6FF', text: '#1E3A8A', type: 'expense' }, // blue
  education:    { label: 'Educação',         color: '#8B5CF6', bg: '#F5F3FF', text: '#4C1D95', type: 'expense' }, // violet
  leisure:      { label: 'Lazer',            color: '#F43F5E', bg: '#FFF1F2', text: '#881337', type: 'expense' }, // rose
  saas:         { label: 'Assinaturas',      color: '#4F46E5', bg: '#EEF2FF', text: '#312E81', type: 'expense' }, // indigo
  invest:       { label: 'Investimentos',    color: '#0D9488', bg: '#F0FDFA', text: '#134E4A', type: 'expense' }, // teal
  other:        { label: 'Outros',           color: '#94A3B8', bg: '#F8FAFC', text: '#334155', type: 'expense' }, // cool gray

  // ── Receitas ────────────────────────────────────────────────────────────────
  salary:       { label: 'Salário',          color: '#10B981', bg: '#D1FAE5', text: '#065F46', type: 'income' }, // green
  freelance:    { label: 'Freelance',        color: '#06B6D4', bg: '#CFFAFE', text: '#164E63', type: 'income' }, // cyan
  dividend:     { label: 'Rendimentos',      color: '#F97316', bg: '#FFEDD5', text: '#7C2D12', type: 'income' }, // orange
  rent_income:  { label: 'Aluguel Recebido', color: '#A855F7', bg: '#F3E8FF', text: '#581C87', type: 'income' }, // purple
  other_income: { label: 'Outras Receitas',  color: '#6B7280', bg: '#F3F4F6', text: '#1F2937', type: 'income' }, // gray
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const EXPENSE_CATEGORIES = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'expense')
export const INCOME_CATEGORIES  = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'income')
