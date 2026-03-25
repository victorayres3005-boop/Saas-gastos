import { type LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
        <Icon size={24} className="text-accent" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-text-primary mb-1">{title}</p>
      <p className="text-xs text-text-tertiary max-w-[220px] leading-relaxed mb-5">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
