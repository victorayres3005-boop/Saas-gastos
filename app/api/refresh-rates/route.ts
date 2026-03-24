import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

// Rota chamada manualmente pelo usuário na aba Metas
// Requer sessão autenticada (não precisa de CRON_SECRET)
export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [cdiRes, selicRes] = await Promise.all([
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados/ultimos/1?formato=json', { cache: 'no-store' }),
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados/ultimos/1?formato=json', { cache: 'no-store' }),
  ])

  if (!cdiRes.ok || !selicRes.ok) {
    return NextResponse.json({ error: 'Falha ao buscar taxas do Banco Central' }, { status: 502 })
  }

  const [cdiData, selicData] = await Promise.all([cdiRes.json(), selicRes.json()])

  const parseDate = (d: string) => {
    const [day, month, year] = d.split('/')
    return `${year}-${month}-${day}`
  }

  const rates = [
    {
      id: 'cdi_daily',
      value: parseFloat(cdiData[0].valor) / 100,
      reference_date: parseDate(cdiData[0].data),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'selic_daily',
      value: parseFloat(selicData[0].valor) / 100,
      reference_date: parseDate(selicData[0].data),
      updated_at: new Date().toISOString(),
    },
  ]

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await serviceClient
    .from('market_rates')
    .upsert(rates, { onConflict: 'id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    cdi: rates[0].value,
    selic: rates[1].value,
    date: rates[0].reference_date,
  })
}
