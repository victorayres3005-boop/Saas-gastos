'use client'
import { useState } from 'react'
import { Plus, RefreshCw, Trash2, Pause, Play } from 'lucide-react'
import { useRecurring, setRecurringAccountStorage } from '@/lib/hooks/useRecurring'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { AccountBadge } from '@/components/ui/AccountBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { addRecurring, deleteRecurring, toggleRecurring } from '@/app/actions/recurring'
import { runRecurringProcessor } from '@/components/RecurringProcessor'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

const FREQ_LABELS = { monthly: 'Mensal', weekly: 'Semanal', yearly: 'Anual' }
const FREQ_OPTIONS = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly',  label: 'Semanal' },
  { value: 'yearly',  label: 'Anual' },
] as const

type FormState = {
  description: string
  value: string
  category: CategoryKey
  frequency: 'monthly' | 'weekly' | 'yearly'
  next_date: string
  account_id: string
  isIncome: boolean
}

const EMPTY_FORM: FormState = {
  description: '', value: '', category: 'food',
  frequency: 'monthly', next_date: new Date().toISOString().split('T')[0],
  account_id: '', isIncome: false,
}

export default function RecurringPage() {
  const { items, loading, refetch } = useRecurring()
  const { accounts } = useAccounts()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const value = form.isIncome ? -Math.abs(parseFloat(form.value)) : Math.abs(parseFloat(form.value))
    const description = form.description.trim() || CATEGORIES[form.category].label
    const result = await addRecurring({
      description,
      value,
      category: form.category,
      frequency: form.frequency,
      next_date: form.next_date,
      account_id: form.account_id || null,
    })
    setSaving(false)
    if (result.error) { showToast(result.error, 'error'); return }
    // Also persist to localStorage as fallback for legacy compatibility
    if (result.id) setRecurringAccountStorage(result.id, form.account_id || null)
    // Processa imediatamente — se next_date <= hoje, já cria a transação agora
    const proc = await runRecurringProcessor()
    if (proc.errors.length > 0) {
      showToast(`Recorrente criada, mas erro ao processar: ${proc.errors[0]}`, 'error')
    } else {
      showToast('Transação recorrente criada!')
    }
    setModalOpen(false)
    setForm(EMPTY_FORM)
    refetch()
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    const result = await deleteRecurring(deletingId)
    setDeleting(false); setDeletingId(null)
    if (result.error) showToast(result.error, 'error')
    else { showToast('Removido'); refetch() }
  }

  const handleToggle = async (id: string, active: boolean) => {
    await toggleRecurring(id, !active)
    refetch()
  }

  const active = items.filter(i => i.active)
  const totalMonthly = active.reduce((sum, i) => {
    const v = Math.abs(i.value)
    if (i.frequency === 'monthly') return sum + (i.value > 0 ? -v : v)
    if (i.frequency === 'weekly')  return sum + (i.value > 0 ? -v : v) * 4.33
    if (i.frequency === 'yearly')  return sum + (i.value > 0 ? -v : v) / 12
    return sum
  }, 0)

  const totalExpense = active.filter(i => i.value > 0).reduce((s, i) => {
    if (i.frequency === 'monthly') return s + i.value
    if (i.frequency === 'weekly')  return s + i.value * 4.33
    if (i.frequency === 'yearly')  return s + i.value / 12
    return s
  }, 0)

  const totalIncome = active.filter(i => i.value < 0).reduce((s, i) => {
    const v = Math.abs(i.value)
    if (i.frequency === 'monthly') return s + v
    if (i.frequency === 'weekly')  return s + v * 4.33
    if (i.frequency === 'yearly')  return s + v / 12
    return s
  }, 0)

  return (
    <main className="p-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Recorrentes</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gastos fixos e assinaturas</p>
        </div>
        <Button onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }}>
          <Plus size={16} /> Nova recorrente
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-xs text-text-tertiary mb-1">Despesas/mês</p>
          <p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <p className="text-xs text-text-tertiary mb-1">Receitas/mês</p>
          <p className="text-lg font-bold text-green-600 tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="rounded-xl border border-border p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          style={{ backgroundColor: totalMonthly >= 0 ? '#F0FDF4' : '#FEF2F2' }}>
          <p className="text-xs text-text-tertiary mb-1">Saldo mensal</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: totalMonthly >= 0 ? '#16A34A' : '#DC2626' }}>
            {formatCurrency(Math.abs(totalMonthly))}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm text-text-tertiary">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-border py-16 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <RefreshCw size={32} className="mx-auto mb-3 text-text-tertiary" />
          <p className="text-sm font-medium text-text-secondary mb-1">Nenhuma transação recorrente</p>
          <p className="text-xs text-text-tertiary mb-4">Adicione assinaturas, salário, aluguel e outros fixos</p>
          <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setModalOpen(true) }}>
            <Plus size={14} /> Adicionar
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Descrição</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Categoria</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Conta</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Frequência</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Próxima</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-text-secondary">Valor</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const account = item.account_id ? accounts.find(a => a.id === item.account_id) : undefined
                return (
                  <tr key={item.id} className={`border-b border-border-light last:border-0 transition-colors hover:bg-[#FAFAFA] ${!item.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-text-primary">{item.description}</div>
                      <div className={`text-xs mt-0.5 font-medium ${item.active ? 'text-green-600' : 'text-text-tertiary'}`}>
                        {item.active ? 'Ativa' : 'Pausada'}
                      </div>
                    </td>
                    <td className="px-4 py-3"><CategoryBadge category={item.category as CategoryKey} /></td>
                    <td className="px-4 py-3">
                      {account
                        ? <AccountBadge account={account} size="sm" />
                        : <span className="text-xs text-text-tertiary">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{FREQ_LABELS[item.frequency]}</td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{formatDate(item.next_date)}</td>
                    <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: item.value < 0 ? '#16A34A' : '#DC2626' }}>
                      {item.value < 0 ? '+' : '-'}{formatCurrency(Math.abs(item.value))}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => handleToggle(item.id, item.active)}
                          className="text-text-tertiary hover:text-text-primary transition-colors p-1"
                          title={item.active ? 'Pausar' : 'Ativar'}>
                          {item.active ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button onClick={() => setDeletingId(item.id)}
                          className="text-text-tertiary hover:text-negative transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nova Recorrente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Transação Recorrente">
        <form onSubmit={handleAdd} className="space-y-4">

          {/* Toggle Despesa / Receita */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button type="button" onClick={() => setForm(f => ({ ...f, isIncome: false, category: EXPENSE_CATEGORIES[0] }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${!form.isIncome ? 'bg-red-50 text-red-600 border-r border-border' : 'text-text-tertiary hover:bg-gray-50 border-r border-border'}`}>
              Despesa
            </button>
            <button type="button" onClick={() => setForm(f => ({ ...f, isIncome: true, category: INCOME_CATEGORIES[0] }))}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${form.isIncome ? 'bg-green-50 text-green-600' : 'text-text-tertiary hover:bg-gray-50'}`}>
              Receita
            </button>
          </div>

          <Input label="Descrição (opcional)" placeholder="Ex: Netflix, Aluguel, Salário..." value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

          <Input label="Valor (R$)" type="number" step="0.01" min="0.01" placeholder="0,00"
            value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />

          {/* Categoria chips */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {(form.isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(key => {
                const cat = CATEGORIES[key]
                return (
                  <button key={key} type="button" onClick={() => setForm(f => ({ ...f, category: key }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={form.category === key
                      ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                      : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }}>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Frequência chips */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Frequência</label>
            <div className="flex gap-2">
              {FREQ_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setForm(f => ({ ...f, frequency: value }))}
                  className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                  style={form.frequency === value
                    ? { backgroundColor: '#FFF0EB', color: '#C94A1A', borderColor: 'transparent' }
                    : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Conta */}
          {accounts.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Conta / Cartão (opcional)</label>
              <select value={form.account_id} onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
                className="w-full h-9 px-3 border border-border rounded-lg text-sm bg-white outline-none focus:border-accent">
                <option value="">Sem conta específica</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <Input label="Próxima data" type="date" value={form.next_date}
            onChange={e => setForm(f => ({ ...f, next_date: e.target.value }))} required />

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} loadingText="Salvando..." className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Excluir recorrente"
        description="Tem certeza? A transação recorrente será removida permanentemente."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleting}
      />
    </main>
  )
}
