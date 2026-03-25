import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

// ── Prompts ──────────────────────────────────────────────────────────────────

const STATEMENT_PROMPT = `Você é um extrator especializado em extratos bancários brasileiros.

Analise o texto abaixo (extraído de um PDF de extrato bancário) e extraia TODAS as transações.
Ignore completamente: saldos, totais, cabeçalhos, rodapés, dados da conta, agência, período.

Retorne APENAS um array JSON válido, sem markdown, sem explicação, sem código:
[{"date":"YYYY-MM-DD","description":"descrição limpa","value":150.00,"isIncome":false}]

Regras obrigatórias:
- date: formato YYYY-MM-DD (converta DD/MM/AAAA para YYYY-MM-DD)
- description: texto descritivo LIMPO — sem valores monetários, sem saldos, sem asteriscos
- value: valor ABSOLUTO positivo em reais (número float, não string)
- isIncome: true para crédito/entrada/recebimento, false para débito/saída/pagamento
- Inclua TODAS as transações do extrato, não resuma nem agrupe

Texto do extrato:
`

const PIX_PROMPT = `Extraia os dados do comprovante Pix abaixo.

Retorne APENAS um objeto JSON válido, sem markdown:
{"value":150.00,"recipient":"Nome completo","date":"YYYY-MM-DD","time":"HH:MM"}

Se não encontrar algum campo, use null.

Texto do comprovante:
`

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractJSON(text: string): unknown {
  // Strip markdown code blocks if present
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
  return JSON.parse(stripped)
}

function detectType(text: string): 'statement' | 'pix' {
  if (/extrato|movimenta[cç][aã]o|hist[oó]rico\s+de\s+lan[cç]|per[ií]odo\s+de\s+\d|lan[cç]amentos/i.test(text)) {
    return 'statement'
  }
  const dates = text.match(/\d{2}\/\d{2}\/\d{2,4}/g) ?? []
  if (new Set(dates).size >= 3) return 'statement'
  return 'pix'
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
    const { text } = await pdfParse(buffer)

    if (!text || text.trim().length < 20) {
      return NextResponse.json({ error: 'Não foi possível extrair texto do PDF. O arquivo pode ser uma imagem escaneada.' }, { status: 422 })
    }

    const type = detectType(text)

    // ── Statement: use Claude to extract all transactions ──────────────────
    if (type === 'statement') {
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8096,
        messages: [{ role: 'user', content: STATEMENT_PROMPT + text }],
      })

      const raw = (message.content[0] as { type: string; text: string }).text
      let transactions: { date: string; description: string; value: number; isIncome: boolean }[]

      try {
        transactions = extractJSON(raw) as typeof transactions
        // Validate shape
        if (!Array.isArray(transactions)) throw new Error('Not an array')
        transactions = transactions.filter(t =>
          typeof t.date === 'string' &&
          typeof t.description === 'string' &&
          typeof t.value === 'number' &&
          t.value > 0
        )
      } catch {
        // Fallback: return raw text for client-side regex parsing
        return NextResponse.json({ type: 'statement', text, aiError: 'parse_failed' })
      }

      return NextResponse.json({
        type: 'statement',
        transactions: transactions.map(t => ({
          date: t.date,
          description: t.description,
          value: t.isIncome ? -Math.abs(t.value) : Math.abs(t.value),
          isIncome: t.isIncome,
          selected: true,
        })),
      })
    }

    // ── Pix receipt: use Claude to extract fields ──────────────────────────
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: PIX_PROMPT + text }],
    })

    const raw = (message.content[0] as { type: string; text: string }).text
    let pix: { value: number | null; recipient: string | null; date: string | null; time: string | null }

    try {
      pix = extractJSON(raw) as typeof pix
    } catch {
      // Fallback to raw text
      return NextResponse.json({ type: 'pix', text })
    }

    return NextResponse.json({
      type: 'pix',
      pix: {
        value: pix.value,
        recipient: pix.recipient,
        date: pix.date,
        time: pix.time,
        description: pix.recipient ? `Pix para ${pix.recipient}` : 'Transferência Pix',
        rawText: text,
      },
    })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
