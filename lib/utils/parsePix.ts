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

// ─── Main PDF entry: extract text (server) then parse (client) ───────────────

export async function parsePDFFile(file: File): Promise<ParseResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/parse-pix', { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? `Erro HTTP ${res.status}`)
  const text = json.text as string
  if (!text) throw new Error('Resposta inesperada do servidor')
  return parseFromText(text)
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

  const SKIP_LINE = /^(data\b|descri[cç]|hist[oó]rico\b|valor\b|saldo\b|d[eé]bito\b|cr[eé]dito\b|lan[cç]amento\b|movimenta|per[ií]odo\b|extrato\b|banco\b|ag[eê]ncia\b|conta\b|nome\b|cpf\b|cnpj\b|total\b|totaliz|resumo\b|saldo\s+anterior|saldo\s+final|saldo\s+do\s+dia|abertura\b|encerramento\b|n[uú]mero\b|endere[cç]|titular\b|emiss[aã]o\b|vencimento\b|fatura\b)/i

  function parseVal(raw: string): number {
    const clean = raw.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
    return Math.abs(parseFloat(clean))
  }

  const SKIP_DESC = /^(saldo\s+(?:anterior|final|do\s+dia|em\s+\d|devedor|credor|dispon[ií]vel|atual)|saldo\s*:)/i

  function addTx(year: string, mm: string, dd: string, rawDesc: string, rawVal: string, isIncomeOverride?: boolean, allowDuplicate?: boolean) {
    const date = `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`

    const isNeg = rawVal.trim().startsWith('-')
    const absVal = parseVal(rawVal)
    if (isNaN(absVal) || absVal === 0 || absVal > 500000) return

    const value = isNeg ? -absVal : absVal
    const description = rawDesc
      .trim()
      .replace(/\s{2,}/g, ' ')
      .replace(/[|\\]/g, '')
      .replace(/^\s*[-–]+\s*/, '')
      // Remove trailing fragments that look like account/agency numbers
      .replace(/\s+\d{4,}[-/]?\d*\s*$/, '')
      .trim()
    if (description.length < 2) return

    // Skip balance/summary lines that slipped past SKIP_LINE
    if (SKIP_DESC.test(description)) return

    const key = `${date}|${absVal.toFixed(2)}|${description.slice(0, 15)}`
    if (!allowDuplicate && seen.has(key)) return
    seen.add(key)
    // positive = credit (income), negative = debit (expense) — Brazilian bank convention
    const isIncome = isIncomeOverride !== undefined ? isIncomeOverride : !isNeg
    results.push({ date, description, value, isIncome, selected: true })
  }

  // Pick the transaction value from a pair [v0, v1] where one is likely the saldo
  function pickTxFromPair(v0str: string, v1str: string): string | null {
    // Signed value is almost certainly the transaction, not the balance
    const v0signed = /^[-+]/.test(v0str.trim())
    const v1signed = /^[-+]/.test(v1str.trim())
    if (v0signed && !v1signed) return v0str
    if (v1signed && !v0signed) return v1str

    const v0 = parseVal(v0str)
    const v1 = parseVal(v1str)
    if (isNaN(v0) || isNaN(v1)) return v0str
    const ratio = Math.max(v0, v1) / (Math.min(v0, v1) || 0.01)
    // Both values similar magnitude — could be balance columns; treat first as transaction
    if (ratio < 1.8 && v0 > 300 && v1 > 300) return v0str
    // First is much larger than second → first is the balance, second is transaction
    if (v0 > v1 * 3) return v1str
    // Otherwise first is the transaction (most common: [tx, saldo])
    return v0str
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
      addTx(year, mm, dd, desc || 'Transação', vals[0], undefined, true)

    } else if (vals.length === 2) {
      // Two values: usually [transaction, saldo] but sometimes [saldo_before, saldo_after]
      const txVal = pickTxFromPair(vals[0], vals[1])
      if (!txVal) continue  // both values are likely balances — skip line
      const desc = rest.replace(vals[0], '').replace(vals[1], '').trim()
      addTx(year, mm, dd, desc || 'Transação', txVal, undefined, true)

    } else if (vals.length === 3) {
      // Three values: possibly [debit, credit, saldo]
      const debit  = parseVal(vals[0])
      const credit = parseVal(vals[1])
      const desc = rest
        .replace(vals[0], '').replace(vals[1], '').replace(vals[2], '').trim()
      if (debit > 0 && credit === 0) {
        addTx(year, mm, dd, desc || 'Transação', vals[0], false, true)   // expense
      } else if (credit > 0 && debit === 0) {
        addTx(year, mm, dd, desc || 'Transação', vals[1], true, true)    // income
      } else {
        // Both columns populated → use pickTxFromPair on first two
        const txVal = pickTxFromPair(vals[0], vals[1]) ?? vals[0]
        addTx(year, mm, dd, desc || 'Transação', txVal, undefined, true)
      }

    } else {
      // 4+ values: pick the smallest non-zero value (most likely the transaction, not a running balance)
      const numVals = vals.map(v => ({ raw: v, n: parseVal(v) })).filter(v => v.n > 0)
      const smallest = numVals.sort((a, b) => a.n - b.n)[0]
      if (!smallest) continue
      const desc = rest.replace(smallest.raw, '').trim()
      addTx(year, mm, dd, desc || 'Transação', smallest.raw, undefined, true)
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

  // ── Post-processing: remove statistical outliers (balance columns slipping through) ─
  if (results.length >= 4) {
    const absVals = results.map(r => Math.abs(r.value)).sort((a, b) => a - b)
    const p75 = absVals[Math.floor(absVals.length * 0.75)]
    const ceiling = Math.max(p75 * 8, 5000)  // never remove < 5000 threshold
    const cleaned = results.filter(r => Math.abs(r.value) <= ceiling)
    // Only apply if it actually removed something and we keep at least half
    if (cleaned.length >= results.length / 2 && cleaned.length < results.length) {
      return cleaned.sort((a, b) => a.date.localeCompare(b.date))
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
