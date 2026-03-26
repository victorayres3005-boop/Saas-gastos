'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    setWidth(0)
    const t1 = setTimeout(() => setWidth(75), 10)
    const t2 = setTimeout(() => setWidth(100), 250)
    const t3 = setTimeout(() => setVisible(false), 500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [pathname])

  if (!visible) return null
  return (
    <div
      className="fixed top-0 left-0 z-[100] h-0.5 bg-accent transition-all ease-out"
      style={{ width: `${width}%`, opacity: width === 100 ? 0 : 1, transitionDuration: width === 0 ? '0ms' : '250ms' }}
    />
  )
}
