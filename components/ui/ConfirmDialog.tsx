'use client'
import { Button } from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-1">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-9 px-4 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
