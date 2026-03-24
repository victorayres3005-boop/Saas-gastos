import { getBankById } from '@/lib/utils/banks'

type ImageEntry = { src: string; fit: 'cover' | 'contain'; bg?: string }

// fit: 'cover'   → logo preenche o container (tem fundo próprio)
// fit: 'contain' → logo centralizada com padding (fundo branco ou de marca)
const BANK_IMAGES: Record<string, ImageEntry> = {
  // Fundo cheio (logo já tem background de cor da marca)
  nubank:      { src: '/banks/nubank.png',      fit: 'cover' },
  pagbank:     { src: '/banks/pagbank.png',     fit: 'cover' },
  itau:        { src: '/banks/itau.jpg',        fit: 'cover' },
  caixa:       { src: '/banks/caixa.jpg',       fit: 'cover' },
  bb:          { src: '/banks/bb.jpg',          fit: 'cover' },
  rico:        { src: '/banks/rico.jpg',        fit: 'cover' },
  flash:       { src: '/banks/flash.png',       fit: 'cover' },
  // NOTA: o arquivo bradesco.png contém o logo do Santander (arquivo com nome errado)
  santander:   { src: '/banks/bradesco.png',    fit: 'cover' },

  // Logo sobre fundo branco (centralizada com padding)
  inter:       { src: '/banks/inter.png',       fit: 'contain', bg: '#FFFFFF' },
  neon:        { src: '/banks/neon.png',        fit: 'contain', bg: '#FFFFFF' },
  will:        { src: '/banks/will.png',        fit: 'contain', bg: '#FFFFFF' },
  mercadopago: { src: '/banks/mercadopago.png', fit: 'contain', bg: '#FFFFFF' },
  btg:         { src: '/banks/btg.png',         fit: 'contain', bg: '#FFFFFF' },
  sicoob:      { src: '/banks/sicoob.png',      fit: 'contain', bg: '#FFFFFF' },
  ticket:      { src: '/banks/ticket.png',      fit: 'contain', bg: '#FFFFFF' },
  vr:          { src: '/banks/vr.jpg',          fit: 'contain', bg: '#FFFFFF' },
  alelo:       { src: '/banks/alelo.png',       fit: 'contain', bg: '#FFFFFF' },
  c6bank:      { src: '/banks/c6bank.png',      fit: 'contain', bg: '#FFFFFF' },
  picpay:      { src: '/banks/picpay.png',      fit: 'contain', bg: '#FFFFFF' },
  sodexo:      { src: '/banks/sodexo.jpg',      fit: 'contain', bg: '#FFFFFF' },
  sicredi:     { src: '/banks/sicredi.webp',    fit: 'contain', bg: '#FFFFFF' },
  xp:          { src: '/banks/xp.png',          fit: 'contain', bg: '#000000' },
}

interface BankLogoProps {
  bankId?: string | null
  size?: number
  className?: string
}

export function BankLogo({ bankId, size = 40, className = '' }: BankLogoProps) {
  const bank = getBankById(bankId)

  if (!bank) {
    return (
      <div
        className={`rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size, backgroundColor: '#F4F4F5' }}
      >
        <span style={{ fontSize: size * 0.3, fontWeight: 700, color: '#9CA3AF' }}>?</span>
      </div>
    )
  }

  const entry = BANK_IMAGES[bank.id]

  if (entry) {
    const bg = entry.bg ?? bank.bg
    const padding = entry.fit === 'contain' ? Math.round(size * 0.12) : 0

    return (
      <div
        className={`rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
        style={{ width: size, height: size, backgroundColor: bg, padding }}
        title={bank.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.src}
          alt={bank.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: entry.fit,
            display: 'block',
          }}
        />
      </div>
    )
  }

  // Fallback: sigla colorida
  return (
    <div
      className={`rounded-xl flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, backgroundColor: bank.bg }}
      title={bank.name}
    >
      <span
        style={{
          fontSize: size * 0.3,
          fontWeight: 800,
          color: bank.text,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {bank.abbr}
      </span>
    </div>
  )
}
