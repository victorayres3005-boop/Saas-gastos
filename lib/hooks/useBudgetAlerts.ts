'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '../supabase/client'

export function useBudgetAlerts() {
  const [budgets, setBudgets] = useState<{ category: string; limit_value: number }[]>([])
  const [spent, setSpent] = useState<Record<string, number>>({})

  useEffect(() => {
    const supabase = createClient()
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    Promise.all([
      supabase.from('budgets').select('category,limit_value'),
      supabase.from('transactions').select('category,value').gte('date', start).lte('date', end).gt('value', 0),
    ]).then(([b, t]) => {
      setBudgets((b.data as typeof budgets) || [])
      const map: Record<string, number> = {}
      ;((t.data || []) as { category: string; value: number }[]).forEach(tx => {
        map[tx.category] = (map[tx.category] || 0) + tx.value
      })
      setSpent(map)
    })
  }, [])

  return useMemo(() => {
    return budgets.filter(b => b.limit_value > 0 && (spent[b.category] || 0) / b.limit_value >= 0.8).length
  }, [budgets, spent])
}
