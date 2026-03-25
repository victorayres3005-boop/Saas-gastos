// ─── Single receipt (comprovante Pix) ──────────────────────────────────────

export interface ParsedPix {
  value: number | null
  recipient: string | null
  date: string | null      // YYYY-MM-DD
  time: string | null      // HH:MM
  description: string
  rawText: string
}

// ─── Multi-transaction (extrato/statement) ──────────────────────────────────

export interface ParsedTransaction {
  date: string        // YYYY-MM-DD
  description: string
  value: number       // positive = expense (saída), negative = income (entrada)
  isIncome: boolean
  selected: boolean
}

// ─── Result union ────────────────────────────────────────────────────────────

export type ParseResult =
  | { type: 'pix'; pix: ParsedPix }
  | { type: 'statement'; transactions: ParsedTransaction[] }

// ─── PDF text extraction (server-side via API route) ────────────────────────

export async function extractTextFromPDF(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/parse-pix', { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Erro HTTP ${res.status}`)
  return json.text as string
}

// ─── Auto-detect document type ───────────────────────────────────────────────

export function detectPDFType(text: string): 'pix' | 'statement' {
  // Statement keywords
  if (/extrato|movimenta[cç][aã]o|hist[oó]rico\s+de\s+lan[cç]|per[ií]odo\s+de\s+\d|fatura\s+de\s+\d/i.test(text)) {
    return 'statement'
  }
  // Count date occurrences — 4+ distinct dates = statement
  const dates = text.match(/\d{2}\/\d{2}\/\d{2,4}/g) ?? []
  const unique = new Set(dates)
  if (unique.size >= 4) return 'statement'
  return 'pix'
}

// ─── Parse single Pix receipt ────────────────────────────────────────────────

export function parsePixFromText(text: string): ParsedPix {
  // Value
  let value: number | null = null
  const valuePatterns = [
    /(?:Valor\s*(?:da\s*(?:transfer[eê]ncia|opera[cç][aã]o|transa[cç][aã]o))?)\s*[:\-]?\s*R?\$?\s*([\d.]+,\d{2})/i,
    /R\$\s*([\d.]+,\d{2})/,
    /(?:Total|Quantia)\s*[:\-]?\s*([\d.]+,\d{2})/i,
  ]
  for (const p of valuePatterns) {
    const m = text.match(p)
    if (m) { value = parseFloat(m[1].replace(/\./g, '').replace(',', '.')); break }
  }

  // Recipient
  let recipient: string | null = null
  const recipientPatterns = [
    /(?:Favorecido|Destinat[aá]rio|Recebedor|Para|Nome\s+do\s+(?:recebedor|destinat[aá]rio|favorecido))\s*[:\-]\s*([^\n\r]+)/i,
    /(?:Nome)\s*[:\-]\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][^\n\r]{3,50})/,
  ]
  for (const p of recipientPatterns) {
    const m = text.match(p)
    if (m) {
      recipient = m[1].trim().replace(/\s{2,}/g, ' ')
      recipient = recipient.split(/\s{3,}|CPF|CNPJ|Banco|Inst\./i)[0].trim()
      if (recipient.length > 2) break
    }
  }

  // Date + Time
  let date: string | null = null
  let time: string | null = null
  const dtMatch = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(?:[àa]s?\s+)?(\d{2}):(\d{2})/i)
  if (dtMatch) {
    date = `${dtMatch[3]}-${dtMatch[2]}-${dtMatch[1]}`
    time = `${dtMatch[4]}:${dtMatch[5]}`
  } else {
    const dm = text.match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (dm) date = `${dm[3]}-${dm[2]}-${dm[1]}`
    const tm = text.match(/(\d{2}):(\d{2})(?::\d{2})?/)
    if (tm) time = `${tm[1]}:${tm[2]}`
  }

  const description = recipient ? `Pix para ${recipient}` : 'Transferência Pix'
  return { value, recipient, date, time, description, rawText: text }
}

// ─── Parse bank statement (multiple transactions) ────────────────────────────

export function parseStatementTransactions(text: string): ParsedTransaction[] {
  const results: ParsedTransaction[] = []
  const seen = new Set<string>()

  // Extract default year from any full date in document
  const yearMatch = text.match(/\d{2}\/\d{2}\/(\d{4})/)
  const defaultYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()

  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)

  function push(year: string, mm: string, dd: string, rawDesc: string, rawVal: string) {
    const date = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
    const cleanVal = rawVal.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const absVal = Math.abs(parseFloat(cleanVal))
    if (isNaN(absVal) || absVal === 0) return
    const isNegative = rawVal.trim().startsWith('-')
    const value = isNegative ? -absVal : absVal
    const description = rawDesc.trim().replace(/\s{2,}/g, ' ')
    if (description.length < 2) return
    const key = `${date}|${absVal.toFixed(2)}|${description.slice(0, 15)}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ date, description, value, isIncome: value < 0, selected: true })
  }

  const SKIP = /^\s*(data|descri[cç][aã]o|hist[oó]rico|valor|saldo|d[eé]bito|cr[eé]dito|lan[cç]amento|movimenta[cç][aã]o)\s*$/i

  for (const line of lines) {
    if (line.length < 8 || line.length > 300 || SKIP.test(line)) continue

    // Pattern 1: DD/MM/YYYY  description  value
    const m1 = line.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(.{2,80}?)\s+([-+]?[\d.]+,\d{2})\s*$/)
    if (m1) { push(m1[3], m1[2], m1[1], m1[4], m1[5]); continue }

    // Pattern 2: DD/MM  description  value  (no year)
    const m2 = line.match(/^(\d{2})\/(\d{2})\s+(.{2,80}?)\s+([-+]?[\d.]+,\d{2})\s*$/)
    if (m2) { push(defaultYear, m2[2], m2[1], m2[3], m2[4]); continue }

    // Pattern 3: DD/MM/YYYY  description  debit  credit  (two value columns — take first non-empty)
    const m3 = line.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(.{2,60}?)\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})/)
    if (m3) {
      // Determine sign by context: credit column (last) is income
      const credit = parseFloat(m3[6].replace(/\./g, '').replace(',', '.'))
      const rawVal = credit > 0 ? `-${m3[6]}` : m3[5]
      push(m3[3], m3[2], m3[1], m3[4], rawVal)
    }
  }

  // Fallback: global scan when line-by-line yields < 2 results
  if (results.length < 2) {
    const globalPat = /(\d{2})\/(\d{2})\/(\d{4})\s+([A-ZÁÀÂ][^\n\d]{2,60}?)\s+([-+]?[\d.]+,\d{2})/g
    let m
    while ((m = globalPat.exec(text)) !== null) {
      push(m[3], m[2], m[1], m[4], m[5])
    }
  }

  return results.sort((a, b) => a.date.localeCompare(b.date))
}

// ─── Main entry: detect type and parse ───────────────────────────────────────

export function parseFromText(text: string): ParseResult {
  const type = detectPDFType(text)
  if (type === 'statement') {
    return { type: 'statement', transactions: parseStatementTransactions(text) }
  }
  return { type: 'pix', pix: parsePixFromText(text) }
}
