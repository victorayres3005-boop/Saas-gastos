'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export function useTransactions(month?: number, year?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  const fetchTransactions = useCallback(async (silent = false) => {
    const fetchId = ++fetchIdRef.current
    if (!silent) setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query
    if (fetchId !== fetchIdRef.current) return // resposta obsoleta, descarta
    if (error) setError(error.message)
    else setTransactions((data as Transaction[]) || [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // Refaz fetch quando transações forem criadas/editadas/removidas
  useEffect(() => {
    const handler = () => fetchTransactions(true)
    const onVisible = () => { if (document.visibilityState === 'visible') fetchTransactions(true) }
    window.addEventListener('fintrack:transactions-updated', handler)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('fintrack:transactions-updated', handler)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchTransactions])

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const insert: TransactionInsert = { ...tx, user_id: user.id }
    const { error } = await supabase.from('transactions').insert(insert as Transaction)
    if (!error) window.dispatchEvent(new Event('fintrack:transactions-updated'))
    return { error: error?.message }
  }

  const deleteTransaction = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id))
      window.dispatchEvent(new Event('fintrack:transactions-updated'))
    }
    return { error: error?.message }
  }

  const deleteTransactions = async (ids: string[]) => {
    if (ids.length === 0) return { error: undefined }
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().in('id', ids)
    if (!error) {
      setTransactions(prev => prev.filter(t => !ids.includes(t.id)))
      window.dispatchEvent(new Event('fintrack:transactions-updated'))
    }
    return { error: error?.message }
  }

  const importTransactions = async (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const rows = txs.map(t => ({ ...t, user_id: user.id })) as Transaction[]
    const { error } = await supabase.from('transactions').insert(rows)
    if (!error) window.dispatchEvent(new Event('fintrack:transactions-updated'))
    return { error: error?.message }
  }

  return { transactions, loading, error, addTransaction, deleteTransaction, deleteTransactions, importTransactions, refetch: fetchTransactions }
}
