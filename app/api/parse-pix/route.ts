import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ── Position-aware text extraction using pdf2json ─────────────────────────────
// pdf2json gives us each text item with x,y coordinates so we can reconstruct
// the table rows properly (pdf-parse flattens everything linearly, breaking columns).

interface TextItem { x: number; y: number; text: string }

async function extractTextPositional(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json') as new (ctx: null, verbosity: number) => {
    on(event: 'pdfParser_dataReady', cb: () => void): void
    on(event: 'pdfParser_dataError', cb: (err: Error) => void): void
    parseBuffer(buf: Buffer): void
    data: {
      Pages: Array<{
        Texts: Array<{ x: number; y: number; R: Array<{ T: string }> }>
      }>
    }
  }

  return new Promise((resolve, reject) => {
    const parser = new PDFParser(null, 1)

    parser.on('pdfParser_dataError', reject)

    parser.on('pdfParser_dataReady', () => {
      try {
        const lines: string[] = []

        for (const page of parser.data?.Pages ?? []) {
          // Collect all text items on this page with their positions
          const items: TextItem[] = (page.Texts ?? []).map(t => ({
            x: t.x,
            y: t.y,
            text: decodeURIComponent(t.R?.map(r => r.T).join('') ?? ''),
          })).filter(i => i.text.trim())

          // Group items into rows by y-coordinate (tolerance = 0.3 units)
          const rowMap = new Map<number, TextItem[]>()
          for (const item of items) {
            const key = Math.round(item.y / 0.3) * 0.3
            if (!rowMap.has(key)) rowMap.set(key, [])
            rowMap.get(key)!.push(item)
          }

          // Sort rows top-to-bottom, items left-to-right within each row
          const rows = Array.from(rowMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([, its]) =>
              its.sort((a, b) => a.x - b.x).map(i => i.text).join('  ')
            )
            .filter(r => r.trim().length > 0)

          lines.push(...rows)
        }

        resolve(lines.join('\n'))
      } catch (err) {
        reject(err)
      }
    })

    parser.parseBuffer(buffer)
  })
}

// ── Fallback: pdf-parse (linear text, less accurate) ─────────────────────────

async function extractTextFallback(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>
  const { text } = await pdfParse(buffer)
  return text
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

    // Try position-aware extraction first; fall back to pdf-parse on error
    let text: string
    try {
      text = await extractTextPositional(buffer)
    } catch {
      text = await extractTextFallback(buffer)
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do PDF. O arquivo pode ser escaneado ou protegido.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
