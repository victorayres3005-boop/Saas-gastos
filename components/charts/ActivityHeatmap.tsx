'use client'

interface ActivityHeatmapProps {
  data: { date: string; value: number }[]
  year: number
}

function getColor(value: number, max: number): string {
  if (value === 0 || max === 0) return '#F0F0F0'
  const ratio = value / max
  if (ratio < 0.33) return '#FFD4C2'
  if (ratio < 0.66) return '#FF9E7A'
  return '#FF6B35'
}

export function ActivityHeatmap({ data, year }: ActivityHeatmapProps) {
  const dataMap = new Map(data.map(d => [d.date, d.value]))
  const maxValue = Math.max(...data.map(d => d.value), 1)

  const weeks: { date: Date; value: number }[][] = []
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)

  // Align to Monday
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

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] pt-5">
          {days.map((day, i) => (
            <div key={i} className="h-[11px] text-[10px] text-text-tertiary w-7 leading-none flex items-center">
              {day}
            </div>
          ))}
        </div>
        {/* Grid */}
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1 h-4">
            {weeks.map((week, wi) => {
              const firstDay = week.find(d => d.date.getDate() <= 7 && d.date.getFullYear() === year)
              return (
                <div key={wi} className="w-[11px]">
                  {firstDay && firstDay.date.getDate() <= 7 ? (
                    <span className="text-[10px] text-text-tertiary">{months[firstDay.date.getMonth()][0]}</span>
                  ) : null}
                </div>
              )
            })}
          </div>
          {/* Cells by row (day of week) */}
          {[0,1,2,3,4,5,6].map(dayIdx => (
            <div key={dayIdx} className="flex gap-[3px] mb-[3px]">
              {weeks.map((week, wi) => {
                const cell = week[dayIdx]
                const inYear = cell.date.getFullYear() === year
                return (
                  <div
                    key={wi}
                    title={inYear ? `${cell.date.toLocaleDateString('pt-BR')}: R$ ${cell.value.toFixed(2)}` : ''}
                    className="w-[11px] h-[11px] rounded-[2px]"
                    style={{ backgroundColor: inYear ? getColor(cell.value, maxValue) : 'transparent' }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
