'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

type Budget = Database['public']['Tables']['budgets']['Row']

export function useBudgets() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('budgets').select('*')
    setBudgets((data as Budget[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const upsertBudget = async (category: string, limit_value: number) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('budgets').upsert(
      { user_id: user.id, category, limit_value } as Budget,
      { onConflict: 'user_id,category' }
    )
    fetchBudgets()
  }

  return { budgets, loading, upsertBudget }
}
