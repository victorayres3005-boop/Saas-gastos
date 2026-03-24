'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getRecurringAccountStorage } from '@/lib/hooks/useRecurring'
import type { Database } from '@/lib/supabase/types'

type RecurringRow = Database['public']['Tables']['recurring_transactions']['Row']

export type ProcessorResult = {
  processed: number
  errors: string[]
}

export async function runRecurringProcessor(): Promise<ProcessorResult> {
  try {
    const today = new Date().toISOString().split('T')[0]
    return await processRecurring(today)
  } catch (err) {
    return { processed: 0, errors: [String(err)] }
  }
}

export function RecurringProcessor() {
  useEffect(() => {
    runRecurringProcessor()
  }, [])
  return null
}

async function processRecurring(today: string): Promise<ProcessorResult> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { processed: 0, errors: [authError?.message ?? 'Não autenticado'] }

  const { data: items, error: fetchError } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .lte('next_date', today)

  if (fetchError) return { processed: 0, errors: [fetchError.message] }
  if (!items || items.length === 0) return { processed: 0, errors: [] }

  const accountMap = getRecurringAccountStorage()
  let processed = 0
  const errors: string[] = []

  for (const item of items as RecurringRow[]) {
    let current = item.next_date
    const accountId = item.account_id ?? accountMap[item.id] ?? null

    while (current <= today) {
      const { error: insertError } = await supabase.from('transactions').insert({
        user_id: user.id,
        description: item.description,
        value: item.value,
        category: item.category as Database['public']['Tables']['transactions']['Insert']['category'],
        date: current,
        account_id: accountId,
      })

      if (insertError) {
        errors.push(`[${item.description}] ${insertError.message}`)
        break // Stop trying for this item
      }

      processed++

      const d = new Date(current + 'T12:00:00')
      if (item.frequency === 'monthly') d.setMonth(d.getMonth() + 1)
      else if (item.frequency === 'weekly') d.setDate(d.getDate() + 7)
      else if (item.frequency === 'yearly') d.setFullYear(d.getFullYear() + 1)
      current = d.toISOString().split('T')[0]
    }

    // Only advance next_date if at least one transaction was successfully created
    if (processed > 0 || errors.length === 0) {
      await supabase
        .from('recurring_transactions')
        .update({ next_date: current })
        .eq('id', item.id)
        .eq('user_id', user.id)
    }
  }

  if (processed > 0) {
    window.dispatchEvent(new CustomEvent('fintrack:transactions-updated'))
  }

  return { processed, errors }
}
