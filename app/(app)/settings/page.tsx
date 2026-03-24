'use client'
import { useState } from 'react'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { updateProfile, updatePassword, deleteAccount } from '@/app/actions/profile'
import { Modal } from '@/components/ui/Modal'

export default function SettingsPage() {
  const { profile, loading } = useProfile()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

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
    else { showToast('Nome atualizado!'); window.location.reload() }
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
        <p className="text-sm text-text-secondary mt-0.5">Gerencie sua conta</p>
      </div>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Perfil</h2>
        <div className="flex items-center gap-4 mb-5">
          {profile && <Avatar name={profile.full_name} size="lg" />}
          <div>
            <p className="text-sm font-medium text-text-primary">{profile?.full_name}</p>
            <p className="text-xs text-text-tertiary">{profile?.email}</p>
          </div>
        </div>
        <form onSubmit={handleUpdateName} className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder={profile?.full_name || 'Novo nome'}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <Button type="submit" loading={savingName} loadingText="Salvando..." disabled={!name.trim()}>
            Atualizar nome
          </Button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] mb-4">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Alterar senha</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-3">
          <Input label="Nova senha" showPasswordToggle placeholder="Mínimo 8 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Input label="Confirmar nova senha" showPasswordToggle placeholder="Repita a senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={passwordError} required />
          <Button type="submit" loading={savingPassword} loadingText="Salvando...">Alterar senha</Button>
        </form>
      </section>

      {/* Danger zone */}
      <section className="bg-white rounded-xl border border-negative/20 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <h2 className="text-sm font-semibold text-negative mb-1">Zona de perigo</h2>
        <p className="text-xs text-text-tertiary mb-4">Essa ação é irreversível. Todos os seus dados serão deletados permanentemente.</p>
        <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Deletar minha conta</Button>
      </section>

      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setDeleteConfirm('') }} title="Deletar conta">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">Para confirmar, digite <strong className="text-text-primary">DELETAR</strong> abaixo:</p>
          <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETAR" />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setDeleteModal(false); setDeleteConfirm('') }} className="flex-1">Cancelar</Button>
            <Button variant="danger" onClick={handleDeleteAccount} loading={deleting} loadingText="Deletando..." disabled={deleteConfirm !== 'DELETAR'} className="flex-1">
              Confirmar exclusão
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
