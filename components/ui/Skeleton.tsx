export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />
}

/* ── MetricCard ─────────────────────────────────────────── */
export function MetricCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
      <Skeleton className="h-2.5 w-20 mb-3" />
      <Skeleton className="h-7 w-28 mb-2" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  )
}

/* ── Balance card (dashboard) ───────────────────────────── */
export function BalanceCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-xl border border-accent/30 border-t-2 border-t-accent p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)] mb-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="flex items-end gap-8 mb-4 flex-wrap">
        <div>
          <Skeleton className="h-2 w-16 mb-1.5" />
          <Skeleton className="h-7 w-32" />
        </div>
        <div>
          <Skeleton className="h-2 w-16 mb-1.5" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div>
          <Skeleton className="h-2 w-16 mb-1.5" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  )
}

/* ── Goal card ──────────────────────────────────────────── */
export function GoalCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div>
            <Skeleton className="h-3.5 w-28 mb-1.5" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton className="w-6 h-6 rounded-lg" />
      </div>
      <div className="flex items-end justify-between mb-1.5">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-2 w-full rounded-full mb-3" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  )
}

/* ── Account card ───────────────────────────────────────── */
export function AccountCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-xl border border-accent/30 p-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-3.5 w-28 mb-2" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <div className="text-right">
        <Skeleton className="h-5 w-24 mb-1" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

/* ── Transaction row ────────────────────────────────────── */
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
      <Skeleton className="h-3 w-20 flex-shrink-0" />
      <Skeleton className="h-3 w-40 flex-1" />
      <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
      <Skeleton className="h-3 w-24 flex-shrink-0" />
    </div>
  )
}

/* ── Table skeleton (recurring) ─────────────────────────── */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <Skeleton className="h-3.5 w-32 mb-1.5" />
        <Skeleton className="h-2.5 w-16" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full flex-shrink-0" />
      <Skeleton className="h-3 w-16 flex-shrink-0" />
      <Skeleton className="h-3 w-16 flex-shrink-0" />
      <Skeleton className="h-4 w-20 flex-shrink-0" />
    </div>
  )
}

/* ── Chart card ─────────────────────────────────────────── */
export function ChartCardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-accent/30 p-5 shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
      <Skeleton className="h-2.5 w-32 mb-4" />
      <Skeleton className={`w-full rounded-xl`} style={{ height }} />
    </div>
  )
}
