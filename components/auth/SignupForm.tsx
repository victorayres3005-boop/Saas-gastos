'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { MailCheck } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [emailSent, setEmailSent] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (password.length < 8) e.password = 'Mínimo de 8 caracteres'
    if (password !== confirm) e.confirm = 'As senhas não coincidem'
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    setErrors({})
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) {
      if (error.message.includes('already')) setErrors({ email: 'Email já cadastrado' })
      else setErrors({ general: error.message })
    } else {
      setEmailSent(true)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setErrors({})
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setErrors({ general: 'Erro ao conectar com Google. Tente novamente.' })
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-xl p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-lg text-text-primary">FinanceTrack</span>
        </div>

        {emailSent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-4">
              <MailCheck size={24} className="text-accent" />
            </div>
            <h1 className="text-xl font-bold text-text-primary mb-2">Confirme seu email</h1>
            <p className="text-sm text-text-secondary mb-1">
              Enviamos um link de confirmação para:
            </p>
            <p className="text-sm font-medium text-text-primary mb-4">{email}</p>
            <p className="text-sm text-text-secondary mb-6">
              Clique no link do email para ativar sua conta e depois faça login.
            </p>
            <Link href="/login" className="text-sm text-accent font-medium hover:text-accent-text">
              Ir para o login →
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Criar sua conta</h1>
            <p className="text-sm text-text-secondary mb-7">Comece a controlar seus gastos hoje</p>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-[#E5E5E5] rounded-lg text-sm font-medium text-text-primary bg-white hover:bg-[#F9F9F9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-[#E5E5E5] border-t-text-secondary rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
            </button>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-text-tertiary">ou cadastre com email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome completo" placeholder="João Silva" value={fullName} onChange={e => setFullName(e.target.value)} required />
              <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} required />
              <Input label="Senha" showPasswordToggle placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} required />
              <Input label="Confirmar senha" showPasswordToggle placeholder="Repita a senha" value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} required />
              {errors.general && <p className="text-sm text-negative">{errors.general}</p>}
              <Button type="submit" loading={loading} loadingText="Criando conta..." disabled={googleLoading} className="w-full mt-2">Criar conta</Button>
            </form>

            <p className="text-center text-sm text-text-secondary mt-5">
              Já tem conta?{' '}
              <Link href="/login" className="text-accent font-medium hover:text-accent-text">Entrar</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
