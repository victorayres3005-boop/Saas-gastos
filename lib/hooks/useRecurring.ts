'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

export type Recurring = Database['public']['Tables']['recurring_transactions']['Row']

const LS_KEY = 'fintrack_recurring_accounts'

export function getRecurringAccountStorage(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export function setRecurringAccountStorage(recurringId: string, accountId: string | null) {
  const current = getRecurringAccountStorage()
  if (accountId) current[recurringId] = accountId
  else delete current[recurringId]
  localStorage.setItem(LS_KEY, JSON.stringify(current))
}

export function useRecurring() {
  const [items, setItems] = useState<Recurring[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('recurring_transactions')
      .select('*')
      .order('next_date', { ascending: true })

    // Enrich with localStorage fallback for legacy records without DB account_id
    const lsAccounts = getRecurringAccountStorage()
    const enriched = ((data as Recurring[]) || []).map(item => ({
      ...item,
      account_id: item.account_id ?? lsAccounts[item.id] ?? null,
    }))

    setItems(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  return { items, loading, refetch: fetchItems }
}
