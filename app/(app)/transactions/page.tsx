'use client'
import { useState, useMemo, useEffect } from 'react'
import { Plus, Download, FileText, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { TransactionTable } from '@/components/transactions/TransactionTable'
import { AddTransactionModal } from '@/components/transactions/AddTransactionModal'
import { EditTransactionModal } from '@/components/transactions/EditTransactionModal'
import { CSVImport } from '@/components/transactions/CSVImport'
import { PixImport } from '@/components/transactions/PixImport'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { useAccounts } from '@/lib/hooks/useAccounts'
import { useProfile } from '@/lib/hooks/useProfile'
import { useToast } from '@/components/ui/Toast'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { exportToCSV } from '@/lib/utils/export'
import { formatCurrency } from '@/lib/utils/formatters'
import { updateTransaction } from '@/app/actions/transactions'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Database } from '@/lib/supabase/types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export default function TransactionsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const { transactions, loading, addTransaction, deleteTransaction, importTransactions } = useTransactions(month, year)
  const { accounts } = useAccounts()
  const { profile } = useProfile()
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryKey | null>(null)
  const [activeAccount, setActiveAccount] = useState<string | null>(null)
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
      const matchAccount = !activeAccount || t.account_id === activeAccount
      return matchCat && matchSearch && matchAccount
    })
  }, [transactions, activeCategory, search, activeAccount])

  const handleDelete = async () => {
    if (!deletingId) return
    const txToDelete = transactions.find(t => t.id === deletingId)
    setDeleting(true)
    const { error } = await deleteTransaction(deletingId)
    setDeleting(false)
    setDeletingId(null)
    if (error) {
      showToast('Erro ao excluir transação', 'error')
    } else {
      showToast('Transação excluída', 'success', txToDelete ? async () => {
        await addTransaction({
          description: txToDelete.description,
          value: txToDelete.value,
          category: txToDelete.category as CategoryKey,
          date: txToDelete.date,
          notes: txToDelete.notes,
          account_id: txToDelete.account_id,
        })
        showToast('Transação restaurada!')
      } : undefined)
    }
  }

  const handleAdd = async (txs: { description: string; value: number; category: CategoryKey; date: string; notes?: string; account_id?: string | null }[]) => {
    // Normalize notes and account_id: convert undefined to null for type compatibility
    const normalized = txs.map(t => ({ ...t, notes: t.notes ?? null, account_id: t.account_id ?? null }))
    if (normalized.length === 1) {
      const result = await addTransaction(normalized[0])
      if (!result.error) showToast('Transação adicionada!')
      else showToast('Erro ao salvar', 'error')
      return result
    }
    // Multiple transactions (installments)
    const result = await importTransactions(normalized)
    if (!result.error) showToast(`${normalized.length} parcelas adicionadas!`)
    else showToast('Erro ao salvar', 'error')
    return result
  }

  const handleEdit = async (id: string, data: { description: string; value: number; category: CategoryKey; date: string; notes?: string | null; account_id?: string | null }) => {
    const result = await updateTransaction(id, data)
    if (!result.error) showToast('Transação atualizada!')
    else showToast('Erro ao atualizar', 'error')
    return result
  }

  const handleImport = async (rows: { description: string; value: number; category: CategoryKey; date: string }[]) => {
    const normalized = rows.map(r => ({ ...r, notes: null as string | null, account_id: null as string | null }))
    const result = await importTransactions(normalized)
    if (!result.error) showToast(`${rows.length} transações importadas!`)
    else showToast('Erro ao importar', 'error')
    return result
  }

  const handleExportPDF = async () => {
    const { exportToPDF } = await import('@/lib/utils/exportPdf')
    await exportToPDF(filtered, months[month], year, profile?.full_name || 'Usuário')
  }

  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary">Transações</h1>
          <p className="text-sm text-text-secondary mt-0.5">{transactions.length} registros encontrados</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setCsvOpen(true)}>
            <Upload size={16} /> <span className="hidden sm:inline">Importar CSV</span>
          </Button>
          <Button variant="secondary" onClick={() => exportToCSV(filtered, `transacoes-${months[month]}-${year}`)}>
            <Download size={16} /> <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button variant="secondary" onClick={handleExportPDF}>
            <FileText size={16} /> <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
          <PixImport accounts={accounts} onAdd={async (tx) => handleAdd([tx])} />
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} /> <span className="hidden sm:inline">Nova transação</span><span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 px-3 border border-accent/30 rounded-lg text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)] w-48"
        />
        <div className="flex items-center gap-1 h-8 border border-accent/30 rounded-lg bg-bg-surface px-1">
          <button onClick={prevMonth} className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium w-32 text-center tabular-nums">{months[month]} {year}</span>
          <button onClick={nextMonth} className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
        {/* Category chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!activeCategory ? 'bg-accent text-white border-accent' : 'border-border bg-bg-surface text-text-secondary hover:border-accent'}`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={activeCategory === cat ? { backgroundColor: CATEGORIES[cat].bg, color: CATEGORIES[cat].text, borderColor: 'transparent' } : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }}
            >
              {CATEGORIES[cat].label}
            </button>
          ))}
        </div>
        {/* Account chips */}
        {accounts.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveAccount(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${!activeAccount ? 'bg-accent text-white border-accent' : 'border-border bg-bg-surface text-text-secondary hover:border-accent'}`}
            >
              Todas as contas
            </button>
            {accounts.map(acc => (
              <button
                key={acc.id}
                onClick={() => setActiveAccount(activeAccount === acc.id ? null : acc.id)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-colors flex items-center gap-1"
                style={activeAccount === acc.id
                  ? { backgroundColor: acc.color, color: 'white', borderColor: acc.color }
                  : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                }
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeAccount === acc.id ? 'white' : acc.color }} />
                {acc.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resumo do mês */}
      {!loading && (() => {
        const receitas = filtered.filter(t => t.value < 0).reduce((s, t) => s + Math.abs(t.value), 0)
        const despesas = filtered.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0)
        const saldo = receitas - despesas
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Receitas', value: receitas, color: '#16A34A', bg: '#F0FDF4' },
              { label: 'Despesas', value: despesas, color: '#DC2626', bg: '#FEF2F2' },
              { label: 'Saldo',    value: saldo,    color: saldo >= 0 ? '#16A34A' : '#DC2626', bg: saldo >= 0 ? '#F0FDF4' : '#FEF2F2' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl border border-accent/30 p-4" style={{ backgroundColor: bg }}>
                <p className="text-xs text-text-tertiary mb-1">{label}</p>
                <p className="text-base font-bold tabular-nums" style={{ color }}>
                  {label === 'Saldo' && saldo < 0 ? '-' : ''}{formatCurrency(Math.abs(value))}
                </p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Table */}
      {loading ? (
        <div className="bg-bg-surface rounded-xl border border-accent/30 p-8 text-center text-sm text-text-tertiary">
          Carregando...
        </div>
      ) : (
        <TransactionTable transactions={filtered} onDelete={setDeletingId} onEdit={setEditingTx} accounts={accounts} />
      )}

      <Modal isOpen={csvOpen} onClose={() => setCsvOpen(false)} title="Importar CSV">
        <CSVImport onImport={async (rows) => { const r = await handleImport(rows); if (!r.error) setCsvOpen(false); return r }} />
      </Modal>
      <AddTransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} accounts={accounts} />
      <EditTransactionModal transaction={editingTx} onClose={() => setEditingTx(null)} onSave={handleEdit} accounts={accounts} />
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Excluir transação"
        description="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
        confirmLabel="Excluir transação"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
        loading={deleting}
      />
    </main>
  )
}
