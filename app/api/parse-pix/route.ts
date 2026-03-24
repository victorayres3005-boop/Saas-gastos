import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import path from 'path'
import { pathToFileURL } from 'url'

export async function POST(req: NextRequest) {
  // Verifica autenticação
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })

    const buffer = await file.arrayBuffer()

    // Importa pdfjs-dist legacy — funciona no Node.js sem problemas de browser
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist/legacy/build/pdf.mjs')

    // Aponta o worker via path absoluto — evita o webpack interceptar new URL(...)
    const workerPath = path.resolve(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs')
    GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href

    const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise

    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      text += content.items.map((item: any) => item.str ?? '').join(' ') + '\n'
    }

    return NextResponse.json({ text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
