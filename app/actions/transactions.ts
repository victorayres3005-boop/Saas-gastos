'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CategoryKey } from '@/lib/utils/categories'

const revalidateAll = () => {
  revalidatePath('/transactions')
  revalidatePath('/dashboard')
  revalidatePath('/budget')
  revalidatePath('/accounts')
}

export async function addTransaction(data: {
  description: string
  value: number
  category: CategoryKey
  date: string
  notes?: string | null
  account_id?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('transactions').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function importTransactions(rows: {
  description: string
  value: number
  category: CategoryKey
  date: string
  notes?: string | null
  account_id?: string | null
}[]) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('transactions').insert(rows.map(r => ({ ...r, user_id: user.id })))
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function updateTransaction(id: string, data: {
  description: string
  value: number
  category: CategoryKey
  date: string
  notes?: string | null
  account_id?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('transactions').update(data).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}
