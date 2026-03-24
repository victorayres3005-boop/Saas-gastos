import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Chamado pelo cron do Vercel todo dia útil às 9h UTC (6h BRT)
// O Vercel injeta automaticamente: Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // API pública do Banco Central do Brasil
  // Série 12 = CDI diário | Série 11 = SELIC diária
  const [cdiRes, selicRes] = await Promise.all([
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json', { cache: 'no-store' }),
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json', { cache: 'no-store' }),
  ])

  if (!cdiRes.ok || !selicRes.ok) {
    return NextResponse.json({ error: 'Falha ao buscar taxas do BCB' }, { status: 502 })
  }

  const [cdiData, selicData] = await Promise.all([cdiRes.json(), selicRes.json()])

  // BCB retorna: [{ "data": "24/03/2026", "valor": "0.041854" }]
  // valor já é a taxa diária em % (0.041854% ao dia)
  const cdiRaw  = cdiData[0]
  const selicRaw = selicData[0]

  const parseDate = (d: string) => {
    const [day, month, year] = d.split('/')
    return `${year}-${month}-${day}`
  }

  const rates = [
    {
      id: 'cdi_daily',
      value: parseFloat(cdiRaw.valor) / 100,   // converte % para decimal
      reference_date: parseDate(cdiRaw.data),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'selic_daily',
      value: parseFloat(selicRaw.valor) / 100,
      reference_date: parseDate(selicRaw.data),
      updated_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase
    .from('market_rates')
    .upsert(rates, { onConflict: 'id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    cdi: rates[0].value,
    selic: rates[1].value,
    date: rates[0].reference_date,
  })
}
