import type { CategoryKey } from './categories'

export interface ParsedRow {
  description: string
  value: number
  category: CategoryKey
  date: string
}

export type BankFormat = 'nubank' | 'inter' | 'bradesco' | 'itau' | 'c6' | 'generic'

// ─── Detection ───────────────────────────────────────────────────────────────

export function detectBankFormat(text: string): BankFormat {
  const firstLines = text.split('\n').slice(0, 3).join('\n').toLowerCase()

  if (firstLines.includes('título') && firstLines.includes('categoria') && !firstLines.includes(';')) return 'nubank'
  if (firstLines.includes('lançamento') && firstLines.includes('histórico') && firstLines.includes(';')) return 'inter'
  if (firstLines.includes('historico') && firstLines.includes('docto') && firstLines.includes(';')) return 'bradesco'
  if (firstLines.includes('lançamentos') && firstLines.includes('débito') && firstLines.includes(';')) return 'itau'
  if (firstLines.includes('c6') || (firstLines.includes('estabelecimento') && firstLines.includes(';'))) return 'c6'
  return 'generic'
}

export const BANK_LABELS: Record<BankFormat, string> = {
  nubank: 'Nubank',
  inter: 'Banco Inter',
  bradesco: 'Bradesco',
  itau: 'Itaú',
  c6: 'C6 Bank',
  generic: 'Formato genérico',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseBRDate(s: string): string {
  // DD/MM/YYYY → YYYY-MM-DD
  const m = s.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) return s.trim()
  return new Date().toISOString().split('T')[0]
}

function parseBRValue(s: string): number {
  // Remove spaces and currency symbols, handle both "1.234,56" and "1234.56"
  const cleaned = s.replace(/[R$\s]/g, '').trim()
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // "1.234,56" format
    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))
  } else if (cleaned.includes(',')) {
    // "1234,56" format
    return parseFloat(cleaned.replace(',', '.'))
  }
  return parseFloat(cleaned) || 0
}

function splitCSVLine(line: string, sep = ','): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === sep && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = '' }
    else { current += char }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function guessCategory(description: string, isIncome: boolean): CategoryKey {
  if (isIncome) {
    if (/sal[aá]rio|holerite|pagamento\s+sal/i.test(description)) return 'salary'
    if (/freelance|presta[çc][aã]o\s+de\s+servi[çc]/i.test(description)) return 'freelance'
    if (/rendimento|dividendo|juros|cdb|lci|lca|tesouro/i.test(description)) return 'dividend'
    return 'other_income'
  }
  if (/ifood|delivery|restaurante|lanche|pizza|mc\s*don|burger|sushi|almo[çc]o|padaria|supermercado|mercado|hortifruti/i.test(description)) return 'food'
  if (/uber|99\s*app|t[aá]xi|gasolina|posto|combust[ií]vel|estacion|ped[aá]gio|[oô]nibus|metr[oô]/i.test(description)) return 'transport'
  if (/netflix|spotify|amazon\s*prime|disney|youtube\s*premium|assinatura|apple/i.test(description)) return 'saas'
  if (/farm[aá]cia|m[eé]dico|sa[uú]de|hospital|consulta|rem[eé]dio|plano\s+sa[uú]de|odonto/i.test(description)) return 'health'
  if (/academia|palestra|curso|educa[çc][aã]o|escola|universidade/i.test(description)) return 'education'
  if (/aluguel|condom[ií]nio|iptu|financiamento|energia|luz\s+el[eé]|[aá]gua\s+e\s+esgoto/i.test(description)) return 'housing'
  if (/investimento|cdb|lci|lca|tesouro|a[çc][aã]o|fundo/i.test(description)) return 'invest'
  return 'other'
}

// ─── Nubank (cartão de crédito) ───────────────────────────────────────────────
// Format: Data,Categoria,Título,Valor
// Date: YYYY-MM-DD, comma separated, positive = expense, negative = estorno

const NUBANK_CAT_MAP: Record<string, CategoryKey> = {
  'restaurantes': 'food', 'alimentação': 'food', 'supermercados': 'food', 'padaria': 'food',
  'transporte': 'transport', 'uber': 'transport', 'posto': 'transport',
  'saúde': 'health', 'farmácia': 'health', 'médico': 'health',
  'educação': 'education', 'cursos': 'education',
  'lazer': 'leisure', 'entretenimento': 'leisure', 'viagem': 'leisure',
  'serviços': 'saas', 'assinaturas': 'saas', 'streaming': 'saas',
  'moradia': 'housing', 'casa': 'housing',
  'vestuário': 'leisure', 'eletrônicos': 'other', 'outros': 'other',
}

function mapNubankCategory(nuCat: string): CategoryKey {
  const lower = nuCat.toLowerCase().trim()
  for (const [key, cat] of Object.entries(NUBANK_CAT_MAP)) {
    if (lower.includes(key)) return cat
  }
  return 'other'
}

export function parseNubank(text: string): ParsedRow[] {
  const lines = text.trim().split('\n')
  // Find data start (skip header)
  const dataLines = lines.filter(l => /^\d{4}-\d{2}-\d{2}/.test(l.trim()))

  return dataLines.map(line => {
    const [dateRaw, nuCategory, title, amountRaw] = splitCSVLine(line)
    const value = parseBRValue(amountRaw)
    if (isNaN(value) || value <= 0) return null // skip credits/refunds
    return {
      date: dateRaw.trim(),
      description: title.trim(),
      category: mapNubankCategory(nuCategory),
      value,
    }
  }).filter(Boolean) as ParsedRow[]
}

// ─── Inter (extrato conta corrente) ─────────────────────────────────────────
// Format: Data;Lançamento;Agência/Código;Histórico;Valor;Saldo
// Date: DD/MM/YYYY, semicolon, positive = credit (income), negative = debit (expense)

export function parseInter(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').slice(1)
  return lines.map(line => {
    const cols = splitCSVLine(line, ';')
    if (cols.length < 5) return null
    const [dateRaw, lancamento, , historico, amountRaw] = cols
    const rawVal = parseBRValue(amountRaw)
    if (isNaN(rawVal) || rawVal === 0) return null
    const isIncome = rawVal > 0
    const value = Math.abs(rawVal)
    const description = (historico?.trim() || lancamento?.trim() || 'Inter')
    return {
      date: parseBRDate(dateRaw),
      description,
      category: isIncome ? guessCategory(description, true) : guessCategory(description, false),
      value: isIncome ? -value : value,
    }
  }).filter(Boolean) as ParsedRow[]
}

// ─── Bradesco (extrato) ──────────────────────────────────────────────────────
// Format: Data;Histórico;Docto.;Crédito;Débito;Saldo
// Dates: DD/MM/YYYY, credit column = income, debit column = expense

export function parseBradesco(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').slice(1)
  return lines.map(line => {
    const cols = splitCSVLine(line, ';')
    if (cols.length < 5) return null
    const [dateRaw, historico, , creditRaw, debitRaw] = cols
    const credit = parseBRValue(creditRaw || '0')
    const debit  = parseBRValue(debitRaw  || '0')
    if (credit === 0 && debit === 0) return null
    const isIncome = credit > 0 && debit === 0
    const value = isIncome ? credit : debit
    const description = historico?.trim() || 'Bradesco'
    return {
      date: parseBRDate(dateRaw),
      description,
      category: guessCategory(description, isIncome),
      value: isIncome ? -value : value,
    }
  }).filter(Boolean) as ParsedRow[]
}

// ─── Itaú (extrato) ──────────────────────────────────────────────────────────
// Format: Data;Lançamentos;Valor;Saldo
// Dates: DD/MM/YYYY, negative value = expense, positive = income

export function parseItau(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').slice(1)
  return lines.map(line => {
    const cols = splitCSVLine(line, ';')
    if (cols.length < 3) return null
    const [dateRaw, lancamento, amountRaw] = cols
    const rawVal = parseBRValue(amountRaw)
    if (isNaN(rawVal) || rawVal === 0) return null
    const isIncome = rawVal > 0
    const value = Math.abs(rawVal)
    const description = lancamento?.trim() || 'Itaú'
    return {
      date: parseBRDate(dateRaw),
      description,
      category: guessCategory(description, isIncome),
      value: isIncome ? -value : value,
    }
  }).filter(Boolean) as ParsedRow[]
}

// ─── C6 Bank (fatura) ────────────────────────────────────────────────────────
// Format: Data;Estabelecimento;Valor
// Similar to generic semicolon

export function parseC6(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').slice(1)
  return lines.map(line => {
    const cols = splitCSVLine(line, ';')
    if (cols.length < 3) return null
    const [dateRaw, establishment, amountRaw] = cols
    const value = parseBRValue(amountRaw)
    if (isNaN(value) || value <= 0) return null
    const description = establishment?.trim() || 'C6 Bank'
    return {
      date: parseBRDate(dateRaw),
      description,
      category: guessCategory(description, false),
      value,
    }
  }).filter(Boolean) as ParsedRow[]
}

// ─── Generic (formato da plataforma) ─────────────────────────────────────────
// Format: descrição,valor,categoria,data  (original format of this platform)

const VALID_CATEGORIES = ['food','transport','housing','health','education','leisure','saas','invest','other','salary','freelance','dividend','rent_income','other_income']

export function parseGeneric(text: string): ParsedRow[] {
  const lines = text.trim().split('\n').slice(1)
  return lines.map(line => {
    // Try semicolon first, then comma
    const sep = line.includes(';') ? ';' : ','
    const [description, rawValue, category, date] = splitCSVLine(line, sep)
    const value = parseBRValue(rawValue)
    if (!value || value === 0) return null
    return {
      description: description || 'Importado',
      value: Math.abs(value),
      category: VALID_CATEGORIES.includes(category) ? category as CategoryKey : guessCategory(description, false),
      date: date?.includes('/') ? parseBRDate(date) : (date || new Date().toISOString().split('T')[0]),
    }
  }).filter((r): r is ParsedRow => r !== null && r.value > 0)
}

// ─── Unified entry point ──────────────────────────────────────────────────────

export function parseCSVByBank(text: string, format?: BankFormat): { rows: ParsedRow[]; format: BankFormat } {
  const detected = format ?? detectBankFormat(text)
  let rows: ParsedRow[]

  switch (detected) {
    case 'nubank':   rows = parseNubank(text); break
    case 'inter':    rows = parseInter(text); break
    case 'bradesco': rows = parseBradesco(text); break
    case 'itau':     rows = parseItau(text); break
    case 'c6':       rows = parseC6(text); break
    default:         rows = parseGeneric(text)
  }

  return { rows, format: detected }
}
