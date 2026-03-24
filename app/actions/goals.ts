'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addGoal(data: {
  title: string
  target_value: number
  current_value: number
  deadline?: string
  color: string
  investment_type?: 'none' | 'cdb_100' | 'cdb_110' | 'selic' | 'poupanca'
}) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('goals').insert({ ...data, user_id: user.id })
  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateGoalProgress(id: string, current_value: number) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('goals').update({ current_value }).eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteGoal(id: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/goals')
  revalidatePath('/dashboard')
  return { success: true }
}
