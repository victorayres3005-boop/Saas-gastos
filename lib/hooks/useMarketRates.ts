'use client'
import { useState, useEffect } from 'react'

export type Rates = {
  cdi: number    // taxa diária CDI em decimal (ex: 0.00041854)
  selic: number  // taxa diária SELIC em decimal
  date: string   // data de referência (YYYY-MM-DD)
  loading: boolean
  error: boolean
}

// Calcula rendimento mensal estimado dado principal e tipo de investimento
export function calcMonthlyYield(
  principal: number,
  investmentType: string,
  cdiDaily: number,
  selicDaily: number,
): number {
  if (!principal || investmentType === 'none') return 0
  const days = 21.75 // média de dias úteis por mês

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
  const [rates, setRates] = useState<Rates>({ cdi: 0, selic: 0, date: '', loading: true, error: false })

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setRates(r => ({ ...r, loading: false, error: true }))
        } else {
          setRates({ cdi: data.cdi, selic: data.selic, date: data.date, loading: false, error: false })
        }
      })
      .catch(() => setRates(r => ({ ...r, loading: false, error: true })))
  }, [])

  return rates
}
