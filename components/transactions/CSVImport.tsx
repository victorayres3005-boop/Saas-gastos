'use client'
import { useState, useRef } from 'react'
import { Upload, X, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { CategoryBadge } from '../ui/CategoryBadge'
import { CATEGORIES, type CategoryKey } from '@/lib/utils/categories'
import { formatCurrency } from '@/lib/utils/formatters'

interface ParsedRow {
  description: string
  value: number
  category: CategoryKey
  date: string
}

interface CSVImportProps {
  onImport: (rows: ParsedRow[]) => Promise<{ error?: string }>
}

export function CSVImport({ onImport }: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<ParsedRow[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const validCategories = Object.keys(CATEGORIES) as CategoryKey[]

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n').slice(1) // skip header
    return lines.map(line => {
      const [description, value, category, date] = line.split(',').map(s => s.trim().replace(/"/g, ''))
      return {
        description: description || 'Importado',
        value: parseFloat(value) || 0,
        category: validCategories.includes(category as CategoryKey) ? category as CategoryKey : 'food',
        date: date || new Date().toISOString().split('T')[0],
      }
    }).filter(r => r.value > 0)
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setPreview(parseCSV(text))
      setError('')
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
    else setError('Apenas arquivos .csv são aceitos')
  }

  const handleConfirm = async () => {
    if (!preview) return
    setLoading(true)
    const result = await onImport(preview)
    setLoading(false)
    if (result.error) setError(result.error)
    else setPreview(null)
  }

  if (preview) {
    return (
      <div className="border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-primary">{preview.length} transações encontradas</p>
          <button onClick={() => setPreview(null)} className="text-text-tertiary hover:text-text-primary">
            <X size={16} />
          </button>
        </div>
        <div className="max-h-48 overflow-y-auto border border-border rounded-lg mb-3">
          {preview.slice(0, 10).map((row, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 border-b border-border-light last:border-0 text-sm">
              <span className="flex-1 text-text-primary truncate">{row.description}</span>
              <CategoryBadge category={row.category} size="sm" />
              <span className="text-text-primary font-medium tabular-nums">{formatCurrency(row.value)}</span>
            </div>
          ))}
          {preview.length > 10 && (
            <p className="px-3 py-2 text-xs text-text-tertiary">+{preview.length - 10} mais...</p>
          )}
        </div>
        {error && <p className="text-xs text-negative mb-2">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreview(null)}>Cancelar</Button>
          <Button size="sm" loading={loading} loadingText="Importando..." onClick={handleConfirm}>
            <Check size={14} /> Confirmar importação
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-accent bg-accent-light' : 'border-border hover:border-accent'
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-text-tertiary" />
        <p className="text-sm font-medium text-text-secondary">Arraste um arquivo CSV</p>
        <p className="text-xs text-text-tertiary mt-0.5">ou clique para selecionar</p>
        <p className="text-xs text-text-tertiary mt-1">Colunas: descrição, valor, categoria, data</p>
      </div>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {error && <p className="text-xs text-negative mt-1">{error}</p>}
    </div>
  )
}
