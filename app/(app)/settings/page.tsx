'use client'
import { useState, useRef } from 'react'
import { Camera, Lock, Download, Trash2, User, Mail, Shield, FileText, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { updateProfile, updateAvatar, updateEmail, updatePassword, deleteAccount } from '@/app/actions/profile'
import { createClient } from '@/lib/supabase/client'
import { exportToCSV } from '@/lib/utils/export'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

function SectionCard({ icon: Icon, title, description, children }: {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon size={15} className="text-accent" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {description && <p className="text-xs text-text-tertiary mt-0.5">{description}</p>}
        </div>
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
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-9 px-3 pr-9 border rounded-lg text-sm text-text-primary bg-white outline-none focus:border-accent transition-all ${error ? 'border-red-400' : 'border-border'}`}
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const { profile, loading, refetch } = useProfile()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Foto ──────────────────────────────────────────────────────
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // ── Nome ──────────────────────────────────────────────────────
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  // ── E-mail ────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // ── Senha ─────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{ current?: string; new?: string; confirm?: string }>({})

  // ── Exportar ──────────────────────────────────────────────────
  const [exportingCSV, setExportingCSV] = useState(false)

  // ── Deletar ───────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  // ─────────────────────────────────────────────────────────────

  const handleAvatarClick = () => fileInputRef.current?.click()

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETAR') return
    setDeleting(true)
    const result = await deleteAccount()
    if (result.error) { showToast(result.error, 'error'); setDeleting(false) }
    else window.location.href = '/login'
  }

  if (loading) return <main className="p-8"><div className="text-sm text-text-tertiary">Carregando...</div></main>

  return (
    <main className="p-8 min-h-screen max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Configurações</h1>
        <p className="text-sm text-text-secondary mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Foto de perfil ───────────────────────────────────────── */}
        <SectionCard icon={Camera} title="Foto de perfil" description="Clique na foto para alterar · JPG, PNG ou WebP · máx 2MB">
          <div className="flex items-center gap-5">
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="group relative w-20 h-20 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 flex-shrink-0"
            >
              <Avatar name={profile?.full_name || '?'} imageUrl={profile?.avatar_url} size="lg" />
              <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {uploadingAvatar
                  ? <Loader2 size={18} className="text-white animate-spin" />
                  : <>
                      <Camera size={16} className="text-white" />
                      <span className="text-[10px] text-white font-medium">Alterar</span>
                    </>
                }
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-text-primary">{profile?.full_name}</p>
              <p className="text-xs text-text-tertiary mt-0.5 mb-2">{profile?.email}</p>
              <Button size="sm" variant="secondary" onClick={handleAvatarClick} disabled={uploadingAvatar}>
                <Camera size={13} />
                {uploadingAvatar ? 'Enviando...' : 'Escolher foto'}
              </Button>
            </div>
          </div>
        </SectionCard>

        {/* ── Informações pessoais ─────────────────────────────────── */}
        <SectionCard icon={User} title="Informações pessoais" description="Atualize seu nome de exibição">
          <form onSubmit={handleUpdateName} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder={profile?.full_name || 'Novo nome'}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
            <Button type="submit" loading={savingName} loadingText="Salvando..." disabled={!name.trim()} size="sm">
              Salvar
            </Button>
          </form>
        </SectionCard>

        {/* ── E-mail ───────────────────────────────────────────────── */}
        <SectionCard icon={Mail} title="Endereço de e-mail" description="Um link de confirmação será enviado para o novo endereço">
          <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-bg-page rounded-lg border border-border">
            <Mail size={13} className="text-text-tertiary flex-shrink-0" />
            <span className="text-sm text-text-secondary">{profile?.email}</span>
            <span className="ml-auto text-[10px] bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Atual</span>
          </div>

          {emailSent ? (
            <div className="flex items-start gap-2.5 px-3 py-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Verifique sua caixa de entrada</p>
                <p className="text-xs text-green-700 mt-0.5">Enviamos um link de confirmação para o novo e-mail. Clique no link para concluir a troca.</p>
                <button onClick={() => setEmailSent(false)} className="text-xs text-green-600 hover:underline mt-1">
                  Usar outro e-mail
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdateEmail} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                />
              </div>
              <Button type="submit" loading={savingEmail} loadingText="Enviando..." disabled={!newEmail.trim()} size="sm">
                Alterar
              </Button>
            </form>
          )}
        </SectionCard>

        {/* ── Segurança / Senha ────────────────────────────────────── */}
        <SectionCard icon={Lock} title="Segurança" description="Informe a senha atual antes de criar uma nova">
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <PasswordInput
              label="Senha atual"
              value={currentPassword}
              onChange={setCurrentPassword}
              placeholder="Sua senha atual"
              error={passwordErrors.current}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PasswordInput
                label="Nova senha"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Mínimo 8 caracteres"
                error={passwordErrors.new}
              />
              <PasswordInput
                label="Confirmar nova senha"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repita a nova senha"
                error={passwordErrors.confirm}
              />
            </div>
            {/* Força da senha */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2">
                {[
                  { ok: newPassword.length >= 8, label: '8+ caracteres' },
                  { ok: /[A-Z]/.test(newPassword), label: 'Maiúscula' },
                  { ok: /[0-9]/.test(newPassword), label: 'Número' },
                  { ok: /[^A-Za-z0-9]/.test(newPassword), label: 'Símbolo' },
                ].map(({ ok, label }) => (
                  <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-text-tertiary'}`}>
                    {label}
                  </span>
                ))}
              </div>
            )}
            <Button type="submit" loading={savingPassword} loadingText="Alterando..." size="sm">
              Alterar senha
            </Button>
          </form>
        </SectionCard>

        {/* ── Exportar dados ───────────────────────────────────────── */}
        <SectionCard icon={FileText} title="Exportar dados" description="Baixe suas transações em formato CSV">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Todas as suas transações</p>
              <p className="text-xs text-text-tertiary mt-0.5">Compatível com Excel e Google Sheets</p>
            </div>
            <Button variant="secondary" size="sm" loading={exportingCSV} loadingText="Exportando..." onClick={handleExportCSV}>
              <Download size={14} /> Baixar CSV
            </Button>
          </div>
        </SectionCard>

        {/* ── Zona de perigo ───────────────────────────────────────── */}
        <SectionCard icon={Shield} title="Zona de perigo">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="text-sm font-medium text-red-700">Deletar minha conta</p>
              <p className="text-xs text-red-500 mt-0.5">Remove permanentemente todos os seus dados.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
              <Trash2 size={14} /> Deletar
            </Button>
          </div>
        </SectionCard>

      </div>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteConfirm('') }} title="Deletar conta">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Para confirmar, digite <strong className="text-text-primary">DELETAR</strong> abaixo:
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
