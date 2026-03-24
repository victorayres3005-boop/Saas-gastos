'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export type MarketRate = {
  id: string
  value: number          // taxa diária em decimal (ex: 0.00041854)
  reference_date: string
  updated_at: string
}

export type Rates = {
  cdi: number   // taxa diária CDI em decimal
  selic: number // taxa diária SELIC em decimal
  date: string  // data de referência
  loading: boolean
}

// Calcula rendimento mensal estimado dado principal e tipo de investimento
export function calcMonthlyYield(
  principal: number,
  investmentType: string,
  cdiDaily: number,
  selicDaily: number,
): number {
  if (!principal || investmentType === 'none') return 0
  const days = 21.75  // média de dias úteis por mês

  let r = 0
  if      (investmentType === 'cdb_100')  r = cdiDaily
  else if (investmentType === 'cdb_110')  r = cdiDaily * 1.1
  else if (investmentType === 'selic')    r = selicDaily || cdiDaily
  else if (investmentType === 'poupanca') r = (selicDaily || cdiDaily) * 0.7

  return principal * (Math.pow(1 + r, days) - 1)
}

// Converte taxa diária decimal para taxa anual %
export function toAnnualPct(dailyRate: number): number {
  return (Math.pow(1 + dailyRate, 252) - 1) * 100
}

export function useMarketRates(): Rates {
  const [rates, setRates] = useState<Rates>({ cdi: 0, selic: 0, date: '', loading: true })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('market_rates')
      .select('*')
      .then(({ data }) => {
        const rows = (data ?? []) as MarketRate[]
        const cdi   = rows.find(r => r.id === 'cdi_daily')
        const selic = rows.find(r => r.id === 'selic_daily')
        setRates({
          cdi:    cdi?.value   ?? 0,
          selic:  selic?.value ?? 0,
          date:   cdi?.reference_date ?? '',
          loading: false,
        })
      })
  }, [])

  return rates
}
