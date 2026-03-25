'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

export type Account = Database['public']['Tables']['accounts']['Row']

const LS_KEY = 'fintrack_account_banks'

export function getBankStorage(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}

export function setBankStorage(accountId: string, bankId: string | null) {
  const current = getBankStorage()
  if (bankId) current[accountId] = bankId
  else delete current[accountId]
  localStorage.setItem(LS_KEY, JSON.stringify(current))
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: true })

    // Enriquece com banco salvo localmente (fallback enquanto coluna 'bank' não existe no DB)
    const banks = getBankStorage()
    const enriched = ((data as Account[]) || []).map(acc => ({
      ...acc,
      bank: acc.bank ?? banks[acc.id] ?? null,
    }))

    setAccounts(enriched)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  useEffect(() => {
    window.addEventListener('fintrack:accounts-updated', fetchAccounts)
    return () => window.removeEventListener('fintrack:accounts-updated', fetchAccounts)
  }, [fetchAccounts])

  return { accounts, loading, refetch: fetchAccounts }
}
