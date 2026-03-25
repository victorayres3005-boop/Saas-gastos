'use client'
import { useState, useEffect, useRef } from 'react'
import { Star, X, Sparkles } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { inferCategoryFromHistory } from '@/lib/utils/categorize'
import { useTemplates } from '@/lib/hooks/useTemplates'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/lib/hooks/useAccounts'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (txs: { description: string; value: number; category: CategoryKey; date: string; notes?: string; account_id?: string | null }[]) => Promise<{ error?: string }>
  accounts?: Account[]
}


export function AddTransactionModal({ isOpen, onClose, onAdd, accounts = [] }: AddTransactionModalProps) {
  const { templates, save: saveTemplate, remove: removeTemplate } = useTemplates()

  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<CategoryKey>('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [installments, setInstallments] = useState(1)
  const [isInstallment, setIsInstallment] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [accountId, setAccountId] = useState('')
  const [isIncome, setIsIncome] = useState(false)

  // History for auto-categorization
  const [history, setHistory] = useState<{ description: string; category: string }[]>([])
  const [autoSuggestion, setAutoSuggestion] = useState<CategoryKey | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const visibleCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const totalValue = parseFloat(value) || 0
  const installmentValue = isInstallment && installments > 1 ? totalValue / installments : totalValue

  // Fetch description history when modal opens
  useEffect(() => {
    if (!isOpen) return
    createClient()
      .from('transactions')
      .select('description, category')
      .order('date', { ascending: false })
      .limit(300)
      .then(({ data }) => setHistory(data ?? []))
  }, [isOpen])

  // Auto-categorize on description change (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSuggestionDismissed(false)
    if (description.length < 3) { setAutoSuggestion(null); return }
    debounceRef.current = setTimeout(() => {
      const suggested = inferCategoryFromHistory(description, history, isIncome)
      if (suggested && suggested !== category) {
        setAutoSuggestion(suggested)
      } else {
        setAutoSuggestion(null)
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description, history])

  const applyTemplate = (t: typeof templates[0]) => {
    setDescription(t.description)
    setValue(t.value.toFixed(2))
    setCategory(t.category)
    setIsIncome(t.isIncome)
    setAccountId(t.accountId)
    setAutoSuggestion(null)
  }

  const handleSaveTemplate = () => {
    if (!description.trim() && !value) return
    saveTemplate({
      description: description.trim() || CATEGORIES[category].label,
      value: parseFloat(value) || 0,
      category,
      isIncome,
      accountId,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value) return
    const desc = description.trim() || CATEGORIES[category].label
    setLoading(true)
    setError('')

    const txs: { description: string; value: number; category: CategoryKey; date: string; notes?: string; account_id?: string | null }[] = []
    if (isInstallment && installments > 1) {
      const baseDate = new Date(date + 'T12:00:00')
      for (let i = 0; i < installments; i++) {
        const d = new Date(baseDate)
        d.setMonth(d.getMonth() + i)
        txs.push({
          description: `${desc} (${i + 1}/${installments})`,
          value: isIncome ? -parseFloat(installmentValue.toFixed(2)) : parseFloat(installmentValue.toFixed(2)),
          category, date: d.toISOString().split('T')[0],
          notes: notes.trim() || undefined, account_id: accountId || null,
        })
      }
    } else {
      txs.push({
        description: desc,
        value: isIncome ? -totalValue : totalValue,
        category, date,
        notes: notes.trim() || undefined, account_id: accountId || null,
      })
    }

    const result = await onAdd(txs)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setDescription(''); setValue(''); setCategory('food')
    setDate(new Date().toISOString().split('T')[0]); setNotes('')
    setInstallments(1); setIsInstallment(false); setAccountId(''); setIsIncome(false)
    setAutoSuggestion(null); setSuggestionDismissed(false)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Templates / Favoritos ──────────────────────────────── */}
        {templates.length > 0 && (
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1.5">
              Favoritos
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {templates.map(t => (
                <div key={t.id} className="flex-shrink-0 group relative">
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="flex flex-col items-start px-3 py-2 rounded-xl border border-border bg-bg-surface hover:border-accent/50 hover:bg-accent/5 transition-all text-left min-w-[100px] max-w-[130px]"
                  >
                    <span className="text-xs font-medium text-text-primary truncate w-full">{t.description || CATEGORIES[t.category].label}</span>
                    <span className={`text-[11px] font-semibold mt-0.5 tabular-nums ${t.isIncome ? 'text-green-600' : 'text-red-500'}`}>
                      {t.isIncome ? '+' : '-'}R$ {t.value.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-text-tertiary mt-0.5">{CATEGORIES[t.category].label}</span>
                  </button>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeTemplate(t.id)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-border text-text-tertiary hidden group-hover:flex items-center justify-center hover:bg-negative hover:text-white transition-colors"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Despesa / Receita toggle ───────────────────────────── */}
        <div className="flex rounded-xl border border-border overflow-hidden bg-bg-page p-1 gap-1">
          <button type="button" onClick={() => { setIsIncome(false); setCategory(EXPENSE_CATEGORIES[0]) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isIncome ? 'bg-negative-light text-negative shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
            Despesa
          </button>
          <button type="button" onClick={() => { setIsIncome(true); setCategory(INCOME_CATEGORIES[0]) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isIncome ? 'bg-positive-light text-positive shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}>
            Receita
          </button>
        </div>

        {/* ── Description ───────────────────────────────────────── */}
        <div>
          <Input
            label="Descrição (opcional)"
            placeholder="Ex: Mercado, Salário..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          {/* Auto-category suggestion */}
          {autoSuggestion && !suggestionDismissed && (
            <div className="flex items-center gap-2 mt-1.5 px-1">
              <Sparkles size={11} className="text-accent flex-shrink-0" />
              <span className="text-xs text-text-tertiary">Sugestão pelo histórico:</span>
              <button
                type="button"
                onClick={() => { setCategory(autoSuggestion); setAutoSuggestion(null) }}
                className="text-xs font-medium px-2 py-0.5 rounded-full transition-all hover:opacity-90"
                style={{ backgroundColor: CATEGORIES[autoSuggestion].bg, color: CATEGORIES[autoSuggestion].text }}
              >
                {CATEGORIES[autoSuggestion].label}
              </button>
              <button
                type="button"
                onClick={() => setSuggestionDismissed(true)}
                className="text-text-tertiary hover:text-text-secondary transition-colors ml-auto"
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        <Input
          label={isInstallment && installments > 1 ? `Valor total (R$) — ${installments}x de R$ ${installmentValue.toFixed(2)}` : 'Valor (R$)'}
          type="number" step="0.01" min="0.01" placeholder="0,00"
          value={value} onChange={e => setValue(e.target.value)} required
        />

        {/* ── Category chips ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Categoria</label>
          <div className="flex flex-wrap gap-1.5">
            {visibleCategories.map(key => {
              const cat = CATEGORIES[key]
              const selected = category === key
              return (
                <button key={key} type="button" onClick={() => { setCategory(key); setAutoSuggestion(null) }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={selected
                    ? { backgroundColor: cat.bg, color: cat.text, borderColor: cat.color + '40' }
                    : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Account ────────────────────────────────────────────── */}
        {accounts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Conta (opcional)</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full h-9 px-3 border border-border rounded-lg text-sm text-text-primary bg-bg-surface outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
              <option value="">Sem conta específica</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        )}

        <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} required />

        {/* ── Installments ───────────────────────────────────────── */}
        {!isIncome && (
          <>
            <div className="flex items-center gap-3 py-1">
              <button type="button" onClick={() => setIsInstallment(!isInstallment)}
                className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${isInstallment ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isInstallment ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-text-secondary">Compra parcelada</span>
            </div>
            {isInstallment && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Número de parcelas</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[2,3,4,5,6,10,12,18,24].map(n => (
                    <button key={n} type="button" onClick={() => setInstallments(n)}
                      className={`w-10 h-9 rounded-lg text-sm font-medium border transition-colors ${installments === n ? 'bg-accent text-white border-accent' : 'border-border text-text-secondary hover:border-accent bg-bg-surface'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Notes ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Observação (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary bg-bg-surface outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] resize-none h-16 transition-all" />
        </div>

        {error && <p className="text-xs text-negative">{error}</p>}

        <div className="flex gap-2 pt-1">
          {/* Save template */}
          <button
            type="button"
            onClick={handleSaveTemplate}
            title="Salvar como favorito"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-border text-text-tertiary hover:text-accent hover:border-accent/40 transition-all flex-shrink-0"
          >
            <Star size={15} />
          </button>
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} loadingText="Salvando..." className="flex-1">
            {isInstallment && installments > 1 ? `Salvar ${installments} parcelas` : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
