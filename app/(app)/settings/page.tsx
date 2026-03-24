'use client'
import { useState, useRef } from 'react'
import { Camera, Lock, Download, Trash2, User, Mail, Shield, FileText, Loader2 } from 'lucide-react'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { updateProfile, updateAvatar, updatePassword, deleteAccount } from '@/app/actions/profile'
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

export default function SettingsPage() {
  const { profile, loading, refetch } = useProfile()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  const [exportingCSV, setExportingCSV] = useState(false)

  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSavingName(true)
    const result = await updateProfile(name.trim())
    setSavingName(false)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Nome atualizado!'); setName(''); refetch() }
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showToast('Somente imagens são permitidas', 'error'); return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Imagem muito grande (máx 2MB)', 'error'); return
    }

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
      const urlWithBust = `${publicUrl}?t=${Date.now()}`

      const result = await updateAvatar(urlWithBust)
      if (result.error) showToast(result.error, 'error')
      else { showToast('Foto atualizada!'); refetch() }
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (newPassword.length < 8) { setPasswordError('Mínimo 8 caracteres'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Senhas não coincidem'); return }
    setSavingPassword(true)
    const result = await updatePassword(newPassword)
    setSavingPassword(false)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Senha atualizada!'); setNewPassword(''); setConfirmPassword('') }
  }

  const handleExportCSV = async () => {
    setExportingCSV(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
      if (!data || data.length === 0) { showToast('Nenhuma transação para exportar', 'error'); return }
      const filename = `financetrack-transacoes-${new Date().toISOString().split('T')[0]}`
      exportToCSV(data as Transaction[], filename)
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

  if (loading) return (
    <main className="p-8">
      <div className="text-sm text-text-tertiary">Carregando...</div>
    </main>
  )

  return (
    <main className="p-8 min-h-screen max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Configurações</h1>
        <p className="text-sm text-text-secondary mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── Perfil ─────────────────────────────────────────────── */}
        <SectionCard icon={User} title="Perfil" description="Sua foto e informações pessoais">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative">
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="group relative w-16 h-16 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                title="Alterar foto"
              >
                <Avatar name={profile?.full_name || '?'} imageUrl={profile?.avatar_url} size="lg" />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingAvatar
                    ? <Loader2 size={16} className="text-white animate-spin" />
                    : <Camera size={16} className="text-white" />
                  }
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{profile?.full_name}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{profile?.email}</p>
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="text-xs text-accent hover:underline mt-1 disabled:opacity-40"
              >
                {uploadingAvatar ? 'Enviando...' : 'Alterar foto'}
              </button>
            </div>
          </div>

          {/* Nome */}
          <form onSubmit={handleUpdateName} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
                  <User size={11} /> Nome
                </label>
                <Input
                  placeholder={profile?.full_name || 'Seu nome'}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-secondary flex items-center gap-1">
                  <Mail size={11} /> E-mail
                </label>
                <Input value={profile?.email || ''} disabled />
              </div>
            </div>
            <Button type="submit" loading={savingName} loadingText="Salvando..." disabled={!name.trim()} size="sm">
              Salvar nome
            </Button>
          </form>
        </SectionCard>

        {/* ── Segurança ───────────────────────────────────────────── */}
        <SectionCard icon={Lock} title="Segurança" description="Altere sua senha de acesso">
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nova senha"
                showPasswordToggle
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Confirmar nova senha"
                showPasswordToggle
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                error={passwordError}
                required
              />
            </div>
            <Button type="submit" loading={savingPassword} loadingText="Salvando..." size="sm">
              Alterar senha
            </Button>
          </form>
        </SectionCard>

        {/* ── Exportar dados ──────────────────────────────────────── */}
        <SectionCard icon={FileText} title="Exportar dados" description="Baixe suas transações em formato CSV">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Todas as suas transações</p>
              <p className="text-xs text-text-tertiary mt-0.5">Formato CSV — compatível com Excel e Google Sheets</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={exportingCSV}
              loadingText="Exportando..."
              onClick={handleExportCSV}
            >
              <Download size={14} /> Baixar CSV
            </Button>
          </div>
        </SectionCard>

        {/* ── Zona de perigo ──────────────────────────────────────── */}
        <SectionCard icon={Shield} title="Zona de perigo">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="text-sm font-medium text-red-700">Deletar minha conta</p>
              <p className="text-xs text-red-500 mt-0.5">Todos os seus dados serão removidos permanentemente.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>
              <Trash2 size={14} /> Deletar
            </Button>
          </div>
        </SectionCard>

      </div>

      {/* Modal confirmação de exclusão */}
      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteConfirm('') }} title="Deletar conta">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Para confirmar, digite <strong className="text-text-primary">DELETAR</strong> abaixo:
          </p>
          <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETAR" />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setDeleteModal(false); setDeleteConfirm('') }} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
              loadingText="Deletando..."
              disabled={deleteConfirm !== 'DELETAR'}
              className="flex-1"
            >
              Confirmar exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
