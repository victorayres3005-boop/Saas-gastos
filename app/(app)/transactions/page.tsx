'use client'
import { useState, useMemo, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { CSVImport } from '@/components/transactions/CSVImport'
import { Button } from '@/components/ui/Button'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useToast } from '@/components/ui/Toast'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'

export default function TransactionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const { transactions, loading, addTransaction, deleteTransaction, importTransactions } = useTransactions(month, year)
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null)
  const [search, setSearch] = useState('')

  // Keyboard shortcut N to open modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setModalOpen(true)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchCat = !activeCategory || t.category === activeCategory
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [transactions, activeCategory, search])

  const handleDelete = async (id: string) => {
    const { error } = await deleteTransaction(id)
    if (error) showToast('Erro ao excluir transação', 'error')
    else showToast('Transação excluída')
  }

  const handleAdd = async (tx: Parameters<typeof addTransaction>[0]) => {
    const result = await addTransaction(tx)
    if (!result.error) showToast('Transação adicionada!')
    return result
  }

  const handleImport = async (rows: Parameters<typeof importTransactions>[0]) => {
    const result = await importTransactions(rows)
    if (!result.error) showToast(`${rows.length} transações importadas!`)
    else showToast('Erro ao importar', 'error')
    return result
  }

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  return (
    <main className="p-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Transações</h1>
          <p className="text-sm text-text-secondary mt-0.5">{transactions.length} registros encontrados</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} /> Nova transação
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 px-3 border border-border rounded-lg text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] w-48"
        />
        <select
          value={`${year}-${month}`}
          onChange={e => { const [y, m] = e.target.value.split('-'); setYear(+y); setMonth(+m) }}
          className="h-8 px-3 border border-border rounded-lg text-sm outline-none focus:border-accent bg-white"
        >
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), i, 1)
            return <option key={i} value={`${d.getFullYear()}-${i}`}>{months[i]} {d.getFullYear()}</option>
          })}
        </select>
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!activeCategory ? 'bg-accent text-white border-accent' : 'border-border bg-white text-text-secondary hover:border-accent'}`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={activeCategory === cat ? { backgroundColor: CATEGORIES[cat].bg, color: CATEGORIES[cat].text, borderColor: 'transparent' } : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }}
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
      </div>

      {/* CSV Import */}
      <div className="mb-5">
        <CSVImport onImport={handleImport} />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-sm text-text-tertiary">
          Carregando...
        </div>
      ) : (
        <TransactionTable transactions={filtered} onDelete={handleDelete} />
      )}

      <AddTransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </main>
  )
}
