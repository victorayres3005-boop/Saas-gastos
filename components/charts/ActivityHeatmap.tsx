'use client'

interface ActivityHeatmapProps {
  data: { date: string; value: number }[]
  year: number
}

function getColor(value: number, max: number): string {
  if (value === 0 || max === 0) return 'var(--border)'
  const ratio = value / max
  if (ratio < 0.25) return '#FFD4C2'
  if (ratio < 0.50) return '#FFAB85'
  if (ratio < 0.75) return '#FF8552'
  return '#FF6B35'
}

export function ActivityHeatmap({ data, year }: ActivityHeatmapProps) {
  const dataMap = new Map(data.map(d => [d.date, d.value]))
  const maxValue = Math.max(...data.map(d => d.value), 1)

  const weeks: { date: Date; value: number }[][] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  const startDay = start.getDay()
  const alignedStart = new Date(start)
  alignedStart.setDate(start.getDate() - ((startDay + 6) % 7))

  const current = new Date(alignedStart)
  while (current <= end) {
    const week: { date: Date; value: number }[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = current.toISOString().split('T')[0]
      week.push({ date: new Date(current), value: dataMap.get(dateStr) || 0 })
      current.setDate(current.getDate() + 1)
    }
    weeks.push(week)
  }

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const days = ['Seg', '', 'Qua', '', 'Sex', '', '']

  const CELL = 14
  const GAP = 3

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col pt-5" style={{ gap: GAP }}>
          {days.map((day, i) => (
            <div key={i} className="text-[10px] text-text-tertiary w-7 leading-none flex items-center" style={{ height: CELL }}>
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex mb-1 h-4" style={{ gap: GAP }}>
            {weeks.map((week, wi) => {
              const firstDay = week.find(d => d.date.getDate() <= 7 && d.date.getFullYear() === year)
              return (
                <div key={wi} style={{ width: CELL }}>
                  {firstDay && firstDay.date.getDate() <= 7 ? (
                    <span className="text-[10px] text-text-tertiary">{months[firstDay.date.getMonth()]}</span>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Cells */}
          {[0,1,2,3,4,5,6].map(dayIdx => (
            <div key={dayIdx} className="flex" style={{ gap: GAP, marginBottom: GAP }}>
              {weeks.map((week, wi) => {
                const cell = week[dayIdx]
                const inYear = cell.date.getFullYear() === year
                const fmt = cell.date.toLocaleDateString('pt-BR')
                const val = cell.value
                return (
                  <div
                    key={wi}
                    title={inYear && val > 0 ? `${fmt}: R$ ${val.toFixed(2)}` : inYear ? fmt : ''}
                    className="rounded-[3px] transition-opacity hover:opacity-75 cursor-default"
                    style={{
                      width: CELL,
                      height: CELL,
                      backgroundColor: inYear ? getColor(val, maxValue) : 'transparent',
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-text-tertiary">Menos</span>
        {['var(--border)', '#FFD4C2', '#FFAB85', '#FF8552', '#FF6B35'].map((c, i) => (
          <div key={i} className="rounded-[3px]" style={{ width: CELL, height: CELL, backgroundColor: c }} />
        ))}
        <span className="text-[10px] text-text-tertiary">Mais</span>
      </div>
    </div>
  )
}
