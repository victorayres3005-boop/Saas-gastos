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
  if (/extrato|movimenta[cç][aã]o|hist[oó]rico\s+de\s+lan[cç]|per[ií]odo\s+de\s+\d|fatura\s+de\s+\d|lan[cç]amentos/i.test(text)) {
    return 'statement'
  }
  // Count UNIQUE dates — 3+ = likely a statement
  const dates = text.match(/\d{2}\/\d{2}\/\d{2,4}/g) ?? []
  if (new Set(dates).size >= 3) return 'statement'
  return 'pix'
}

// ─── Parse single Pix receipt ────────────────────────────────────────────────

export function parsePixFromText(text: string): ParsedPix {
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

  // Derive default year from any full date in the doc
  const yearMatch = text.match(/\d{2}\/\d{2}\/(\d{4})/)
  const defaultYear = yearMatch ? yearMatch[1] : new Date().getFullYear().toString()

  // All currency values regex
  const VALUE_RE = /[-+]?[\d.]+,\d{2}/g
  const DATE_FULL = /(\d{2})\/(\d{2})\/(\d{4})/
  const DATE_SHORT = /(\d{2})\/(\d{2})(?!\/\d)/

  const SKIP_LINE = /^(data\b|descri[cç]|hist[oó]rico\b|valor\b|saldo\b|d[eé]bito\b|cr[eé]dito\b|lan[cç]amento\b|movimenta|per[ií]odo\b|extrato\b|banco\b|ag[eê]ncia\b|conta\b|nome\b|cpf\b|cnpj\b)/i

  function addTx(year: string, mm: string, dd: string, rawDesc: string, rawVal: string) {
    const date = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`

    // Parse value — handle "1.234,56" and "1234,56" and "-150,00"
    const isNeg = rawVal.trim().startsWith('-')
    const clean = rawVal.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    const absVal = Math.abs(parseFloat(clean))
    if (isNaN(absVal) || absVal === 0 || absVal > 999999) return

    const value = isNeg ? -absVal : absVal
    const description = rawDesc
      .trim()
      .replace(/\s{2,}/g, ' ')
      .replace(/[|\\]/g, '')
      .replace(/^\s*[-–]+\s*/, '')
      .trim()
    if (description.length < 2) return

    const key = `${date}|${absVal.toFixed(2)}|${description.slice(0, 15)}`
    if (seen.has(key)) return
    seen.add(key)
    results.push({ date, description, value, isIncome: value < 0, selected: true })
  }

  // ── Strategy 1: Line-by-line — handles most bank statement formats ──────────
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    if (line.length < 8 || line.length > 500 || SKIP_LINE.test(line)) continue

    const mFull = line.match(DATE_FULL)
    const mShort = !mFull ? line.match(DATE_SHORT) : null
    const mDate = mFull || mShort
    if (!mDate) continue

    const year = mFull ? mFull[3] : defaultYear
    const mm = mDate[2]
    const dd = mDate[1]

    // Remainder of line after the date
    const dateLen = mFull ? 10 : 5
    const dateIndex = line.search(mFull ? DATE_FULL : DATE_SHORT)
    const rest = line.slice(dateIndex + dateLen).trim()

    // Find all currency values in rest
    const vals = Array.from(rest.matchAll(/[-+]?[\d.]{1,10},\d{2}/g)).map(m => m[0])
    if (vals.length === 0) continue

    if (vals.length === 1) {
      // Only one value — that IS the transaction value
      const desc = rest.replace(vals[0], '').trim()
      addTx(year, mm, dd, desc || 'Transação', vals[0])

    } else if (vals.length === 2) {
      // Two values: [transaction_value, saldo] — take the FIRST
      const desc = rest.replace(vals[0], '').replace(vals[1], '').trim()
      addTx(year, mm, dd, desc || 'Transação', vals[0])

    } else if (vals.length === 3) {
      // Three values: possibly [debit, credit, saldo]
      const debit  = parseFloat(vals[0].replace(/\./g, '').replace(',', '.'))
      const credit = parseFloat(vals[1].replace(/\./g, '').replace(',', '.'))
      let txVal: string
      if (debit > 0 && credit === 0) {
        txVal = vals[0]          // expense
      } else if (credit > 0 && debit === 0) {
        txVal = `-${vals[1]}`    // income
      } else {
        txVal = vals[0]
      }
      const desc = rest
        .replace(vals[0], '').replace(vals[1], '').replace(vals[2], '').trim()
      addTx(year, mm, dd, desc || 'Transação', txVal)

    } else {
      // 4+ values: take first (most likely the transaction amount)
      const desc = rest.replace(vals[0], '').trim()
      addTx(year, mm, dd, desc || 'Transação', vals[0])
    }
  }

  // ── Strategy 2: Multi-line grouping ─────────────────────────────────────────
  // When pdf-parse puts each column on its own line:
  // "01/03/2025\nPAGAMENTO PIX\n-150,00\n1.500,00"
  if (results.length < 2) {
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const mFull = line.match(DATE_FULL)
      if (mFull) {
        const [, dd, mm, year] = mFull

        // Scan next up-to-4 lines for description + value
        const chunk = lines.slice(i, i + 5)
        let desc = ''
        let txVal = ''

        for (const cl of chunk.slice(1)) {
          if (DATE_FULL.test(cl)) break  // hit next transaction
          const vals = cl.match(VALUE_RE)
          if (vals && !txVal) {
            txVal = vals[0]
          } else if (!vals && !desc) {
            desc = cl.trim()
          }
        }

        if (txVal) addTx(year, mm, dd, desc || 'Transação', txVal)
      }
      i++
    }
  }

  // ── Strategy 3: Global permissive scan ──────────────────────────────────────
  if (results.length < 2) {
    const globalPat = /(\d{2})\/(\d{2})\/(\d{4})[ \t]+([^\n\r]{3,80}?)[ \t]+([-+]?[\d.]+,\d{2})/g
    let m
    while ((m = globalPat.exec(text)) !== null) {
      addTx(m[3], m[2], m[1], m[4], m[5])
    }
  }

  // ── Strategy 4: Last resort — extract ALL date+value pairs from full text ───
  if (results.length < 2) {
    const dates = Array.from(text.matchAll(/(\d{2})\/(\d{2})\/(\d{4})/g))
    const allValues = Array.from(text.matchAll(/[-+]?[\d]{1,3}(?:\.\d{3})*,\d{2}/g))

    for (const d of dates) {
      // Find the first value that appears close after this date in the text
      const dateEnd = d.index! + d[0].length
      const nearby = allValues.filter(v => v.index! > dateEnd && v.index! < dateEnd + 120)
      if (nearby.length > 0) {
        const between = text.slice(dateEnd, nearby[0].index!).trim()
        addTx(d[3], d[2], d[1], between || 'Transação', nearby[0][0])
      }
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
