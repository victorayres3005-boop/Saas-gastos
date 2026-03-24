'use client'
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import type { Account } from '@/lib/hooks/useAccounts'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (txs: { description: string; value: number; category: CategoryKey; date: string; notes?: string; account_id?: string | null }[]) => Promise<{ error?: string }>
  accounts?: Account[]
}

export function AddTransactionModal({ isOpen, onClose, onAdd, accounts = [] }: AddTransactionModalProps) {
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
  const visibleCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const totalValue = parseFloat(value) || 0
  const installmentValue = isInstallment && installments > 1 ? totalValue / installments : totalValue

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
          category,
          date: d.toISOString().split('T')[0],
          notes: notes.trim() || undefined,
          account_id: accountId || null,
        })
      }
    } else {
      txs.push({
        description: desc,
        value: isIncome ? -totalValue : totalValue,
        category,
        date,
        notes: notes.trim() || undefined,
        account_id: accountId || null,
      })
    }

    const result = await onAdd(txs)
    setLoading(false)
    if (result.error) setError(result.error)
    else {
      setDescription(''); setValue(''); setCategory('food')
      setDate(new Date().toISOString().split('T')[0]); setNotes('')
      setInstallments(1); setIsInstallment(false); setAccountId('')
      setIsIncome(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
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

        <Input label="Descrição (opcional)" placeholder="Ex: Mercado, Salário..." value={description} onChange={e => setDescription(e.target.value)} />
        <Input
          label={isInstallment && installments > 1 ? `Valor total (R$) — ${installments}x de R$ ${installmentValue.toFixed(2)}` : 'Valor (R$)'}
          type="number" step="0.01" min="0.01" placeholder="0,00"
          value={value} onChange={e => setValue(e.target.value)} required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {visibleCategories.map(key => {
              const cat = CATEGORIES[key]
              return (
                <button key={key} type="button" onClick={() => setCategory(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                  style={category === key
                    ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                    : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }}>
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {accounts.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Conta (opcional)</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full h-9 px-3 border border-border rounded-lg text-sm text-text-primary bg-white outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all">
              <option value="">Sem conta específica</option>
              {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>
        )}

        <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} required />

        {/* Parcelado (só para despesas) */}
        {!isIncome && (
          <>
            <div className="flex items-center gap-3 py-1">
              <button type="button" onClick={() => setIsInstallment(!isInstallment)}
                className={`w-9 h-5 rounded-full transition-colors relative ${isInstallment ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isInstallment ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-text-secondary">Compra parcelada</span>
            </div>
            {isInstallment && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Número de parcelas</label>
                <div className="flex gap-2 flex-wrap">
                  {[2,3,4,5,6,10,12,18,24].map(n => (
                    <button key={n} type="button" onClick={() => setInstallments(n)}
                      className={`w-10 h-9 rounded-lg text-sm font-medium border transition-colors ${installments === n ? 'bg-accent text-white border-accent' : 'border-border text-text-secondary hover:border-accent'}`}>
                      {n}x
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Observação (opcional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionais..."
            className="w-full px-3 py-2 border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary bg-white outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] resize-none h-16 transition-all" />
        </div>

        {error && <p className="text-xs text-negative">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} loadingText="Salvando..." className="flex-1">
            {isInstallment && installments > 1 ? `Salvar ${installments} parcelas` : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
