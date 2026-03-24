'use client'
import { useState } from 'react'
import { Plus, Target, Trash2, TrendingUp } from 'lucide-react'
import { useGoals } from '@/lib/hooks/useGoals'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { addGoal, updateGoalProgress, deleteGoal } from '@/app/actions/goals'
import { addTransaction } from '@/app/actions/transactions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency } from '@/lib/utils/formatters'

const GOAL_COLORS = ['#FF6B35', '#16A34A', '#2563EB', '#DB2777', '#D97706', '#7C3AED']

export default function GoalsPage() {
  const { goals, loading, refetch } = useGoals()
  const { accounts } = useAccounts()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [progressModal, setProgressModal] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [depositAccountId, setDepositAccountId] = useState('')
  const [form, setForm] = useState({ title: '', target_value: '', current_value: '', deadline: '', color: GOAL_COLORS[0] })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await addGoal({
      title: form.title,
      target_value: parseFloat(form.target_value),
      current_value: parseFloat(form.current_value || '0'),
      deadline: form.deadline || undefined,
      color: form.color,
    })
    setSaving(false)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Meta criada!'); setModalOpen(false); refetch(); setForm({ title: '', target_value: '', current_value: '', deadline: '', color: GOAL_COLORS[0] }) }
  }

  const handleUpdateProgress = async () => {
    if (!progressModal) return
    const delta = parseFloat(depositValue)
    if (isNaN(delta) || delta <= 0) return
    const goal = goals.find(g => g.id === progressModal)
    if (!goal) return

    // Atualiza progresso da meta
    const newValue = goal.current_value + delta
    const result = await updateGoalProgress(progressModal, newValue)
    if (result.error) { showToast(result.error, 'error'); return }

    // Registra transação de investimento vinculada
    await addTransaction({
      description: `Aporte: ${goal.title}`,
      value: delta,
      category: 'invest',
      date: new Date().toISOString().split('T')[0],
      account_id: depositAccountId || null,
    })

    showToast(`+${delta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} adicionado à meta!`)
    setProgressModal(null)
    setDepositValue('')
    setDepositAccountId('')
    refetch()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    const result = await deleteGoal(deletingId)
    setDeleting(false)
    setDeletingId(null)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Meta removida'); refetch() }
  }

  return (
    <main className="p-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Metas</h1>
          <p className="text-sm text-text-secondary mt-0.5">Acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova meta
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-text-tertiary">Carregando...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-xl border border-border py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <Target size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="text-sm font-medium text-text-secondary mb-1">Nenhuma meta criada</p>
          <p className="text-xs text-text-tertiary mb-4">Crie uma meta para acompanhar seus objetivos</p>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Criar meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const pct = Math.min((goal.current_value / goal.target_value) * 100, 100)
            const remaining = goal.target_value - goal.current_value
            return (
              <div key={goal.id} className="bg-white rounded-xl border border-border p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: goal.color + '20' }}>
                      <Target size={16} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{goal.title}</p>
                      {goal.deadline && (
                        <p className="text-xs text-text-tertiary">até {new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setDeletingId(goal.id)} className="text-text-tertiary hover:text-negative transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-text-tertiary">Progresso</span>
                    <span className="text-xs font-semibold" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-page rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                  </div>
                </div>

                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-0.5">Atual</p>
                    <p className="text-base font-bold text-text-primary">{formatCurrency(goal.current_value)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-text-tertiary uppercase tracking-wide mb-0.5">Meta</p>
                    <p className="text-base font-bold text-text-primary">{formatCurrency(goal.target_value)}</p>
                  </div>
                </div>

                {pct < 100 ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-text-tertiary">Faltam {formatCurrency(remaining)}</p>
                    <button
                      onClick={() => { setProgressModal(goal.id); setDepositValue('') }}
                      className="text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
                      style={{ color: goal.color }}
                    >
                      <TrendingUp size={12} /> Registrar aporte
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-positive text-xs font-medium">
                    <div className="w-4 h-4 rounded-full bg-positive-light flex items-center justify-center">
                      <span className="text-[10px]">✓</span>
                    </div>
                    Meta atingida!
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Meta">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Título" placeholder="Ex: Reserva de emergência" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Input label="Valor alvo (R$)" type="number" step="0.01" min="1" placeholder="10000,00" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} required />
          <Input label="Valor atual (R$)" type="number" step="0.01" min="0" placeholder="0,00" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />
          <Input label="Prazo (opcional)" type="month" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Cor</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0A0A0A' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} loadingText="Salvando..." className="flex-1">Criar meta</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Excluir meta"
        description="Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita."
        confirmLabel="Excluir meta"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleting}
      />

      {/* Deposit Modal */}
      <Modal isOpen={!!progressModal} onClose={() => { setProgressModal(null); setDepositValue('') }} title="Registrar aporte">
        <div className="space-y-4">
          {progressModal && (() => {
            const goal = goals.find(g => g.id === progressModal)
            if (!goal) return null
            const remaining = goal.target_value - goal.current_value
            return (
              <div className="bg-bg-page rounded-lg p-3 text-sm">
                <p className="font-medium text-text-primary">{goal.title}</p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Faltam <span className="font-semibold text-text-secondary">{remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> para atingir a meta
                </p>
              </div>
            )
          })()}
          <Input
            label="Valor do aporte (R$)"
            type="number" step="0.01" min="0.01"
            placeholder="0,00"
            value={depositValue}
            onChange={e => setDepositValue(e.target.value)}
            autoFocus
          />
          {accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Debitar de (opcional)</label>
              <select
                value={depositAccountId}
                onChange={e => setDepositAccountId(e.target.value)}
                className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-white outline-none focus:border-accent"
              >
                <option value="">Sem conta específica</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}
          <p className="text-xs text-text-tertiary">Uma transação de investimento será registrada automaticamente.</p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setProgressModal(null); setDepositValue(''); setDepositAccountId('') }} className="flex-1">Cancelar</Button>
            <Button onClick={handleUpdateProgress} className="flex-1">Adicionar</Button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
