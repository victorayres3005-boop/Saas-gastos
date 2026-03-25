'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, MailCheck, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function BrandIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 28 24" fill="none">
      <rect x="2" y="0" width="24" height="16" rx="3" fill="#FF6B35"/>
      <rect x="6" y="18" width="16" height="4" rx="2" fill="#FF6B35" opacity="0.6"/>
      <rect x="10" y="16" width="8" height="3" rx="1" fill="#FF6B35" opacity="0.8"/>
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

function MiniBarChart() {
  const bars = [
    { h: 40, active: true },
    { h: 65, active: true },
    { h: 50, active: true },
    { h: 80, active: true },
    { h: 55, active: false },
    { h: 70, active: false },
  ]
  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {bars.map((b, i) => (
        <div key={i} className="rounded-sm flex-1" style={{
          height: `${b.h}%`,
          backgroundColor: b.active ? '#FF6B35' : '#3A3A3A',
          opacity: b.active ? 0.9 : 0.4,
        }} />
      ))}
    </div>
  )
}

function LeftPanel() {
  return (
    <div
      className="hidden md:flex flex-col justify-between relative overflow-hidden p-10"
      style={{ background: '#0D0D0D' }}
    >
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(255,107,53,0.18) 0%, transparent 70%)'
      }} />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#FF6B35', boxShadow: '0 4px 14px rgba(255,107,53,0.4)' }}>
          <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.01em' }}>FinanceTrack</span>
      </div>

      {/* Cards mockup */}
      <div className="relative z-10 flex flex-col gap-3">
        <div className="rounded-2xl p-5" style={{
          background: '#1A1A1A', border: '1px solid #2A2A2A',
          borderTop: '2px solid #FF6B35', boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
        }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Saldo Disponível</p>
          <p style={{ fontSize: 32, fontWeight: 700, color: '#F0F0F0', letterSpacing: '-0.02em', marginBottom: 12 }}>
            R$ 12.480<span style={{ fontSize: 20, color: '#555' }}>,00</span>
          </p>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.15)', border: '1px solid rgba(22,163,74,0.25)' }}>
              <ArrowUpRight size={11} color="#4ade80" />
              <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>+8.4%</span>
            </div>
            <span style={{ fontSize: 11, color: '#555' }}>vs mês anterior</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={12} color="#4ade80" />
              <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Receitas</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>R$ 8.200</p>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingDown size={12} color="#f87171" />
              <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Despesas</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>R$ 3.840</p>
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Últimos 6 meses</p>
            <span style={{ fontSize: 10, color: '#FF6B35', fontWeight: 600 }}>Despesas</span>
          </div>
          <MiniBarChart />
        </div>

        <div className="rounded-xl p-4" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontSize: 11, color: '#888' }}>Meta — Reserva emergência</p>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF6B35' }}>68%</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: '#2A2A2A' }}>
            <div className="h-full rounded-full" style={{ width: '68%', background: 'linear-gradient(90deg, #FF6B35, #F5A876)' }} />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span style={{ fontSize: 10, color: '#555' }}>R$ 6.800</span>
            <span style={{ fontSize: 10, color: '#555' }}>Meta: R$ 10.000</span>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <div className="relative z-10">
        <p style={{ fontSize: 13, color: '#444', marginBottom: 4 }}>
          Controle total das suas finanças,{' '}
          <span style={{ color: '#FF6B35', fontWeight: 600 }}>em um só lugar.</span>
        </p>
        <p style={{ fontSize: 11, color: '#333' }}>Mais de 1.000 usuários controlando seus gastos</p>
      </div>
    </div>
  )
}

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setErrors({ general: 'Erro ao conectar com Google. Tente novamente.' })
      setGoogleLoading(false)
    }
  }

  const inputBase = "w-full h-12 px-4 text-sm rounded-lg outline-none transition-all"
  const inputStyle = { background: '#F5F5F5', border: '1px solid #E8E8E8', color: '#1A1A1A', fontSize: 14 }
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#FF6B35'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = '#E8E8E8'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <LeftPanel />

      <div className="flex flex-col items-center justify-center bg-white px-8 py-12 md:px-20 overflow-y-auto">
        <div className="w-full" style={{ maxWidth: 480 }}>

          {/* Logo pequeno */}
          <div className="flex items-center gap-2.5 mb-8">
            <BrandIcon size={22} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>FinanceTrack</span>
          </div>

          {emailSent ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#FFF3EE', border: '1px solid rgba(255,107,53,0.2)' }}>
                <MailCheck size={26} style={{ color: '#FF6B35' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1A1A1A', marginBottom: 8 }}>Confirme seu email</h2>
              <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 4 }}>Enviamos um link de confirmação para:</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A1A', marginBottom: 16 }}>{email}</p>
              <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 24 }}>
                Clique no link do email para ativar sua conta e depois faça login.
              </p>
              <Link href="/login" style={{ color: '#FF6B35', fontWeight: 600, fontSize: 14 }}>
                Ir para o login →
              </Link>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
                Criar sua conta
              </h1>
              <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 24 }}>
                Comece a controlar seus gastos hoje.
              </p>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  height: 48, border: '1px solid #E8E8E8', borderRadius: 8,
                  background: '#fff', fontSize: 14, fontWeight: 500, color: '#1A1A1A',
                  cursor: 'pointer', marginBottom: 20,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              >
                {googleLoading
                  ? <span className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                  : <GoogleIcon />}
                {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
              </button>

              <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
                <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
                <span style={{ fontSize: 12, color: '#A0A0A0' }}>ou cadastre com email</span>
                <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
              </div>

              <form onSubmit={handleSubmit}>
                {/* Nome */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>
                    Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="João Silva"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className={inputBase}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={inputBase}
                    style={inputStyle}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  {errors.email && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.email}</p>}
                </div>

                {/* Senha */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className={inputBase}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.password}</p>}
                </div>

                {/* Confirmar senha */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      required
                      className={inputBase}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm && <p style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>{errors.confirm}</p>}
                </div>

                {errors.general && (
                  <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{errors.general}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
                  style={{
                    height: 52, background: '#FF6B35', color: '#fff',
                    fontSize: 15, fontWeight: 600, border: 'none',
                    borderRadius: 8, cursor: 'pointer', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E85A25' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FF6B35' }}
                >
                  {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 14, color: '#6B6B6B', marginTop: 20 }}>
                Já tenho conta?{' '}
                <Link href="/login" style={{ color: '#FF6B35', fontWeight: 600 }}>
                  Entrar
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
