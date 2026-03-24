export const CATEGORIES = {
  food:      { label: 'Alimentação',      color: '#16A34A', bg: '#F0FDF4', text: '#166534' },
  saas:      { label: 'Assinaturas/SaaS', color: '#2563EB', bg: '#EFF6FF', text: '#1D4ED8' },
  transport: { label: 'Transporte',       color: '#D97706', bg: '#FFFBEB', text: '#92400E' },
  leisure:   { label: 'Lazer',            color: '#DB2777', bg: '#FDF2F8', text: '#9D174D' },
  invest:    { label: 'Investimentos',    color: '#FF6B35', bg: '#FFF0EB', text: '#C94A1A' },
} as const

export type CategoryKey = keyof typeof CATEGORIES
