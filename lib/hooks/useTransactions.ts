'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../supabase/client'
import type { Database } from '../supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export function useTransactions(month?: number, year?: number) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
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
    if (error) setError(error.message)
    else setTransactions((data as Transaction[]) || [])
    setLoading(false)
  }, [month, year])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // Refaz fetch quando o RecurringProcessor criar novas transações
  useEffect(() => {
    const handler = () => fetchTransactions()
    window.addEventListener('fintrack:transactions-updated', handler)
    return () => window.removeEventListener('fintrack:transactions-updated', handler)
  }, [fetchTransactions])

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const insert: TransactionInsert = { ...tx, user_id: user.id }
    const { error } = await supabase.from('transactions').insert(insert as Transaction)
    if (!error) fetchTransactions()
    return { error: error?.message }
  }

  const deleteTransaction = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id))
    return { error: error?.message }
  }

  const importTransactions = async (txs: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[]) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const rows = txs.map(t => ({ ...t, user_id: user.id })) as Transaction[]
    const { error } = await supabase.from('transactions').insert(rows)
    if (!error) fetchTransactions()
    return { error: error?.message }
  }

  return { transactions, loading, error, addTransaction, deleteTransaction, importTransactions, refetch: fetchTransactions }
}
