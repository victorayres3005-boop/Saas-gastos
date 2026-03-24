export type BankCategory = 'digital' | 'traditional' | 'investment' | 'cooperative' | 'benefits'

export type Bank = {
  id: string
  name: string
  abbr: string
  bg: string
  text: string
  category: BankCategory
}

export const BANK_CATEGORIES: Record<BankCategory, string> = {
  digital:     'Bancos Digitais',
  traditional: 'Bancos Tradicionais',
  investment:  'Bancos de Investimento',
  cooperative: 'Cooperativas de Crédito',
  benefits:    'Benefícios / Vales',
}

export const BANKS: Bank[] = [
  // Digitais
  { id: 'nubank',      name: 'Nubank',         abbr: 'Nu', bg: '#820AD1', text: '#FFFFFF', category: 'digital' },
  { id: 'inter',       name: 'Banco Inter',    abbr: 'In', bg: '#FF7A00', text: '#FFFFFF', category: 'digital' },
  { id: 'c6bank',      name: 'C6 Bank',        abbr: 'C6', bg: '#FFFFFF', text: '#242424', category: 'digital' },
  { id: 'neon',        name: 'Neon',           abbr: 'Ne', bg: '#1CE5BE', text: '#000000', category: 'digital' },
  { id: 'picpay',      name: 'PicPay',         abbr: 'Pp', bg: '#11C76F', text: '#FFFFFF', category: 'digital' },
  { id: 'will',        name: 'Will Bank',      abbr: 'Wl', bg: '#FFDD00', text: '#000000', category: 'digital' },
  { id: 'mercadopago', name: 'Mercado Pago',   abbr: 'Mp', bg: '#009EE3', text: '#FFFFFF', category: 'digital' },
  { id: 'pagbank',     name: 'PagBank',        abbr: 'Pg', bg: '#00A859', text: '#FFFFFF', category: 'digital' },

  // Tradicionais
  { id: 'bradesco',    name: 'Bradesco',            abbr: 'Br', bg: '#CC092F', text: '#FFFFFF', category: 'traditional' },
  { id: 'itau',        name: 'Itaú',                abbr: 'Iú', bg: '#003087', text: '#FFCC00', category: 'traditional' },
  { id: 'santander',   name: 'Santander',           abbr: 'Sa', bg: '#EC0000', text: '#FFFFFF', category: 'traditional' },
  { id: 'caixa',       name: 'Caixa',               abbr: 'Cx', bg: '#0070AF', text: '#FFFFFF', category: 'traditional' },
  { id: 'bb',          name: 'Banco do Brasil',     abbr: 'BB', bg: '#FFCC00', text: '#003087', category: 'traditional' },

  // Investimento
  { id: 'btg',         name: 'BTG Pactual', abbr: 'Bg', bg: '#012060', text: '#FFFFFF', category: 'investment' },
  { id: 'xp',          name: 'XP',          abbr: 'XP', bg: '#000000', text: '#FFFFFF', category: 'investment' },
  { id: 'rico',        name: 'Rico',        abbr: 'Ri', bg: '#00AAFF', text: '#FFFFFF', category: 'investment' },

  // Cooperativas
  { id: 'sicoob',      name: 'Sicoob',  abbr: 'Sb', bg: '#007B40', text: '#FFFFFF', category: 'cooperative' },
  { id: 'sicredi',     name: 'Sicredi', abbr: 'Sc', bg: '#009640', text: '#FFFFFF', category: 'cooperative' },

  // Benefícios
  { id: 'alelo',       name: 'Alelo',   abbr: 'Al', bg: '#E7007E', text: '#FFFFFF', category: 'benefits' },
  { id: 'sodexo',      name: 'Sodexo',  abbr: 'Sd', bg: '#0C52A2', text: '#FFFFFF', category: 'benefits' },
  { id: 'vr',          name: 'VR',      abbr: 'VR', bg: '#ED1C24', text: '#FFFFFF', category: 'benefits' },
  { id: 'ticket',      name: 'Ticket',  abbr: 'Tk', bg: '#F58220', text: '#FFFFFF', category: 'benefits' },
  { id: 'flash',       name: 'Flash',   abbr: 'Fl', bg: '#FF3D8B', text: '#FFFFFF', category: 'benefits' },
]

export function getBankById(id: string | null | undefined): Bank | undefined {
  if (!id) return undefined
  return BANKS.find(b => b.id === id)
}

export function getBanksByCategory(category: BankCategory): Bank[] {
  return BANKS.filter(b => b.category === category)
}
