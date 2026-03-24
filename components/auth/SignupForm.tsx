'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { MailCheck } from 'lucide-react'

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
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

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E5E5E5] rounded-xl p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Nome completo" placeholder="João Silva" value={fullName} onChange={e => setFullName(e.target.value)} required />
              <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} required />
              <Input label="Senha" showPasswordToggle placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} required />
              <Input label="Confirmar senha" showPasswordToggle placeholder="Repita a senha" value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} required />
              {errors.general && <p className="text-sm text-negative">{errors.general}</p>}
              <Button type="submit" loading={loading} loadingText="Criando conta..." className="w-full mt-2">Criar conta</Button>
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
