'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '../supabase/client'
import { CATEGORIES, type CategoryKey } from '../utils/categories'

export interface BudgetAlert {
  id: string
  type: 'budget' | 'goal'
  title: string
  message: string
  severity: 'warning' | 'danger'
  pct?: number
}

export function useBudgetAlerts() {
  const [budgets, setBudgets] = useState<{ category: string; limit_value: number }[]>([])
  const [spent, setSpent] = useState<Record<string, number>>({})
  const [goals, setGoals] = useState<{ id: string; title: string; target_value: number; current_value: number; deadline: string | null }[]>([])

  useEffect(() => {
    const supabase = createClient()
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    Promise.all([
      supabase.from('budgets').select('category,limit_value'),
      supabase.from('transactions').select('category,value').gte('date', start).lte('date', end).gt('value', 0),
      supabase.from('goals').select('id,title,target_value,current_value,deadline'),
    ]).then(([b, t, g]) => {
      setBudgets((b.data as typeof budgets) || [])
      const map: Record<string, number> = {}
      ;((t.data || []) as { category: string; value: number }[]).forEach(tx => {
        map[tx.category] = (map[tx.category] || 0) + tx.value
      })
      setSpent(map)
      setGoals((g.data as typeof goals) || [])
    })
  }, [])

  const alerts = useMemo((): BudgetAlert[] => {
    const result: BudgetAlert[] = []

    // Alertas de orçamento
    budgets.forEach(b => {
      if (b.limit_value <= 0) return
      const pct = ((spent[b.category] || 0) / b.limit_value) * 100
      const cat = CATEGORIES[b.category as CategoryKey]
      if (!cat) return
      if (pct >= 100) {
        result.push({
          id: `budget-${b.category}`,
          type: 'budget',
          title: `Orçamento estourado — ${cat.label}`,
          message: `Você gastou ${pct.toFixed(0)}% do limite mensal`,
          severity: 'danger',
          pct,
        })
      } else if (pct >= 80) {
        result.push({
          id: `budget-${b.category}`,
          type: 'budget',
          title: `Orçamento quase no limite — ${cat.label}`,
          message: `${pct.toFixed(0)}% do limite mensal utilizado`,
          severity: 'warning',
          pct,
        })
      }
    })

    // Alertas de metas com prazo próximo
    const today = new Date()
    goals.forEach(g => {
      if (!g.deadline) return
      const deadline = new Date(g.deadline)
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const progress = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0
      if (daysLeft <= 30 && daysLeft > 0 && progress < 100) {
        result.push({
          id: `goal-${g.id}`,
          type: 'goal',
          title: `Meta próxima do prazo — ${g.title}`,
          message: `${daysLeft} dia${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''}, ${progress.toFixed(0)}% concluída`,
          severity: daysLeft <= 7 ? 'danger' : 'warning',
        })
      }
    })

    return result
  }, [budgets, spent, goals])

  return alerts
}
