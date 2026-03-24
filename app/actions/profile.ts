'use server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(full_name: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateAvatar(avatar_url: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  const { error } = await supabase.from('profiles').update({ avatar_url }).eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

// Envia e-mail de verificação para o novo endereço.
// O perfil só é atualizado depois que o usuário confirmar no link recebido.
export async function updateEmail(email: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  if (email === user.email) return { error: 'Este já é o seu e-mail atual' }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: error.message }
  return { success: true }
}

// Verifica a senha atual antes de permitir a troca
export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { error: 'Não autenticado' }

  // Valida a senha atual
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'Senha atual incorreta' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }
  await supabase.from('transactions').delete().eq('user_id', user.id)
  await supabase.from('budgets').delete().eq('user_id', user.id)
  await supabase.from('goals').delete().eq('user_id', user.id)
  await supabase.from('recurring_transactions').delete().eq('user_id', user.id)
  await supabase.from('profiles').delete().eq('id', user.id)
  await supabase.auth.signOut()
  return { success: true }
}
