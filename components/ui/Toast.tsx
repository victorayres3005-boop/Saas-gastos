'use client'
import { useState, createContext, useContext, useCallback } from 'react'
import { CheckCircle, XCircle, X, RotateCcw } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: string
  message: string
  type: ToastType
  onUndo?: () => void
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, onUndo?: () => void) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success', onUndo?: () => void) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type, onUndo }])
    const delay = onUndo ? 5000 : 3000
    setTimeout(() => dismiss(id), delay)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-[0_4px_12px_rgba(0,0,0,0.1)] text-sm font-medium min-w-[280px] ${
              toast.type === 'success'
                ? 'bg-positive-light border-positive/20 text-positive'
                : 'bg-negative-light border-negative/20 text-negative'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span className="flex-1">{toast.message}</span>
            {toast.onUndo && (
              <button
                onClick={() => { toast.onUndo!(); dismiss(toast.id) }}
                className="flex items-center gap-1 text-xs font-semibold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
              >
                <RotateCcw size={12} /> Desfazer
              </button>
            )}
            <button onClick={() => dismiss(toast.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
