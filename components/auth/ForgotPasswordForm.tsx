'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { CheckCircle } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
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
        {sent ? (
          <div className="text-center">
            <CheckCircle size={40} className="mx-auto mb-4 text-positive" />
            <h1 className="text-xl font-bold text-text-primary mb-2">Link enviado!</h1>
            <p className="text-sm text-text-secondary mb-6">Verifique seu email e siga as instruções para redefinir sua senha.</p>
            <Link href="/login" className="text-sm text-accent font-medium hover:text-accent-text">← Voltar ao login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Recuperar senha</h1>
            <p className="text-sm text-text-secondary mb-7">Enviaremos um link para redefinir sua senha</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label="Email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              {error && <p className="text-sm text-negative">{error}</p>}
              <Button type="submit" loading={loading} loadingText="Enviando..." className="w-full">Enviar link</Button>
            </form>
            <p className="text-center text-sm text-text-secondary mt-5">
              <Link href="/login" className="text-accent font-medium hover:text-accent-text">← Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
