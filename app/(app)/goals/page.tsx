'use client'
import { useState } from 'react'
import { Plus, Target, Trash2, TrendingUp, RefreshCw } from 'lucide-react'
import { useGoals } from '@/lib/hooks/useGoals'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useMarketRates, calcMonthlyYield, toAnnualPct } from '@/lib/hooks/useMarketRates'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { addGoal, updateGoalProgress, deleteGoal } from '@/app/actions/goals'
import { addTransaction } from '@/app/actions/transactions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { GoalCardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/lib/utils/formatters'

const GOAL_COLORS = ['#FF6B35', '#16A34A', '#2563EB', '#DB2777', '#D97706', '#7C3AED']

const INVESTMENT_TYPES = [
  { value: 'none',     label: 'Sem rendimento',  desc: '' },
  { value: 'cdb_100',  label: '100% CDI',        desc: 'CDB comum' },
  { value: 'cdb_110',  label: '110% CDI',        desc: 'CDB premium' },
  { value: 'selic',    label: 'Tesouro SELIC',   desc: 'Tesouro Direto' },
  { value: 'poupanca', label: 'Poupança',         desc: '70% SELIC' },
] as const

type InvestmentType = typeof INVESTMENT_TYPES[number]['value']

export default function GoalsPage() {
  const { goals, loading, refetch } = useGoals()
  const { accounts } = useAccounts()
  const rates = useMarketRates()
  const { showToast } = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [progressModal, setProgressModal] = useState<string | null>(null)
  const [depositValue, setDepositValue] = useState('')
  const [depositAccountId, setDepositAccountId] = useState('')
  const [form, setForm] = useState({
    title: '', target_value: '', current_value: '',
    start_date: '', deadline: '',
    color: GOAL_COLORS[0], investment_type: 'none' as InvestmentType,
  })
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
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      color: form.color,
      investment_type: form.investment_type,
    })
    setSaving(false)
    if (result.error) showToast(result.error, 'error')
    else {
      showToast('Meta criada!')
      setModalOpen(false)
      refetch()
      setForm({ title: '', target_value: '', current_value: '', start_date: '', deadline: '', color: GOAL_COLORS[0], investment_type: 'none' })
    }
  }

  const handleUpdateProgress = async () => {
    if (!progressModal) return
    const delta = parseFloat(depositValue)
    if (isNaN(delta) || delta <= 0) return
    const goal = goals.find(g => g.id === progressModal)
    if (!goal) return

    const newValue = goal.current_value + delta
    const result = await updateGoalProgress(progressModal, newValue)
    if (result.error) { showToast(result.error, 'error'); return }

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

  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshRates = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/refresh-rates', { method: 'POST' })
      const json = await res.json()
      if (json.error) showToast(json.error, 'error')
      else showToast('Taxas atualizadas!')
      // recarrega rates relendo o hook — força re-mount via key trick não necessário,
      // basta um pequeno reload do hook
      window.location.reload()
    } catch {
      showToast('Erro ao conectar com o Banco Central', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  const cdiAnnual = toAnnualPct(rates.cdi)
  const selicAnnual = toAnnualPct(rates.selic)
  const hasRates = rates.cdi > 0

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Metas</h1>
          <p className="text-sm text-text-secondary mt-0.5">Acompanhe seus objetivos financeiros</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova meta
        </Button>
      </div>

      {/* Painel de taxas de mercado */}
      <div className="bg-bg-surface rounded-xl border border-accent/30 p-4 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">
            Taxas de mercado
          </p>
          <div className="flex items-center gap-3">
            {rates.date && (
              <p className="text-[11px] text-text-tertiary flex items-center gap-1">
                <RefreshCw size={10} />
                Ref. {new Date(rates.date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
            <button
              onClick={handleRefreshRates}
              disabled={refreshing}
              className="flex items-center gap-1 text-[11px] font-medium text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
        {rates.loading ? (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <RefreshCw size={11} className="animate-spin" /> Buscando taxas do Banco Central...
          </div>
        ) : rates.error ? (
          <p className="text-xs text-negative">
            Não foi possível obter as taxas. Verifique sua conexão e tente novamente.
          </p>
        ) : (
          <div className="flex gap-8 flex-wrap">
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">CDI</p>
              <p className="text-xl font-bold text-text-primary">{cdiAnnual.toFixed(2)}%<span className="text-xs font-normal text-text-tertiary ml-1">a.a.</span></p>
              <p className="text-[11px] text-text-tertiary">{(rates.cdi * 100).toFixed(5)}% a.d.</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">SELIC</p>
              <p className="text-xl font-bold text-text-primary">{selicAnnual.toFixed(2)}%<span className="text-xs font-normal text-text-tertiary ml-1">a.a.</span></p>
              <p className="text-[11px] text-text-tertiary">{(rates.selic * 100).toFixed(5)}% a.d.</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">110% CDI</p>
              <p className="text-xl font-bold text-text-primary">{(cdiAnnual * 1.1).toFixed(2)}%<span className="text-xs font-normal text-text-tertiary ml-1">a.a.</span></p>
              <p className="text-[11px] text-text-tertiary">CDB premium</p>
            </div>
            <div>
              <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Poupança</p>
              <p className="text-xl font-bold text-text-primary">{(selicAnnual * 0.7).toFixed(2)}%<span className="text-xs font-normal text-text-tertiary ml-1">a.a.</span></p>
              <p className="text-[11px] text-text-tertiary">70% SELIC</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => <GoalCardSkeleton key={i} />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-bg-surface rounded-xl border border-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <EmptyState
            icon={Target}
            title="Nenhuma meta criada"
            description="Defina objetivos financeiros e acompanhe seu progresso mês a mês."
            action={{ label: '+ Nova meta', onClick: () => setModalOpen(true) }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(goal => {
            const pct = Math.min((goal.current_value / goal.target_value) * 100, 100)
            const remaining = goal.target_value - goal.current_value
            const invType = goal.investment_type ?? 'none'
            const monthlyYield = calcMonthlyYield(goal.current_value, invType, rates.cdi, rates.selic)
            const annualYield  = calcMonthlyYield(goal.current_value, invType, rates.cdi, rates.selic) * 12
            const invLabel = INVESTMENT_TYPES.find(t => t.value === invType)?.label

            return (
              <div key={goal.id} className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: goal.color + '20' }}>
                      <Target size={16} style={{ color: goal.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{goal.title}</p>
                      {(goal.start_date || goal.deadline) && (
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {goal.start_date
                            ? new Date(goal.start_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'
                          }
                          {' → '}
                          {goal.deadline
                            ? new Date(goal.deadline + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'sem prazo'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setDeletingId(goal.id)} className="text-text-tertiary hover:text-negative transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Barra de progresso */}
                <div className="mb-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs text-text-tertiary">Progresso</span>
                    <span className="text-xs font-semibold" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-page rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                  </div>
                </div>

                {/* Valores atual / meta */}
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

                {/* Rendimento estimado */}
                {invType !== 'none' && hasRates && goal.current_value > 0 && (
                  <div className="bg-green-50 rounded-lg px-3 py-2.5 mb-3 border border-green-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp size={11} className="text-green-600" />
                      <span className="text-[10px] font-medium uppercase tracking-wide text-green-700">{invLabel}</span>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-[10px] text-green-600 mb-0.5">Est. mensal</p>
                        <p className="text-sm font-bold text-green-700">+{formatCurrency(monthlyYield)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-green-600 mb-0.5">Est. anual</p>
                        <p className="text-sm font-bold text-green-700">+{formatCurrency(annualYield)}</p>
                      </div>
                    </div>
                  </div>
                )}

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

      {/* Modal Nova Meta */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Meta">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Título" placeholder="Ex: Reserva de emergência" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <Input label="Valor alvo (R$)" type="number" step="0.01" min="1" placeholder="10000,00"
            value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} required />
          <Input label="Valor atual (R$)" type="number" step="0.01" min="0" placeholder="0,00"
            value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} />

          {/* Período — ambos opcionais */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Período</label>
              <span className="text-xs text-text-tertiary">Ambos opcionais</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-tertiary">Data de início</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="h-9 px-3 border border-accent/30 rounded-lg text-sm text-text-primary bg-bg-surface outline-none focus:border-accent transition-all"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-tertiary">Prazo final</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="h-9 px-3 border border-accent/30 rounded-lg text-sm text-text-primary bg-bg-surface outline-none focus:border-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tipo de investimento */}
          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">
              Tipo de investimento
              {hasRates && <span className="text-xs font-normal text-text-tertiary ml-1">(CDI: {cdiAnnual.toFixed(1)}% a.a.)</span>}
            </label>
            <div className="flex flex-col gap-1.5">
              {INVESTMENT_TYPES.map(({ value, label, desc }) => {
                const selected = form.investment_type === value
                let yieldPreview = ''
                const previewValue = parseFloat(form.current_value || '0')
                if (value !== 'none' && hasRates && previewValue > 0) {
                  const m = calcMonthlyYield(previewValue, value, rates.cdi, rates.selic)
                  yieldPreview = `+${m.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês`
                }
                return (
                  <button key={value} type="button"
                    onClick={() => setForm(f => ({ ...f, investment_type: value }))}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors text-left ${selected ? 'border-positive bg-positive-light text-positive' : 'border-border bg-bg-surface text-text-secondary'}`}>
                    <div>
                      <span className="font-medium">{label}</span>
                      {desc && <span className="text-xs ml-1.5 opacity-60">{desc}</span>}
                    </div>
                    {yieldPreview && (
                      <span className="text-xs font-semibold text-positive">{yieldPreview}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text-primary block mb-1.5">Cor</label>
            <div className="flex gap-2">
              {GOAL_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0A0A0A' : 'transparent' }} />
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

      {/* Modal Registrar Aporte */}
      <Modal isOpen={!!progressModal} onClose={() => { setProgressModal(null); setDepositValue('') }} title="Registrar aporte">
        <div className="space-y-4">
          {progressModal && (() => {
            const goal = goals.find(g => g.id === progressModal)
            if (!goal) return null
            const remaining = goal.target_value - goal.current_value
            const invType = goal.investment_type ?? 'none'
            const depositNum = parseFloat(depositValue || '0')
            const newTotal = goal.current_value + depositNum
            const newMonthly = calcMonthlyYield(newTotal, invType, rates.cdi, rates.selic)

            return (
              <>
                <div className="bg-bg-page rounded-lg p-3 text-sm">
                  <p className="font-medium text-text-primary">{goal.title}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    Faltam <span className="font-semibold text-text-secondary">
                      {remaining.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span> para atingir a meta
                  </p>
                </div>
                {invType !== 'none' && hasRates && newMonthly > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-700">
                    <TrendingUp size={11} className="inline mr-1" />
                    Após aporte: rendimento estimado de <strong>{formatCurrency(newMonthly)}/mês</strong>
                  </div>
                )}
              </>
            )
          })()}

          <Input label="Valor do aporte (R$)" type="number" step="0.01" min="0.01"
            placeholder="0,00" value={depositValue}
            onChange={e => setDepositValue(e.target.value)} autoFocus />

          {accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Debitar de (opcional)</label>
              <select value={depositAccountId} onChange={e => setDepositAccountId(e.target.value)}
                className="w-full h-9 px-3 border border-accent/30 rounded-lg text-sm bg-bg-surface outline-none focus:border-accent">
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
