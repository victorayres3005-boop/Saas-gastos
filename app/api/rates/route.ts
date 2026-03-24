import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Rota pública (sem auth) — retorna CDI e SELIC atuais
// Tenta ler do banco primeiro; se vazio, busca direto do BCB e salva
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Tenta ler do banco
  const { data: rows } = await supabase.from('market_rates').select('*')
  const cdiRow   = rows?.find(r => r.id === 'cdi_daily')
  const selicRow = rows?.find(r => r.id === 'selic_daily')

  if (cdiRow && selicRow) {
    return NextResponse.json({
      cdi:   cdiRow.value,
      selic: selicRow.value,
      date:  cdiRow.reference_date,
      source: 'db',
    })
  }

  // Banco vazio — busca direto do Banco Central
  try {
    const [cdiRes, selicRes] = await Promise.all([
      fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json', { cache: 'no-store' }),
      fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json', { cache: 'no-store' }),
    ])

    if (!cdiRes.ok || !selicRes.ok) throw new Error('BCB indisponível')

    const [cdiData, selicData] = await Promise.all([cdiRes.json(), selicRes.json()])

    const parseDate = (d: string) => {
      const [day, month, year] = d.split('/')
      return `${year}-${month}-${day}`
    }

    const cdiValue   = parseFloat(cdiData[0].valor)  / 100
    const selicValue = parseFloat(selicData[0].valor) / 100
    const refDate    = parseDate(cdiData[0].data)

    // Persiste no banco para próximas chamadas
    await supabase.from('market_rates').upsert([
      { id: 'cdi_daily',   value: cdiValue,   reference_date: refDate, updated_at: new Date().toISOString() },
      { id: 'selic_daily', value: selicValue, reference_date: refDate, updated_at: new Date().toISOString() },
    ], { onConflict: 'id' })

    return NextResponse.json({ cdi: cdiValue, selic: selicValue, date: refDate, source: 'bcb' })
  } catch {
    return NextResponse.json({ error: 'Não foi possível obter as taxas' }, { status: 502 })
  }
}
