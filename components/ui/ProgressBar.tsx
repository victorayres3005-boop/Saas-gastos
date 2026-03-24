interface ProgressBarProps {
  value: number
  max: number
  showLabel?: boolean
}

export function ProgressBar({ value, max, showLabel = false }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = pct >= 100 ? '#DC2626' : pct >= 80 ? '#D97706' : '#FF6B35'

  return (
    <div className="w-full">
      <div className="w-full h-1.5 bg-bg-page rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      {showLabel && (
        <p className="text-xs mt-1" style={{ color }}>
          {pct.toFixed(0)}%
        </p>
      )}
    </div>
  )
}
