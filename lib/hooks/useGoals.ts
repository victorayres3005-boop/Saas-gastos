'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

type Goal = Database['public']['Tables']['goals']['Row']

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false })
    setGoals((data as Goal[]) || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  return { goals, loading, refetch: fetchGoals }
}
