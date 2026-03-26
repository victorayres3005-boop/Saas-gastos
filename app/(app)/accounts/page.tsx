'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Wallet, Pencil, Trash2, CreditCard, Utensils, Banknote, Building2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useRecurring } from '@/lib/hooks/useRecurring'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { BankLogo } from '@/components/ui/BankLogo'
import { CategoryBadge } from '@/components/ui/CategoryBadge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { createAccount, updateAccount, deleteAccount } from '@/app/actions/accounts'
import { setBankStorage } from '@/lib/hooks/useAccounts'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { BANKS, BANK_CATEGORIES, getBankById, getBanksByCategory, type BankCategory } from '@/lib/utils/banks'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/lib/hooks/useAccounts'
import type { Database } from '@/lib/supabase/types'
import type { CategoryKey } from '@/lib/utils/categories'

type Transaction = Database['public']['Tables']['transactions']['Row']

// ─── Constantes ────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  { value: 'meal_voucher', label: 'Vale Refeição',    icon: Utensils },
  { value: 'credit',       label: 'Cartão de Crédito', icon: CreditCard },
  { value: 'debit',        label: 'Cartão de Débito',  icon: CreditCard },
  { value: 'checking',     label: 'Conta Corrente',    icon: Building2 },
  { value: 'cash',         label: 'Dinheiro',          icon: Banknote },
] as const

const TYPE_LABELS: Record<string, string> = {
  meal_voucher: 'Vale Refeição',
  credit:  'Crédito',
  debit:   'Débito',
  cash:    'Dinheiro',
  checking:'Conta Corrente',
}

const TYPE_SHORT: Record<Account['type'], string> = {
  credit:       'Crédito',
  debit:        'Débito',
  checking:     'Conta',
  meal_voucher: '',
  cash:         'Dinheiro',
}

const BANK_DEFAULT_TYPE: Partial<Record<string, Account['type']>> = {
  nubank: 'credit', inter: 'credit', c6bank: 'credit',
  neon: 'debit', picpay: 'debit', will: 'debit', mercadopago: 'debit', pagbank: 'debit',
  bradesco: 'checking', itau: 'checking', santander: 'checking', caixa: 'checking', bb: 'checking',
  btg: 'checking', xp: 'checking', rico: 'checking',
  sicoob: 'checking', sicredi: 'checking',
  alelo: 'meal_voucher', vr: 'meal_voucher', ticket: 'meal_voucher',
  sodexo: 'meal_voucher', flash: 'meal_voucher',
}

const COLORS = ['#FF6B35', '#16A34A', '#2563EB', '#DB2777', '#D97706', '#7C3AED', '#0891B2', '#DC2626']

function getAutoName(bankId: string, type: Account['type']): string {
  const bank = getBankById(bankId)
  if (!bank) return ''
  const suffix = TYPE_SHORT[type]
  return suffix ? `${bank.name} ${suffix}` : bank.name
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-[11px] font-medium tracking-[0.06em] uppercase text-text-tertiary mb-2">
      {text}
    </p>
  )
}

// ─── AccountForm ────────────────────────────────────────────────────────────────

type FormState = { name: string; type: Account['type']; color: string; balance: string; bank: string }

interface AccountFormProps {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  bankCategory: BankCategory | 'all'
  setBankCategory: React.Dispatch<React.SetStateAction<BankCategory | 'all'>>
  filteredBanks: ReturnType<typeof getBanksByCategory>
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
  saving: boolean
  onBankSelect: (bankId: string) => void
  onTypeChange: (type: Account['type']) => void
}

function AccountForm({
  form, setForm, bankCategory, setBankCategory, filteredBanks,
  onSubmit, onCancel, submitLabel, saving, onBankSelect, onTypeChange,
}: AccountFormProps) {
  const previewBalance = parseFloat(form.balance || '0')
  const previewName = form.name || 'Nome da conta'

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {/* Preview */}
      <div className="bg-bg-page rounded-xl p-4 flex items-center gap-3.5 border border-border">
        {form.bank ? (
          <BankLogo bankId={form.bank} size={44} />
        ) : (
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: form.color + '25' }}>
            <Wallet size={20} style={{ color: form.color }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${form.name ? 'text-text-primary' : 'text-text-tertiary'}`}>
            {previewName}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">{TYPE_LABELS[form.type]}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-text-tertiary uppercase tracking-[0.06em] mb-0.5">Saldo inicial</p>
          <p className={`text-[15px] font-bold ${previewBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
            {formatCurrency(previewBalance)}
          </p>
        </div>
      </div>

      {/* Banco */}
      <div>
        <SectionLabel text="Banco / Instituição" />
        <div className="flex gap-1.5 overflow-x-auto pb-2.5 [scrollbar-width:none]">
          {([['all', 'Todos'], ...Object.entries(BANK_CATEGORIES)] as [string, string][]).map(([key, label]) => {
            const active = bankCategory === key
            return (
              <button key={key} type="button" onClick={() => setBankCategory(key as BankCategory | 'all')}
                className={`flex-shrink-0 px-3 py-1 rounded-full whitespace-nowrap text-xs transition-colors ${
                  active ? 'border-2 border-accent bg-accent-light text-accent-text font-semibold' : 'border border-border text-text-secondary'
                }`}>
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <button type="button" onClick={() => setForm(f => ({ ...f, bank: '', name: '' }))}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-[64px] transition-colors ${
              !form.bank ? 'border-2 border-accent bg-accent-light' : 'border border-border'
            }`}>
            <div className="w-8 h-8 rounded-lg bg-bg-page flex items-center justify-center">
              <Wallet size={15} className="text-text-tertiary" />
            </div>
            <span className={`text-[11px] whitespace-nowrap ${!form.bank ? 'text-accent-text font-medium' : 'text-text-secondary'}`}>
              Outro
            </span>
          </button>
          {filteredBanks.map(bank => {
            const selected = form.bank === bank.id
            return (
              <button key={bank.id} type="button" onClick={() => onBankSelect(bank.id)}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-lg min-w-[64px] transition-colors ${
                  selected ? 'border-2 border-accent bg-accent-light' : 'border border-border'
                }`}>
                <BankLogo bankId={bank.id} size={32} />
                <span className={`text-[11px] whitespace-nowrap ${selected ? 'text-accent-text font-medium' : 'text-text-secondary'}`}>
                  {bank.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nome + Saldo */}
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <SectionLabel text="Nome da conta" />
          <input
            required
            placeholder="Ex: Nubank Crédito..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full h-9 px-3 border border-border rounded-lg text-[13px] text-text-primary bg-bg-surface outline-none focus:border-accent transition-all"
          />
        </div>
        <div>
          <SectionLabel text="Saldo inicial (R$)" />
          <input
            type="number" step="0.01" placeholder="0,00"
            value={form.balance}
            onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
            className="w-full h-9 px-3 border border-border rounded-lg text-[13px] text-text-primary bg-bg-surface outline-none focus:border-accent transition-all"
          />
        </div>
      </div>

      {/* Tipo */}
      <div>
        <SectionLabel text="Tipo" />
        <div className="flex gap-1.5 flex-wrap">
          {ACCOUNT_TYPES.map(({ value, label }) => {
            const selected = form.type === value
            return (
              <button key={value} type="button" onClick={() => onTypeChange(value as Account['type'])}
                className={`px-3.5 py-[7px] text-[13px] rounded-lg transition-colors ${
                  selected ? 'border-2 border-accent bg-accent-light text-accent-text font-medium' : 'border border-border text-text-secondary'
                }`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={saving} loadingText="Salvando..." className="flex-1">{submitLabel}</Button>
      </div>
    </form>
  )
}

// ─── Página principal ───────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = { name: '', type: 'debit', color: COLORS[0], balance: '', bank: '' }

export default function AccountsPage() {
  const { accounts, loading } = useAccounts()
  const { items: recurring } = useRecurring()
  const { showToast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bankCategory, setBankCategory] = useState<BankCategory | 'all'>('all')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const fetchTransactions = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    setTransactions((data as Transaction[]) || [])
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  useEffect(() => {
    const handler = () => fetchTransactions()
    window.addEventListener('fintrack:transactions-updated', handler)
    return () => window.removeEventListener('fintrack:transactions-updated', handler)
  }, [fetchTransactions])

  const getEffectiveBalance = useCallback((accountId: string, initialBalance: number) => {
    const thisMonth = new Date().toISOString().slice(0, 7)

    // Transações diretamente vinculadas à conta
    const linked = transactions.filter(t => t.account_id === accountId)
    let txAdjust = linked.reduce((s, t) => s + t.value, 0)

    // Recorrentes ativos vinculados à conta
    const accountRecurring = recurring.filter(r => r.active && r.account_id === accountId)

    let recAdjust = 0
    for (const r of accountRecurring) {
      // Procura transação este mês que corresponde a este recorrente
      // (independente do account_id — cobre falha do processor)
      const matchTx = transactions.find(t =>
        t.date.startsWith(thisMonth) &&
        t.value === r.value &&
        t.description === r.description
      )
      if (matchTx) {
        // Transação existe — se não está em linked (account_id errado), inclui aqui
        if (matchTx.account_id !== accountId) txAdjust += matchTx.value
      } else {
        // Sem transação este mês — inclui o recorrente no saldo projetado
        recAdjust += r.value
      }
    }

    return initialBalance - txAdjust - recAdjust
  }, [transactions, recurring])

  // Recorrentes por conta
  const getAccountRecurring = useCallback((accountId: string) => {
    return recurring.filter(r => r.active && r.account_id === accountId)
  }, [recurring])

  const getMonthlyRecurring = (items: typeof recurring) => {
    const expense = items.filter(r => r.value > 0).reduce((s, r) => {
      if (r.frequency === 'monthly') return s + r.value
      if (r.frequency === 'weekly')  return s + r.value * 4.33
      if (r.frequency === 'yearly')  return s + r.value / 12
      return s
    }, 0)
    const income = items.filter(r => r.value < 0).reduce((s, r) => {
      const v = Math.abs(r.value)
      if (r.frequency === 'monthly') return s + v
      if (r.frequency === 'weekly')  return s + v * 4.33
      if (r.frequency === 'yearly')  return s + v / 12
      return s
    }, 0)
    return { expense, income }
  }

  const resetForm = () => { setForm(EMPTY_FORM); setBankCategory('all') }

  const handleBankSelect = (bankId: string) => {
    const bank = getBankById(bankId)
    const newType = BANK_DEFAULT_TYPE[bankId] ?? form.type
    const prevAutoName = getAutoName(form.bank, form.type)
    const newAutoName = getAutoName(bankId, newType)
    setForm(f => ({
      ...f,
      bank: bankId,
      color: bank ? bank.bg : f.color,
      type: newType,
      name: (f.name === '' || f.name === prevAutoName) ? newAutoName : f.name,
    }))
  }

  const handleTypeChange = (type: Account['type']) => {
    const prevAutoName = getAutoName(form.bank, form.type)
    const newAutoName = getAutoName(form.bank, type)
    setForm(f => ({
      ...f,
      type,
      name: (f.name === '' || f.name === prevAutoName) ? newAutoName : f.name,
    }))
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const result = await createAccount({
      name: form.name, type: form.type, color: form.color,
      balance: parseFloat(form.balance || '0'), bank: form.bank || null,
    })
    setSaving(false)
    if (result.error) showToast(result.error, 'error')
    else {
      if (result.id) setBankStorage(result.id, form.bank || null)
      showToast('Conta criada!'); setModalOpen(false); resetForm()
      window.dispatchEvent(new Event('fintrack:accounts-updated'))
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAccount) return
    setSaving(true)
    const result = await updateAccount(editingAccount.id, {
      name: form.name, color: form.color,
      balance: parseFloat(form.balance || '0'), bank: form.bank || null,
    })
    setSaving(false)
    if (result.error) showToast(result.error, 'error')
    else {
      setBankStorage(editingAccount.id, form.bank || null)
      showToast('Conta atualizada!'); setEditingAccount(null)
      window.dispatchEvent(new Event('fintrack:accounts-updated'))
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setDeleting(true)
    const result = await deleteAccount(deletingId)
    setDeleting(false); setDeletingId(null)
    if (result.error) showToast(result.error, 'error')
    else {
      showToast('Conta removida')
      window.dispatchEvent(new Event('fintrack:accounts-updated'))
    }
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setBankCategory('all')
    setForm({ name: account.name, type: account.type, color: account.color, balance: account.balance.toString(), bank: account.bank || '' })
  }

  const filteredBanks = useMemo(() =>
    bankCategory === 'all' ? BANKS : getBanksByCategory(bankCategory),
  [bankCategory])

  const sharedFormProps = {
    form, setForm, bankCategory, setBankCategory, filteredBanks,
    saving, onBankSelect: handleBankSelect, onTypeChange: handleTypeChange,
  }

  // Totais gerais
  const totalInitial = accounts.reduce((s, a) => s + a.balance, 0)
  const totalEffective = accounts.reduce((s, a) => s + getEffectiveBalance(a.id, a.balance), 0)

  return (
    <main className="p-4 md:p-8 min-h-screen max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Contas</h1>
          <p className="text-sm text-text-secondary mt-0.5">Gerencie seus cartões e contas</p>
        </div>
        <Button onClick={() => { resetForm(); setModalOpen(true) }}>
          <Plus size={16} /> Nova conta
        </Button>
      </div>

      {/* Resumo geral */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-bg-surface rounded-xl border border-accent/30 p-4 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
            <p className="text-xs text-text-tertiary mb-1">Saldo inicial total</p>
            <p className="text-lg font-bold text-text-primary tabular-nums">{formatCurrency(totalInitial)}</p>
          </div>
          <div className={`rounded-xl border border-accent/30 p-4 shadow-[0_1px_3px_rgba(255,107,53,0.08)] ${totalEffective >= 0 ? 'bg-positive-light' : 'bg-negative-light'}`}>
            <p className="text-xs text-text-tertiary mb-1">Saldo projetado total</p>
            <p className={`text-lg font-bold tabular-nums ${totalEffective >= 0 ? 'text-positive' : 'text-negative'}`}>
              {formatCurrency(totalEffective)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-surface rounded-xl border border-accent/30 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl skeleton" />
              <div className="flex-1">
                <div className="h-3.5 w-28 skeleton mb-2" />
                <div className="h-2.5 w-20 skeleton" />
              </div>
              <div className="h-5 w-20 skeleton" />
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-bg-surface rounded-xl border border-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
          <EmptyState
            icon={Wallet}
            title="Nenhuma conta cadastrada"
            description="Adicione seus cartões e contas bancárias para ter uma visão completa do seu dinheiro."
            action={{ label: '+ Adicionar conta', onClick: () => { resetForm(); setModalOpen(true) } }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {accounts.map(account => {
            const TypeIcon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet
            const effectiveBalance = getEffectiveBalance(account.id, account.balance)
            const accountTxs = transactions.filter(t => t.account_id === account.id)
            const totalIncome = accountTxs.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0)
            const totalExpense = accountTxs.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0)
            const accountRecurring = getAccountRecurring(account.id)
            const { expense: recExpense, income: recIncome } = getMonthlyRecurring(accountRecurring)
            const isExpanded = expandedAccount === account.id

            return (
              <div key={account.id} className="bg-bg-surface rounded-xl border border-accent/30 shadow-[0_1px_3px_rgba(255,107,53,0.08)] overflow-hidden">
                {/* Cabeçalho da conta */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-bg-page transition-colors"
                  onClick={() => setExpandedAccount(isExpanded ? null : account.id)}
                >
                  {account.bank ? (
                    <BankLogo bankId={account.bank} size={40} />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: account.color + '20' }}>
                      <TypeIcon size={18} style={{ color: account.color }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary">{account.name}</p>
                    <p className="text-xs text-text-tertiary">{TYPE_LABELS[account.type]}</p>
                  </div>

                  {/* Saldo atual */}
                  <div className="text-right mr-2">
                    <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Saldo projetado</p>
                    <p className={`text-base font-bold tabular-nums ${effectiveBalance >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {formatCurrency(effectiveBalance)}
                    </p>
                    <p className="text-[10px] text-text-tertiary">
                      inicial: {formatCurrency(account.balance)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); openEdit(account) }}
                      className="text-text-tertiary hover:text-text-primary transition-colors p-1">
                      <Pencil size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeletingId(account.id) }}
                      className="text-text-tertiary hover:text-negative transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                    <div className="text-text-tertiary p-1">
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* Painel expandido */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Mini resumo */}
                    <div className="grid grid-cols-3 gap-0 border-b border-border">
                      <div className="px-4 py-3 border-r border-border">
                        <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Receitas</p>
                        <p className="text-sm font-semibold text-positive tabular-nums">+{formatCurrency(totalIncome)}</p>
                      </div>
                      <div className="px-4 py-3 border-r border-border">
                        <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Despesas</p>
                        <p className="text-sm font-semibold text-negative tabular-nums">-{formatCurrency(totalExpense)}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[10px] text-text-tertiary uppercase tracking-wide mb-0.5">Transações</p>
                        <p className="text-sm font-semibold text-text-primary tabular-nums">{accountTxs.length}</p>
                      </div>
                    </div>

                    {/* Recorrentes vinculadas */}
                    {accountRecurring.length > 0 && (
                      <div className="px-4 py-3 border-b border-border bg-bg-page">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw size={11} className="text-text-tertiary" />
                          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">
                            Recorrentes vinculadas
                          </p>
                          <span className="ml-auto text-[10px] text-text-tertiary">
                            {recIncome > 0 && <span className="text-positive">+{formatCurrency(recIncome)}/mês</span>}
                            {recIncome > 0 && recExpense > 0 && ' · '}
                            {recExpense > 0 && <span className="text-negative">-{formatCurrency(recExpense)}/mês</span>}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {accountRecurring.map(r => (
                            <div key={r.id} className="flex items-center gap-2">
                              <span className="text-xs text-text-secondary flex-1 truncate">{r.description}</span>
                              <span className="text-xs text-text-tertiary capitalize">
                                {r.frequency === 'monthly' ? 'Mensal' : r.frequency === 'weekly' ? 'Semanal' : 'Anual'}
                              </span>
                              <span className={`text-xs font-semibold tabular-nums ${r.value < 0 ? 'text-positive' : 'text-negative'}`}>
                                {r.value < 0 ? '+' : '-'}{formatCurrency(Math.abs(r.value))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Movimentos */}
                    {accountTxs.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-text-tertiary">Nenhuma transação vinculada a esta conta</p>
                      </div>
                    ) : (
                      <div>
                        <div className="px-4 py-2 border-b border-border bg-bg-page">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Movimentos</p>
                        </div>
                        <div className="divide-y divide-border-light max-h-64 overflow-y-auto">
                          {accountTxs.slice(0, 20).map(tx => (
                            <div key={tx.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-bg-page transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text-primary truncate">{tx.description}</p>
                                <p className="text-[10px] text-text-tertiary mt-0.5">{formatDate(tx.date)}</p>
                              </div>
                              <CategoryBadge category={tx.category as CategoryKey} />
                              <span className={`text-xs font-semibold tabular-nums ml-1 ${tx.value < 0 ? 'text-positive' : 'text-negative'}`}>
                                {tx.value < 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.value))}
                              </span>
                            </div>
                          ))}
                          {accountTxs.length > 20 && (
                            <div className="px-4 py-2 text-center">
                              <p className="text-xs text-text-tertiary">+{accountTxs.length - 20} transações anteriores</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm() }} title="Nova Conta">
        <AccountForm {...sharedFormProps} onSubmit={handleCreate} onCancel={() => { setModalOpen(false); resetForm() }} submitLabel="Criar conta" />
      </Modal>

      <Modal isOpen={!!editingAccount} onClose={() => setEditingAccount(null)} title="Editar Conta">
        <AccountForm {...sharedFormProps} onSubmit={handleUpdate} onCancel={() => setEditingAccount(null)} submitLabel="Salvar" />
      </Modal>

      <ConfirmDialog
        isOpen={!!deletingId}
        title="Excluir conta"
        description="Tem certeza? As transações vinculadas a esta conta perderão o vínculo, mas não serão excluídas."
        confirmLabel="Excluir conta"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleting}
      />
    </main>
  )
}
