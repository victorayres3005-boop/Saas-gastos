'use client'
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (tx: { description: string; value: number; category: CategoryKey; date: string }) => Promise<{ error?: string }>
}

export function AddTransactionModal({ isOpen, onClose, onAdd }: AddTransactionModalProps) {
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [category, setCategory] = useState<CategoryKey>('food')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim() || !value) return
    setLoading(true)
    setError('')
    const result = await onAdd({ description: description.trim(), value: parseFloat(value), category, date })
    setLoading(false)
    if (result.error) setError(result.error)
    else {
      setDescription(''); setValue(''); setCategory('food'); setDate(new Date().toISOString().split('T')[0])
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Transação">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Descrição"
          placeholder="Ex: Mercado, Netflix..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />
        <Input
          label="Valor (R$)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0,00"
          value={value}
          onChange={e => setValue(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Categoria</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as CategoryKey)}
            className="w-full h-9 px-3 border border-border rounded-lg text-sm text-text-primary bg-white outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] transition-all"
          >
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <option key={key} value={key}>{cat.label}</option>
            ))}
          </select>
        </div>
        <Input
          label="Data"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
        />
        {error && <p className="text-xs text-negative">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={loading} loadingText="Salvando..." className="flex-1">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
