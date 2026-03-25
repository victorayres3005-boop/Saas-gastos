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
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[3px]" onClick={onCancel} />
      <div className="relative bg-bg-surface rounded-2xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.16)] w-full max-w-sm p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary mb-1">{title}</h2>
          <p className="text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel} className="flex-1" disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading} loadingText="Excluindo..." className="flex-1">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
