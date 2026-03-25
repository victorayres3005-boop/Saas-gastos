'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

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

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error') === 'oauth'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(oauthError ? 'Erro ao autenticar com Google. Tente novamente.' : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email ou senha incorretos')
    else {
      router.refresh()
      router.push('/dashboard')
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Erro ao conectar com Google. Tente novamente.')
      setGoogleLoading(false)
    }
    // on success, browser is redirected — no need to setLoading(false)
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

        <h1 className="text-2xl font-bold text-text-primary mb-1">Bem-vindo de volta</h1>
        <p className="text-sm text-text-secondary mb-7">Entre na sua conta para continuar</p>

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
          <span className="text-xs text-text-tertiary">ou entre com email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <div>
            <Input label="Senha" showPasswordToggle placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-accent hover:text-accent-text">Esqueceu a senha?</Link>
            </div>
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <Button type="submit" loading={loading} loadingText="Entrando..." disabled={googleLoading} className="w-full mt-2">Entrar</Button>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Não tem conta?{' '}
          <Link href="/signup" className="text-accent font-medium hover:text-accent-text">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
