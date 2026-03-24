export interface ParsedPix {
  value: number | null
  recipient: string | null
  date: string | null      // YYYY-MM-DD
  time: string | null      // HH:MM
  description: string
  rawText: string
}

// Envia o PDF para a API route server-side (Node.js) que usa pdfjs-dist para extrair o texto
export async function extractTextFromPDF(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/parse-pix', { method: 'POST', body: formData })
  const json = await res.json()

  if (!res.ok) throw new Error(json.error ?? `Erro HTTP ${res.status}`)
  return json.text as string
}

// Parseia o texto extraído do comprovante Pix
export function parsePixFromText(text: string): ParsedPix {
  const raw = text

  // ── Valor ──────────────────────────────────────────────────────────────────
  // Formatos comuns: "R$ 150,00" | "Valor: 150,00" | "R$150,00"
  let value: number | null = null
  const valuePatterns = [
    /(?:Valor\s*(?:da\s*(?:transfer[eê]ncia|opera[cç][aã]o|transa[cç][aã]o))?)\s*[:\-]?\s*R?\$?\s*([\d.]+,\d{2})/i,
    /R\$\s*([\d.]+,\d{2})/,
    /(?:Total|Quantia)\s*[:\-]?\s*([\d.]+,\d{2})/i,
  ]
  for (const p of valuePatterns) {
    const m = text.match(p)
    if (m) {
      value = parseFloat(m[1].replace(/\./g, '').replace(',', '.'))
      break
    }
  }

  // ── Destinatário ───────────────────────────────────────────────────────────
  // Formatos: "Favorecido:", "Destinatário:", "Recebedor:", "Para:", "Nome:"
  let recipient: string | null = null
  const recipientPatterns = [
    /(?:Favorecido|Destinat[aá]rio|Recebedor|Para|Nome\s+do\s+(?:recebedor|destinat[aá]rio|favorecido))\s*[:\-]\s*([^\n\r]+)/i,
    /(?:Nome)\s*[:\-]\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ][^\n\r]{3,50})/,
  ]
  for (const p of recipientPatterns) {
    const m = text.match(p)
    if (m) {
      recipient = m[1].trim().replace(/\s{2,}/g, ' ')
      // Remove trailing noise (CPF, banco etc.)
      recipient = recipient.split(/\s{3,}|CPF|CNPJ|Banco|Inst\./i)[0].trim()
      if (recipient.length > 2) break
    }
  }

  // ── Data e Hora ─────────────────────────────────────────────────────────────
  // Formatos: "DD/MM/YYYY HH:MM" | "YYYY-MM-DD" | "DD de mês de YYYY"
  let date: string | null = null
  let time: string | null = null

  const dtPattern = /(\d{2})\/(\d{2})\/(\d{4})\s+(?:[àa]s?\s+)?(\d{2}):(\d{2})/i
  const dtMatch = text.match(dtPattern)
  if (dtMatch) {
    date = `${dtMatch[3]}-${dtMatch[2]}-${dtMatch[1]}`
    time = `${dtMatch[4]}:${dtMatch[5]}`
  } else {
    const dateOnly = /(\d{2})\/(\d{2})\/(\d{4})/
    const dm = text.match(dateOnly)
    if (dm) date = `${dm[3]}-${dm[2]}-${dm[1]}`

    const timeOnly = /(\d{2}):(\d{2})(?::\d{2})?/
    const tm = text.match(timeOnly)
    if (tm) time = `${tm[1]}:${tm[2]}`
  }

  // ── Descrição gerada ───────────────────────────────────────────────────────
  const description = recipient
    ? `Pix para ${recipient}`
    : 'Transferência Pix'

  return { value, recipient, date, time, description, rawText: raw }
}
