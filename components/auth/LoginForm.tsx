'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const stripes = [
  { left: '5%',  width: 48, opacity: 0.18 },
  { left: '12%', width: 32, opacity: 0.25 },
  { left: '20%', width: 64, opacity: 0.15 },
  { left: '30%', width: 40, opacity: 0.22 },
  { left: '40%', width: 56, opacity: 0.18 },
  { left: '52%', width: 36, opacity: 0.28 },
  { left: '62%', width: 72, opacity: 0.15 },
  { left: '74%', width: 44, opacity: 0.20 },
  { left: '84%', width: 30, opacity: 0.25 },
  { left: '91%', width: 52, opacity: 0.18 },
]

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

function LeftPanel() {
  return (
    <div
      className="hidden md:flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #FDDCC4 0%, #FAC09A 50%, #F5A876 100%)' }}
    >
      {/* Listras verticais */}
      {stripes.map((s, i) => (
        <div
          key={i}
          className="absolute top-0 h-full rounded-sm"
          style={{ left: s.left, width: s.width, backgroundColor: `rgba(255,255,255,${s.opacity})` }}
        />
      ))}

      {/* Logo centralizado */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <BrandIcon size={48} />
          <span style={{ fontSize: 32, fontWeight: 700, color: '#FF6B35', letterSpacing: '-0.02em' }}>
            FinanceTrack
          </span>
        </div>
        <p style={{ fontSize: 15, color: 'rgba(180,80,20,0.65)', marginTop: 8 }}>
          Controle total das suas finanças
        </p>
      </div>

      {/* Tagline rodapé */}
      <div className="absolute bottom-10 z-10 text-center" style={{ fontSize: 14 }}>
        <span style={{ color: 'rgba(180,80,20,0.7)' }}>Construa algo grande, </span>
        <span style={{ color: '#FF6B35', fontWeight: 600 }}>sem limites</span>
      </div>
    </div>
  )
}

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const oauthError = searchParams.get('error') === 'oauth'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      setError('Erro ao conectar com Google. Tente novamente.')
      setGoogleLoading(false)
    }
  }

  const inputClass = "w-full h-12 px-4 text-sm rounded-lg outline-none transition-all"
  const inputStyle = {
    background: '#F5F5F5',
    border: '1px solid #E8E8E8',
    color: '#1A1A1A',
    fontSize: 14,
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <LeftPanel />

      {/* Painel direito */}
      <div className="flex flex-col items-center justify-center bg-white px-8 py-12 md:px-20">
        <div className="w-full" style={{ maxWidth: 480 }}>

          {/* Logo pequeno */}
          <div className="flex items-center gap-2.5 mb-8">
            <BrandIcon size={22} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>FinanceTrack</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1A1A1A', marginBottom: 6 }}>
            Bem-vindo de volta
          </h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', marginBottom: 28 }}>
            Entre com seus dados para acessar o painel.
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

          {/* Divisor */}
          <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
            <span style={{ fontSize: 12, color: '#A0A0A0' }}>ou entre com email</span>
            <div className="flex-1 h-px" style={{ background: '#E8E8E8' }} />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit}>
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
                className={inputClass}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {/* Senha */}
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={inputClass}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#FF6B35'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.12)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E8E8E8'; e.currentTarget.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Esqueceu senha */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#1A1A1A', textDecoration: 'underline' }}>
                Esqueceu a senha?
              </Link>
            </div>

            {/* Erro */}
            {error && (
              <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 12 }}>{error}</p>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              style={{
                height: 52, background: loading || googleLoading ? '#FF6B35' : '#FF6B35',
                color: '#fff', fontSize: 15, fontWeight: 600, border: 'none',
                borderRadius: 8, cursor: 'pointer', letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#E85A25' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF6B35' }}
            >
              {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link cadastro */}
          <p style={{ textAlign: 'center', fontSize: 14, color: '#6B6B6B', marginTop: 20 }}>
            Não tem conta?{' '}
            <Link href="/signup" style={{ color: '#FF6B35', fontWeight: 600 }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  )
}
