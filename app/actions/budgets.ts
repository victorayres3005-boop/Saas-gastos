'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertBudget(category: string, limit_value: number) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('budgets').upsert(
    { user_id: user.id, category, limit_value },
    { onConflict: 'user_id,category' }
  )

  if (error) return { error: error.message }
  revalidatePath('/budget')
  return { success: true }
}
