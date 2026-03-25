'use client'
import { useState, useRef } from 'react'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { CategoryBadge } from '../ui/CategoryBadge'
import { formatCurrency } from '@/lib/utils/formatters'
import { parseCSVByBank, BANK_LABELS, type ParsedRow, type BankFormat } from '@/lib/utils/bankCsvParsers'

interface CSVImportProps {
  onImport: (rows: ParsedRow[]) => Promise<{ error?: string }>
}

const BANK_COLORS: Record<BankFormat, string> = {
  nubank:   '#820AD1',
  inter:    '#FF7A00',
  bradesco: '#CC092F',
  itau:     '#003087',
  c6:       '#242424',
  generic:  'var(--text-secondary)',
}

export function CSVImport({ onImport }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [detectedBank, setDetectedBank] = useState<BankFormat | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Apenas arquivos .csv são aceitos'); return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { rows, format } = parseCSVByBank(text)
      if (rows.length === 0) {
        setError('Nenhuma transação encontrada. Verifique o formato do arquivo.')
        return
      }
      setDetectedBank(format)
      setPreview(rows)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)
    const result = await onImport(preview)
    setLoading(false)
    if (result.error) setError(result.error)
    else { setPreview(null); setDetectedBank(null) }
  }

  if (preview && detectedBank !== null) {
    const expenses = preview.filter(r => r.value > 0)
    const incomes  = preview.filter(r => r.value < 0)
    const total    = expenses.reduce((s, r) => s + r.value, 0)

    return (
      <div className="flex flex-col gap-3">
        {/* Bank badge + summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: BANK_COLORS[detectedBank] }}
            >
              {BANK_LABELS[detectedBank]}
            </span>
            <span className="text-xs text-text-tertiary">
              {expenses.length} despesa{expenses.length !== 1 ? 's' : ''}
              {incomes.length > 0 ? ` · ${incomes.length} receita${incomes.length !== 1 ? 's' : ''}` : ''}
            </span>
          </div>
          <button onClick={() => { setPreview(null); setDetectedBank(null) }}
            className="text-text-tertiary hover:text-text-primary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Preview table */}
        <div className="max-h-60 overflow-y-auto border border-border rounded-xl divide-y divide-border-light">
          <div className="sticky top-0 bg-bg-page grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2">
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Descrição</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Categoria</span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary text-right">Valor</span>
          </div>
          {preview.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center px-3 py-2 hover:bg-bg-page transition-colors">
              <div className="min-w-0">
                <p className="text-xs text-text-primary truncate">{row.description}</p>
                <p className="text-[10px] text-text-tertiary">{row.date.split('-').reverse().join('/')}</p>
              </div>
              <CategoryBadge category={row.category} size="sm" />
              <span className={`text-xs font-semibold tabular-nums text-right ${row.value < 0 ? 'text-green-600' : 'text-red-500'}`}>
                {row.value < 0 ? '+' : ''}{formatCurrency(Math.abs(row.value))}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-text-tertiary">Total de despesas</span>
          <span className="text-sm font-bold text-red-500 tabular-nums">{formatCurrency(total)}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-negative text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setPreview(null); setDetectedBank(null) }}>
            Cancelar
          </Button>
          <Button size="sm" loading={loading} loadingText="Importando..." onClick={handleConfirm} className="flex-1">
            <Check size={14} /> Importar {preview.length} transações
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-text-tertiary" />
        <p className="text-sm font-medium text-text-secondary">Arraste o CSV do seu banco</p>
        <p className="text-xs text-text-tertiary mt-0.5">ou clique para selecionar</p>
      </div>

      {/* Supported banks */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.entries(BANK_LABELS) as [BankFormat, string][]).map(([key, label]) => (
          key !== 'generic' && (
            <span key={key} className="px-2 py-0.5 rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: BANK_COLORS[key] }}>
              {label}
            </span>
          )
        ))}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-border text-text-tertiary">
          + formato genérico
        </span>
      </div>

      <input ref={fileRef} type="file" accept=".csv" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {error && (
        <div className="flex items-center gap-2 text-negative text-xs">
          <AlertCircle size={13} /> {error}
        </div>
      )}
    </div>
  )
}
