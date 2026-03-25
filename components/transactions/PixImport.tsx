'use client'
import { useState, useRef } from 'react'
import { FileUp, X, Check, Loader2, AlertCircle, FileText, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import type { Account } from '@/lib/hooks/useAccounts'
import {
  parsePDFFile,
  type ParsedPix, type ParsedTransaction,
} from '@/lib/utils/parsePix'
import { autoCategory } from '@/lib/utils/categorize'

type TxInput = {
  description: string; value: number; category: CategoryKey
  date: string; notes?: string; account_id?: string | null
}

interface PixImportProps {
  accounts: Account[]
  onAdd: (txs: TxInput[]) => Promise<{ error?: string }>
}

type Step = 'idle' | 'parsing' | 'review-single' | 'review-multi' | 'saving'

const ALL_CATEGORIES = Object.entries(CATEGORIES) as [CategoryKey, typeof CATEGORIES[CategoryKey]][]

// ─── Component ───────────────────────────────────────────────────────────────

export function PixImport({ accounts, onAdd }: PixImportProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  // Account selected BEFORE upload (shared by both flows)
  const [accountId, setAccountId] = useState<string>('')

  // ── Single (pix/comprovante) state
  const [pix, setPix] = useState<ParsedPix | null>(null)
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<CategoryKey>('other')
  const [notes, setNotes] = useState('')

  // ── Multi (extrato) state
  const [rows, setRows] = useState<(ParsedTransaction & { category: CategoryKey })[]>([])
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('idle'); setPix(null); setError('')
    setDescription(''); setValue(''); setDate(''); setNotes('')
    setCategory('other'); setRows([]); setExpandedRow(null)
    // Keep accountId so user doesn't re-select after a failed import
  }

  const handleClose = () => { setOpen(false); reset(); setAccountId('') }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são aceitos'); return
    }
    setError(''); setStep('parsing')
    try {
      const result = await parsePDFFile(file)

      if (result.type === 'pix') {
        const p = result.pix
        setPix(p)
        setDescription(p.description)
        setValue(p.value != null ? p.value.toFixed(2).replace('.', ',') : '')
        setDate(p.date ?? new Date().toISOString().split('T')[0])
        setNotes(p.time ? `Horário: ${p.time}` : '')
        setCategory('other')
        setStep('review-single')
      } else {
        const enriched = result.transactions.map(t => ({
          ...t,
          category: autoCategory(t.description, t.isIncome),
        }))
        setRows(enriched)
        setStep('review-multi')
      }
    } catch (err) {
      setError(`Erro ao ler PDF: ${err instanceof Error ? err.message : String(err)}`)
      setStep('idle')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ── Save single
  const handleSaveSingle = async () => {
    const num = parseFloat(value.replace(/\./g, '').replace(',', '.'))
    if (!description.trim()) { setError('Informe a descrição'); return }
    if (!num || num <= 0) { setError('Informe um valor válido'); return }
    if (!date) { setError('Informe a data'); return }
    setStep('saving')
    const result = await onAdd([{
      description: description.trim(), value: num, category, date,
      notes: notes || undefined, account_id: accountId || null,
    }])
    if (result.error) { setError(result.error); setStep('review-single') }
    else handleClose()
  }

  // ── Save multi
  const handleSaveMulti = async () => {
    const selected = rows.filter(r => r.selected)
    if (selected.length === 0) { setError('Selecione ao menos uma transação'); return }
    setStep('saving')
    const txs: TxInput[] = selected.map(r => ({
      description: r.description,
      value: r.isIncome ? -Math.abs(r.value) : Math.abs(r.value),
      category: r.category,
      date: r.date,
      account_id: accountId || null,
    }))
    const result = await onAdd(txs)
    if (result.error) { setError(result.error); setStep('review-multi') }
    else handleClose()
  }

  const updateRow = (i: number, patch: Partial<typeof rows[0]>) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))
  }

  const allSelected = rows.every(r => r.selected)
  const selectedCount = rows.filter(r => r.selected).length

  const isSaving = step === 'saving'

  return (
    <>
      <Button variant="secondary" onClick={() => { reset(); setAccountId(''); setOpen(true) }}>
        <FileText size={16} /> <span className="hidden sm:inline">Importar PDF</span>
      </Button>

      <Modal
        isOpen={open}
        onClose={handleClose}
        title={step === 'review-multi' ? `Extrato detectado — ${rows.length} transações` : 'Importar PDF'}
        maxWidth={step === 'review-multi' ? 'max-w-3xl' : 'max-w-lg'}
      >
        {/* ── Account selector (always visible on idle/review) ─────────── */}
        {(step === 'idle' || step === 'parsing') && (
          <div className="flex flex-col gap-4">

            {/* Account picker — before upload */}
            {accounts.length > 0 && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">
                  Conta / Banco (selecione antes de enviar o PDF)
                </label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-accent/40 text-sm outline-none focus:border-accent bg-bg-surface text-text-primary"
                >
                  <option value="">Nenhuma conta</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => step === 'idle' && fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-accent bg-orange-50' : 'border-border hover:border-accent'
              } ${step === 'parsing' ? 'pointer-events-none opacity-60' : ''}`}
            >
              {step === 'parsing' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={28} className="text-accent animate-spin" />
                  <p className="text-sm font-medium text-text-secondary">Analisando o PDF com IA...</p>
                  <p className="text-xs text-text-tertiary">Pode levar alguns segundos</p>
                </div>
              ) : (
                <>
                  <FileUp size={28} className="mx-auto mb-3 text-text-tertiary" />
                  <p className="text-sm font-semibold text-text-secondary">Arraste o PDF aqui</p>
                  <p className="text-xs text-text-tertiary mt-1">Comprovante Pix ou extrato mensal/semestral</p>
                  <p className="text-xs text-text-tertiary mt-0.5">ou <span className="text-accent">clique para selecionar</span></p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}
          </div>
        )}

        {/* ── REVIEW SINGLE (comprovante Pix) ──────────────────────────── */}
        {(step === 'review-single' || (isSaving && pix)) && (
          <div className="flex flex-col gap-4">
            {/* Confidence badges */}
            {pix && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-text-tertiary">Extraído:</span>
                {[
                  { label: 'Valor', ok: pix.value != null },
                  { label: 'Destinatário', ok: pix.recipient != null },
                  { label: 'Data', ok: pix.date != null },
                  { label: 'Horário', ok: pix.time != null },
                ].map(f => (
                  <span key={f.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    f.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {f.ok ? '✓' : '–'} {f.label}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Descrição</label>
              <input value={description} onChange={e => setDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                placeholder="Ex: Pix para João" />
            </div>

            {/* Value + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Valor (R$)</label>
                <input value={value} onChange={e => setValue(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                  placeholder="0,00" />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Data</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]" />
              </div>
            </div>

            {/* Category chips */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map(([key, cat]) => (
                  <button key={key} type="button" onClick={() => setCategory(key)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-all hover:border-accent/40"
                    style={category === key
                      ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                      : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                    }>{cat.label}</button>
                ))}
              </div>
            </div>

            {/* Account */}
            {accounts.length > 0 && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Conta</label>
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent bg-bg-surface">
                  <option value="">Nenhuma</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Observações</label>
              <input value={notes} onChange={e => setNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(255,107,53,0.12)]"
                placeholder="Ex: Horário: 14:30" />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={reset} disabled={isSaving}>
                <X size={14} /> Voltar
              </Button>
              <Button className="flex-1" onClick={handleSaveSingle} loading={isSaving} loadingText="Salvando...">
                <Check size={14} /> Salvar transação
              </Button>
            </div>
          </div>
        )}

        {/* ── REVIEW MULTI (extrato) ────────────────────────────────────── */}
        {(step === 'review-multi' || (isSaving && rows.length > 0)) && (
          <div className="flex flex-col gap-3">

            {/* Account + summary row */}
            <div className="flex items-center gap-3 flex-wrap">
              {accounts.length > 0 && (
                <select value={accountId} onChange={e => setAccountId(e.target.value)}
                  className="h-8 px-2 rounded-lg border border-accent/40 text-xs outline-none focus:border-accent bg-bg-surface text-text-primary">
                  <option value="">Sem conta</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
              <span className="text-xs text-text-tertiary ml-auto">
                {selectedCount} de {rows.length} selecionadas
              </span>
              <button
                onClick={() => setRows(prev => prev.map(r => ({ ...r, selected: !allSelected })))}
                className="text-xs font-medium text-accent hover:opacity-80 transition-opacity"
              >
                {allSelected ? 'Desmarcar todas' : 'Selecionar todas'}
              </button>
            </div>

            {rows.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-secondary font-medium">Nenhuma transação detectada</p>
                <p className="text-xs text-text-tertiary mt-1">O PDF pode estar em formato não suportado ou protegido por senha.</p>
              </div>
            ) : (
              <div className="max-h-[420px] overflow-y-auto border border-border rounded-xl divide-y divide-border-light">
                {/* Table header */}
                <div className="sticky top-0 bg-bg-page grid grid-cols-[20px_72px_1fr_100px_90px] gap-2 px-3 py-2">
                  <span />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Data</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Descrição</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Categoria</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary text-right">Valor</span>
                </div>

                {rows.map((row, i) => (
                  <div key={i} className={`transition-colors ${row.selected ? '' : 'opacity-40'}`}>
                    {/* Main row */}
                    <div className="grid grid-cols-[20px_72px_1fr_100px_90px] gap-2 items-center px-3 py-2 hover:bg-bg-page transition-colors">
                      {/* Checkbox */}
                      <input type="checkbox" checked={row.selected}
                        onChange={() => updateRow(i, { selected: !row.selected })}
                        className="w-3.5 h-3.5 accent-accent cursor-pointer" />

                      {/* Date */}
                      <span className="text-xs text-text-tertiary tabular-nums">
                        {row.date.split('-').reverse().join('/')}
                      </span>

                      {/* Description + expand button */}
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs text-text-primary truncate flex-1">{row.description}</span>
                        <button
                          onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                          className="text-text-tertiary hover:text-accent transition-colors flex-shrink-0 p-0.5"
                        >
                          <ChevronDown size={12} className={`transition-transform ${expandedRow === i ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {/* Category mini badge */}
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium truncate"
                        style={{ backgroundColor: CATEGORIES[row.category].bg, color: CATEGORIES[row.category].text }}>
                        {CATEGORIES[row.category].label}
                      </span>

                      {/* Value + income toggle */}
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => updateRow(i, { isIncome: !row.isIncome })}
                          className={`text-[10px] font-bold w-4 flex-shrink-0 transition-colors ${row.isIncome ? 'text-green-600' : 'text-red-500'}`}
                          title="Clique para alternar entrada/saída"
                        >
                          {row.isIncome ? '+' : '−'}
                        </button>
                        <span className={`text-xs font-semibold tabular-nums ${row.isIncome ? 'text-green-600' : 'text-red-500'}`}>
                          {Math.abs(row.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    {expandedRow === i && (
                      <div className="px-3 pb-3 bg-bg-page border-t border-border-light">
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 block">Descrição</label>
                            <input value={row.description}
                              onChange={e => updateRow(i, { description: e.target.value })}
                              className="w-full h-7 px-2 text-xs rounded-lg border border-border outline-none focus:border-accent bg-bg-surface" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 block">Data</label>
                            <input type="date" value={row.date}
                              onChange={e => updateRow(i, { date: e.target.value })}
                              className="w-full h-7 px-2 text-xs rounded-lg border border-border outline-none focus:border-accent bg-bg-surface" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 block">Valor (R$)</label>
                            <input type="number" step="0.01" value={Math.abs(row.value)}
                              onChange={e => updateRow(i, { value: parseFloat(e.target.value) || 0 })}
                              className="w-full h-7 px-2 text-xs rounded-lg border border-border outline-none focus:border-accent bg-bg-surface" />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 block">Tipo</label>
                            <div className="flex rounded-lg border border-border overflow-hidden h-7">
                              <button type="button"
                                onClick={() => updateRow(i, { isIncome: false })}
                                className={`flex-1 text-xs font-medium transition-colors ${!row.isIncome ? 'bg-red-50 text-red-600' : 'text-text-tertiary hover:bg-bg-page'}`}>
                                Saída
                              </button>
                              <button type="button"
                                onClick={() => updateRow(i, { isIncome: true })}
                                className={`flex-1 text-xs font-medium transition-colors ${row.isIncome ? 'bg-green-50 text-green-600' : 'text-text-tertiary hover:bg-bg-page'}`}>
                                Entrada
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Category chips */}
                        <div className="mt-2">
                          <label className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1 block">Categoria</label>
                          <div className="flex flex-wrap gap-1.5">
                            {(row.isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(key => (
                              <button key={key} type="button" onClick={() => updateRow(i, { category: key })}
                                className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all"
                                style={row.category === key
                                  ? { backgroundColor: CATEGORIES[key].bg, color: CATEGORIES[key].text, borderColor: 'transparent' }
                                  : { borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' }
                                }>{CATEGORIES[key].label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={reset} disabled={isSaving}>
                <X size={14} /> Voltar
              </Button>
              <Button className="flex-1" onClick={handleSaveMulti}
                loading={isSaving} loadingText={`Importando ${selectedCount}...`}
                disabled={selectedCount === 0}>
                <Check size={14} /> Importar {selectedCount > 0 ? `${selectedCount} ` : ''}transaç{selectedCount === 1 ? 'ão' : 'ões'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
