'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAccount(data: {
  name: string
  type: 'meal_voucher' | 'credit' | 'debit' | 'cash' | 'checking'
  color: string
  balance: number
  bank?: string | null
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // 'bank' é salvo localmente no cliente; aqui enviamos apenas os campos que existem no banco
  const { bank: _, ...dbData } = data
  const { data: created, error } = await supabase
    .from('accounts')
    .insert({ ...dbData, user_id: user.id })
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true, id: created.id }
}

export async function updateAccount(id: string, data: {
  name?: string
  color?: string
  balance?: number
  bank?: string | null
}) {
  const supabase = createServerSupabaseClient()

  const { bank: _, ...dbData } = data
  const { error } = await supabase.from('accounts').update(dbData).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/accounts')
  return { success: true }
}

export async function deleteAccount(id: string) {
  const supabase = createServerSupabaseClient()
  // Unlink transactions from this account
  await supabase.from('transactions').update({ account_id: null }).eq('account_id', id)
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}
