'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CategoryKey } from '@/lib/utils/categories'

const revalidateAll = () => {
  revalidatePath('/recurring')
  revalidatePath('/dashboard')
  revalidatePath('/accounts')
  revalidatePath('/transactions')
}

export async function addRecurring(data: {
  description: string
  value: number
  category: CategoryKey
  frequency: 'monthly' | 'weekly' | 'yearly'
  next_date: string
  account_id?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Try inserting with account_id (requires migration). If column doesn't exist yet,
  // fall back to inserting without it (account_id stored in localStorage instead).
  const { account_id, ...rest } = data
  let created: { id: string } | null = null
  let error: { message: string } | null = null

  const withAccountId = await supabase
    .from('recurring_transactions')
    .insert({ ...rest, account_id: account_id ?? null, user_id: user.id })
    .select('id')
    .single()

  if (withAccountId.error?.message?.includes('account_id')) {
    // Column doesn't exist yet — insert without it
    const fallback = await supabase
      .from('recurring_transactions')
      .insert({ ...rest, user_id: user.id })
      .select('id')
      .single()
    created = fallback.data
    error = fallback.error ? { message: fallback.error.message } : null
  } else {
    created = withAccountId.data
    error = withAccountId.error ? { message: withAccountId.error.message } : null
  }
  if (error) return { error: error.message }
  if (!created) return { error: 'Falha ao criar recorrente' }
  revalidateAll()
  return { success: true, id: created.id }
}

export async function deleteRecurring(id: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('recurring_transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}

export async function toggleRecurring(id: string, active: boolean) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('recurring_transactions').update({ active }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidateAll()
  return { success: true }
}
