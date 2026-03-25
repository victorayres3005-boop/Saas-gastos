'use client'
import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import type { Database } from '@/lib/supabase/types'
import type { Account } from '@/lib/hooks/useAccounts'

type Transaction = Database['public']['Tables']['transactions']['Row']

interface EditTransactionModalProps {
  transaction: Transaction | null
  onClose: () => void
  onSave: (id: string, data: { description: string; value: number; category: CategoryKey; date: string; notes?: string | null; account_id?: string | null }) => Promise<{ error?: string }>
  accounts?: Account[]
}

export function EditTransactionModal({ transaction, onClose, onSave, accounts = [] }: EditTransactionModalProps) {
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<CategoryKey>('food')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [accountId, setAccountId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isIncome, setIsIncome] = useState(false)

  useEffect(() => {
    if (transaction) {
      const income = transaction.value < 0
      setIsIncome(income)
      setDescription(transaction.description)
      setValue(Math.abs(transaction.value).toString())
      setCategory(transaction.category as CategoryKey)
      setDate(transaction.date)
      setNotes(transaction.notes || '')
      setAccountId(transaction.account_id || '')
      setError('')
    }
  }, [transaction])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction) return
    setLoading(true)
    const result = await onSave(transaction.id, {
      description: description.trim() || CATEGORIES[category].label,
      value: isIncome ? -Math.abs(parseFloat(value)) : Math.abs(parseFloat(value)),
      category,
      date,
      notes: notes.trim() || null,
      account_id: accountId || null,
    })
    setLoading(false)
    if (result.error) setError(result.error)
    else onClose()
  }

  return (
    <Modal isOpen={!!transaction} onClose={onClose} title="Editar Transação">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Toggle Despesa / Receita */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button type="button" onClick={() => { setIsIncome(false); setCategory(EXPENSE_CATEGORIES[0]) }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${!isIncome ? 'bg-red-50 text-red-600 border-r border-border' : 'text-text-tertiary hover:bg-gray-50 border-r border-border'}`}>
            Despesa
          </button>
          <button type="button" onClick={() => { setIsIncome(true); setCategory(INCOME_CATEGORIES[0]) }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${isIncome ? 'bg-green-50 text-green-600' : 'text-text-tertiary hover:bg-gray-50'}`}>
            Receita
          </button>
        </div>
        <Input label="Descrição (opcional)" value={description} onChange={e => setDescription(e.target.value)} />
        <Input label="Valor (R$)" type="number" step="0.01" min="0.01" value={value} onChange={e => setValue(e.target.value)} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {(isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(key => {
              const cat = CATEGORIES[key]
              return (
                <button key={key} type="button" onClick={() => setCategory(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={category === key
                    ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                    : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>
        <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} required />
        {accounts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Conta</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full h-9 px-3 border border-border rounded-lg text-sm text-text-primary bg-bg-surface outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
              <option value="">Sem conta específica</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Observação (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm placeholder:text-text-tertiary bg-bg-surface outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] resize-none h-16 transition-all" />
        </div>
        {error && <p className="text-xs text-negative">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} loadingText="Salvando..." className="flex-1">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
