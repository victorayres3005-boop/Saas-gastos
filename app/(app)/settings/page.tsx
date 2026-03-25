'use client'
import { useState, useRef } from 'react'
import {
  Camera, Download, Trash2, Mail,
  FileText, Loader2, CheckCircle2, Eye, EyeOff,
  AlertTriangle, Sun, Moon, Monitor,
} from 'lucide-react'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { useTheme } from '@/components/providers/ThemeProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { updateProfile, updateAvatar, updateEmail, updatePassword, deleteAccount } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/utils/export'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

function SectionCard({ title, description, children, danger }: {
  title: string
  description?: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <section className={`rounded-xl border p-6 ${danger ? 'border-negative/20 bg-negative-light' : 'bg-bg-surface border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)]'}`}>
      <div className="mb-5">
        <h2 className={`text-sm font-semibold ${danger ? 'text-negative' : 'text-text-primary'}`}>{title}</h2>
        {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function PasswordInput({ label, value, onChange, placeholder, error }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text-primary">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-9 px-3 pr-10 border rounded-lg text-sm text-text-primary bg-bg-surface outline-none focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all placeholder:text-text-tertiary ${error ? 'border-negative focus:border-negative' : 'border-border focus:border-accent'}`}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-negative">{error}</p>}
    </div>
  )
}

const strengthRules = [
  { test: (p: string) => p.length >= 8,          label: '8+ chars' },
  { test: (p: string) => /[A-Z]/.test(p),        label: 'Maiúscula' },
  { test: (p: string) => /[0-9]/.test(p),        label: 'Número' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Símbolo' },
]

export default function SettingsPage() {
  const { profile, loading, refetch } = useProfile()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({})
  const [exportingCSV, setExportingCSV] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [clearTxModal, setClearTxModal] = useState(false)
  const [clearingTx, setClearingTx] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Somente imagens são permitidas', 'error'); return }
    if (file.size > 2 * 1024 * 1024) { showToast('Imagem muito grande (máx 2MB)', 'error'); return }
    setUploadingAvatar(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) { showToast(uploadError.message, 'error'); return }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const result = await updateAvatar(`${publicUrl}?t=${Date.now()}`)
      if (result.error) showToast(result.error, 'error')
      else { showToast('Foto atualizada!'); refetch() }
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    const result = await updateProfile(name.trim())
    setSavingName(false)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Nome atualizado!'); setName(''); refetch() }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return
    setSavingEmail(true)
    const result = await updateEmail(newEmail.trim())
    setSavingEmail(false)
    if (result.error) showToast(result.error, 'error')
    else { setEmailSent(true); setNewEmail('') }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: typeof passwordErrors = {}
    if (!currentPassword) errors.current = 'Informe a senha atual'
    if (newPassword.length < 8) errors.new = 'Mínimo 8 caracteres'
    if (newPassword !== confirmPassword) errors.confirm = 'Senhas não coincidem'
    if (Object.keys(errors).length) { setPasswordErrors(errors); return }
    setPasswordErrors({})
    setSavingPassword(true)
    const result = await updatePassword(currentPassword, newPassword)
    setSavingPassword(false)
    if (result.error) {
      if (result.error === 'Senha atual incorreta') setPasswordErrors({ current: result.error })
      else showToast(result.error, 'error')
    } else {
      showToast('Senha atualizada!')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    }
  }

  const handleExportCSV = async () => {
    setExportingCSV(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
      if (!data || data.length === 0) { showToast('Nenhuma transação para exportar', 'error'); return }
      exportToCSV(data as Transaction[], `financetrack-${new Date().toISOString().split('T')[0]}`)
      showToast(`${data.length} transações exportadas!`)
    } finally {
      setExportingCSV(false)
    }
  }

  const handleClearTransactions = async () => {
    setClearingTx(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { showToast('Não autenticado', 'error'); return }
      const { error } = await supabase.from('transactions').delete().eq('user_id', user.id)
      if (error) showToast(error.message, 'error')
      else {
        showToast('Todas as transações foram removidas')
        window.dispatchEvent(new Event('fintrack:transactions-updated'))
        setClearTxModal(false)
      }
    } finally {
      setClearingTx(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETAR') return
    setDeleting(true)
    const result = await deleteAccount()
    if (result.error) { showToast(result.error, 'error'); setDeleting(false) }
    else window.location.href = '/login'
  }

  const passedRules = strengthRules.filter(r => r.test(newPassword)).length

  if (loading) return (
    <main className="p-8 min-h-screen">
      <div className="max-w-2xl space-y-4">
        {Array(4).fill(0).map((_, i) => <div key={i} className="h-32 rounded-xl bg-border animate-pulse" />)}
      </div>
    </main>
  )

  return (
    <main className="p-6 lg:p-8 min-h-screen">
      <div className="max-w-2xl">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Configurações</h1>
          <p className="text-sm text-text-secondary mt-1">Gerencie sua conta e preferências</p>
        </div>

        <div className="flex flex-col gap-4">

          {/* ── Perfil ──────────────────────────────────────────────── */}
          <SectionCard title="Perfil" description="Foto e nome de exibição">
            <div className="flex items-center gap-5 mb-5 pb-5 border-b border-border">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="group relative flex-shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
              >
                <Avatar name={profile?.full_name || '?'} imageUrl={profile?.avatar_url} size="lg" />
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  {uploadingAvatar
                    ? <Loader2 size={16} className="text-white animate-spin" />
                    : <><Camera size={14} className="text-white" /><span className="text-[9px] text-white font-medium">Alterar</span></>
                  }
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
              <div>
                <p className="text-sm font-semibold text-text-primary">{profile?.full_name}</p>
                <p className="text-xs text-text-tertiary mt-0.5 mb-3">{profile?.email}</p>
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
                  <Camera size={12} />
                  {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                </Button>
              </div>
            </div>
            <form onSubmit={handleUpdateName} className="flex gap-3">
              <div className="flex-1">
                <Input placeholder={profile?.full_name || 'Novo nome'} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <Button type="submit" loading={savingName} loadingText="Salvando..." disabled={!name.trim()} size="sm">
                Salvar nome
              </Button>
            </form>
          </SectionCard>

          {/* ── E-mail ──────────────────────────────────────────────── */}
          <SectionCard title="Endereço de e-mail" description="Um link de confirmação será enviado para o novo endereço">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-page rounded-lg border border-border mb-4">
              <Mail size={13} className="text-text-tertiary flex-shrink-0" />
              <span className="text-sm text-text-secondary flex-1 truncate">{profile?.email}</span>
              <span className="text-[10px] bg-positive-light text-positive font-medium px-2 py-0.5 rounded-full">Atual</span>
            </div>
            {emailSent ? (
              <div className="flex items-start gap-3 px-4 py-3 bg-positive-light border border-positive/20 rounded-lg">
                <CheckCircle2 size={16} className="text-positive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Verifique sua caixa de entrada</p>
                  <p className="text-xs text-text-secondary mt-0.5">Clique no link enviado para confirmar a troca.</p>
                  <button onClick={() => setEmailSent(false)} className="text-xs text-accent hover:underline mt-1.5">
                    Usar outro e-mail
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateEmail} className="flex gap-3">
                <div className="flex-1">
                  <Input type="email" placeholder="novo@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <Button type="submit" loading={savingEmail} loadingText="Enviando..." disabled={!newEmail.trim()} size="sm">
                  Alterar
                </Button>
              </form>
            )}
          </SectionCard>

          {/* ── Senha ───────────────────────────────────────────────── */}
          <SectionCard title="Segurança" description="Informe a senha atual antes de criar uma nova">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <PasswordInput label="Senha atual" value={currentPassword} onChange={setCurrentPassword} placeholder="Sua senha atual" error={passwordErrors.current} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <PasswordInput label="Nova senha" value={newPassword} onChange={setNewPassword} placeholder="Mínimo 8 caracteres" error={passwordErrors.new} />
                <PasswordInput label="Confirmar nova senha" value={confirmPassword} onChange={setConfirmPassword} placeholder="Repita a senha" error={passwordErrors.confirm} />
              </div>
              {newPassword.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-1 h-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-colors ${i < passedRules ? passedRules <= 1 ? 'bg-negative' : passedRules <= 2 ? 'bg-warning' : passedRules <= 3 ? 'bg-accent' : 'bg-positive' : 'bg-border'}`} />
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {strengthRules.map(({ test, label }) => (
                      <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${test(newPassword) ? 'bg-positive-light text-positive' : 'bg-bg-page text-text-tertiary'}`}>
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" loading={savingPassword} loadingText="Alterando..." size="sm">
                Alterar senha
              </Button>
            </form>
          </SectionCard>

          {/* ── Aparência ───────────────────────────────────────────── */}
          <SectionCard title="Aparência" description="Escolha o tema de exibição">
            <div className="flex gap-3">
              {([
                { value: 'light', label: 'Claro',   icon: Sun },
                { value: 'system', label: 'Sistema', icon: Monitor },
                { value: 'dark',  label: 'Escuro',  icon: Moon },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border transition-all ${theme === value ? 'border-accent bg-accent-light' : 'border-border bg-bg-page hover:border-accent/40'}`}
                >
                  <Icon size={18} className={theme === value ? 'text-accent' : 'text-text-tertiary'} />
                  <span className={`text-xs font-medium ${theme === value ? 'text-accent-text' : 'text-text-secondary'}`}>{label}</span>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* ── Exportar ────────────────────────────────────────────── */}
          <SectionCard title="Exportar dados" description="Baixe suas transações em CSV — compatível com Excel e Google Sheets">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-page border border-border flex items-center justify-center">
                  <FileText size={16} className="text-text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">Todas as transações</p>
                  <p className="text-xs text-text-tertiary">Arquivo .csv</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" loading={exportingCSV} loadingText="Exportando..." onClick={handleExportCSV}>
                <Download size={13} /> Baixar
              </Button>
            </div>
          </SectionCard>

          {/* ── Zona de perigo ──────────────────────────────────────── */}
          <SectionCard title="Zona de perigo" danger>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-negative/10 flex items-center justify-center flex-shrink-0">
                    <Trash2 size={16} className="text-negative" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-negative">Limpar todas as transações</p>
                    <p className="text-xs text-negative/70 mt-0.5">Remove todas as transações de todos os meses.</p>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => setClearTxModal(true)}>
                  <Trash2 size={13} /> Limpar
                </Button>
              </div>
              <div className="border-t border-negative/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-negative/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-negative" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-negative">Deletar minha conta</p>
                    <p className="text-xs text-negative/70 mt-0.5">Remove permanentemente todos os seus dados.</p>
                  </div>
                </div>
                <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
                  <Trash2 size={13} /> Deletar
                </Button>
              </div>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* Modal limpar transações */}
      <Modal isOpen={clearTxModal} onClose={() => setClearTxModal(false)} title="Limpar todas as transações">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-negative-light rounded-lg border border-negative/20">
            <AlertTriangle size={16} className="text-negative flex-shrink-0 mt-0.5" />
            <p className="text-xs text-negative leading-relaxed">
              Esta ação remove <strong>todas as transações de todos os meses</strong>. Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setClearTxModal(false)} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={handleClearTransactions} loading={clearingTx} loadingText="Removendo..." className="flex-1">
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteConfirm('') }} title="Deletar conta">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-negative-light rounded-lg border border-negative/20">
            <AlertTriangle size={16} className="text-negative flex-shrink-0 mt-0.5" />
            <p className="text-xs text-negative leading-relaxed">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos permanentemente.
            </p>
          </div>
          <p className="text-sm text-text-secondary">
            Para confirmar, digite <strong className="text-text-primary font-mono">DELETAR</strong> abaixo:
          </p>
          <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETAR" />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setDeleteModal(false); setDeleteConfirm('') }} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} loadingText="Deletando..."
              disabled={deleteConfirm !== 'DELETAR'} className="flex-1">
              Confirmar exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
