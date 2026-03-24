'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError('Email ou senha incorretos')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-xl p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-bold text-lg text-text-primary">FinanceTrack</span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Bem-vindo de volta</h1>
        <p className="text-sm text-text-secondary mb-7">Entre na sua conta para continuar</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <div>
            <Input label="Senha" showPasswordToggle placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-accent hover:text-accent-text">Esqueceu a senha?</Link>
            </div>
          </div>
          {error && <p className="text-sm text-negative">{error}</p>}
          <Button type="submit" loading={loading} loadingText="Entrando..." className="w-full mt-2">Entrar</Button>
        </form>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-tertiary">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <p className="text-center text-sm text-text-secondary">
          Não tem conta?{' '}
          <Link href="/signup" className="text-accent font-medium hover:text-accent-text">Criar conta</Link>
        </p>
      </div>
    </div>
  )
}
