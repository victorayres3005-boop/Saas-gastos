'use client'
import { useState, useEffect } from 'react'
import type { CategoryKey } from '@/lib/utils/categories'

const STORAGE_KEY = 'fintrack_templates_v1'

export interface Template {
  id: string
  description: string
  value: number
  category: CategoryKey
  isIncome: boolean
  accountId: string
}

function loadFromStorage(): Template[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') }
  catch { return [] }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>(loadFromStorage)

  // Sync across tabs
  useEffect(() => {
    const handler = () => setTemplates(loadFromStorage())
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const save = (data: Omit<Template, 'id'>) => {
    const next = [...templates, { ...data, id: crypto.randomUUID() }]
    setTemplates(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const remove = (id: string) => {
    const next = templates.filter(t => t.id !== id)
    setTemplates(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  return { templates, save, remove }
}
