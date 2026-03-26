export default function Loading() {
  return (
    <main className="p-4 md:p-8 min-h-screen">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <div className="skeleton h-8 w-44 rounded mb-2" />
          <div className="skeleton h-4 w-56 rounded" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-accent/30 p-4">
            <div className="skeleton h-2.5 w-20 rounded mb-2" />
            <div className="skeleton h-6 w-28 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-bg-surface rounded-xl border border-accent/30 overflow-hidden shadow-[0_1px_3px_rgba(255,107,53,0.08)]">
        {Array(7).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
            <div className="skeleton h-2.5 w-20 rounded flex-shrink-0" />
            <div className="skeleton h-2.5 flex-1 rounded max-w-[180px]" />
            <div className="skeleton h-5 w-20 rounded-full flex-shrink-0" />
            <div className="skeleton h-2.5 w-24 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </main>
  )
}
