'use client'
import { useState, useRef } from 'react'
import { FileUp, X, Check, Loader2, AlertCircle, QrCode } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'
import type { Account } from '@/lib/hooks/useAccounts'
import { extractTextFromPDF, parsePixFromText, type ParsedPix } from '@/lib/utils/parsePix'

interface PixImportProps {
  accounts: Account[]
  onAdd: (tx: { description: string; value: number; category: CategoryKey; date: string; notes?: string; account_id?: string | null }) => Promise<{ error?: string }>
}

type Step = 'idle' | 'parsing' | 'review' | 'saving'

const CATEGORY_OPTIONS = Object.entries(CATEGORIES) as [CategoryKey, { label: string; bg: string; text: string }][]

export function PixImport({ accounts, onAdd }: PixImportProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [parsed, setParsed] = useState<ParsedPix | null>(null)
  const [error, setError] = useState('')

  // Form fields (editáveis após extração)
  const [description, setDescription] = useState('')
  const [value, setValue] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState<CategoryKey>('transport')
  const [accountId, setAccountId] = useState<string>('')
  const [notes, setNotes] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('idle'); setParsed(null); setError('')
    setDescription(''); setValue(''); setDate('')
    setCategory('transport'); setAccountId(''); setNotes('')
  }

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Apenas arquivos PDF são aceitos')
      return
    }
    setError('')
    setStep('parsing')
    try {
      const text = await extractTextFromPDF(file)
      const result = parsePixFromText(text)
      setParsed(result)

      // Pré-preenche o formulário com o que foi extraído
      setDescription(result.description)
      setValue(result.value != null ? result.value.toFixed(2).replace('.', ',') : '')
      setDate(result.date ?? new Date().toISOString().split('T')[0])
      setNotes(result.time ? `Horário: ${result.time}` : '')
      setStep('review')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Erro ao ler PDF: ${msg}`)
      setStep('idle')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = async () => {
    const numericValue = parseFloat(value.replace(/\./g, '').replace(',', '.'))
    if (!description.trim()) { setError('Informe a descrição'); return }
    if (!numericValue || numericValue <= 0) { setError('Informe um valor válido'); return }
    if (!date) { setError('Informe a data'); return }

    setStep('saving')
    const result = await onAdd({
      description: description.trim(),
      value: numericValue,
      category,
      date,
      notes: notes || undefined,
      account_id: accountId || null,
    })
    if (result.error) {
      setError(result.error)
      setStep('review')
    } else {
      setOpen(false)
      reset()
    }
  }

  const confidenceFields = parsed ? [
    { label: 'Valor', ok: parsed.value != null },
    { label: 'Destinatário', ok: parsed.recipient != null },
    { label: 'Data', ok: parsed.date != null },
    { label: 'Horário', ok: parsed.time != null },
  ] : []

  return (
    <>
      <Button variant="secondary" onClick={() => { reset(); setOpen(true) }}>
        <QrCode size={16} /> Importar Pix
      </Button>

      <Modal isOpen={open} onClose={() => { setOpen(false); reset() }} title="Importar comprovante Pix" maxWidth="max-w-lg">

        {/* ── STEP: idle / parsing ────────────────────────────────────── */}
        {(step === 'idle' || step === 'parsing') && (
          <div className="flex flex-col gap-4">
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
                  <p className="text-sm font-medium text-text-secondary">Lendo o comprovante...</p>
                </div>
              ) : (
                <>
                  <FileUp size={28} className="mx-auto mb-3 text-text-tertiary" />
                  <p className="text-sm font-semibold text-text-secondary">Arraste o comprovante Pix</p>
                  <p className="text-xs text-text-tertiary mt-1">ou clique para selecionar o PDF</p>
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

        {/* ── STEP: review ────────────────────────────────────────────── */}
        {step === 'review' && parsed && (
          <div className="flex flex-col gap-4">
            {/* Confiança da extração */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-tertiary">Extraído:</span>
              {confidenceFields.map(f => (
                <span key={f.label} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  f.ok ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {f.ok ? '✓' : '–'} {f.label}
                </span>
              ))}
            </div>

            {/* Descrição */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Descrição</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
                placeholder="Ex: Pix para João"
              />
            </div>

            {/* Valor + Data */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Valor (R$)</label>
                <input
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={category === key
                      ? { backgroundColor: cat.bg, color: cat.text, borderColor: 'transparent' }
                      : { borderColor: '#E5E5E5', backgroundColor: 'white', color: '#6B6B6B' }
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conta */}
            {accounts.length > 0 && (
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Conta (opcional)</label>
                <select
                  value={accountId}
                  onChange={e => setAccountId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent bg-white"
                >
                  <option value="">Nenhuma</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}

            {/* Notas */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5 block">Observações</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border text-sm outline-none focus:border-accent"
                placeholder="Ex: Horário: 14:30"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-negative text-sm">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => { reset(); }}>
                <X size={14} /> Cancelar
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                <Check size={14} /> Salvar transação
              </Button>
            </div>
          </div>
        )}

      </Modal>
    </>
  )
}
