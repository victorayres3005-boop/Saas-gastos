export const CATEGORIES = {
  // ── Despesas ────────────────────────────────────────────────────────────────
  food:         { label: 'Alimentação',      color: '#A16207', bg: '#FDF8EF', text: '#713F12', type: 'expense' }, // âmbar escuro
  transport:    { label: 'Transporte',       color: '#1D4ED8', bg: '#F0F4FF', text: '#1E3A8A', type: 'expense' }, // azul profundo
  housing:      { label: 'Moradia',          color: '#374151', bg: '#F7F8FA', text: '#111827', type: 'expense' }, // cinza grafite
  health:       { label: 'Saúde',            color: '#075985', bg: '#F0F8FF', text: '#0C4A6E', type: 'expense' }, // azul clínico
  education:    { label: 'Educação',         color: '#4338CA', bg: '#F5F4FF', text: '#312E81', type: 'expense' }, // índigo
  leisure:      { label: 'Lazer',            color: '#9D174D', bg: '#FFF4F7', text: '#831843', type: 'expense' }, // vinho
  saas:         { label: 'Assinaturas',      color: '#5B21B6', bg: '#F8F6FF', text: '#3B0764', type: 'expense' }, // violeta profundo
  invest:       { label: 'Investimentos',    color: '#065F46', bg: '#F2FAF6', text: '#052E16', type: 'expense' }, // verde floresta
  other:        { label: 'Outros',           color: '#52525B', bg: '#F7F7F7', text: '#27272A', type: 'expense' }, // zinco neutro

  // ── Receitas ────────────────────────────────────────────────────────────────
  salary:       { label: 'Salário',          color: '#166534', bg: '#F0FAF4', text: '#14532D', type: 'income' }, // verde escuro
  freelance:    { label: 'Freelance',        color: '#155E75', bg: '#F0FBFD', text: '#164E63', type: 'income' }, // ciano profundo
  dividend:     { label: 'Rendimentos',      color: '#92400E', bg: '#FEF8ED', text: '#78350F', type: 'income' }, // âmbar-marrom
  rent_income:  { label: 'Aluguel Recebido', color: '#4C1D95', bg: '#F7F4FF', text: '#2E1065', type: 'income' }, // violeta escuro
  other_income: { label: 'Outras Receitas',  color: '#3F3F46', bg: '#F5F5F5', text: '#18181B', type: 'income' }, // zinco escuro
} as const

export type CategoryKey = keyof typeof CATEGORIES

export const EXPENSE_CATEGORIES = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'expense')
export const INCOME_CATEGORIES  = (Object.keys(CATEGORIES) as CategoryKey[]).filter(k => CATEGORIES[k].type === 'income')
