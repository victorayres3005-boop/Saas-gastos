import type { CategoryKey } from './categories'

// ─── Normalização ─────────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[*|_\-\.\/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTxPrefix(s: string): string {
  return s
    // ── Itaú PAY (maquininha/link de pagamento) ──────────────────────────────
    .replace(/^pay\s+/i, '')
    // ── PIX ──────────────────────────────────────────────────────────────────
    .replace(/^pix\s+(transf\.?|transferencia|enviado|recebido|para|de|cred\.?|deb\.?|qrs?)\s*/i, '')
    .replace(/^dev\s+pix\s+/i, '')
    // ── Compra (cartão) ──────────────────────────────────────────────────────
    .replace(/^compra\s+(no\s+)?(debito|credito|deb\.?|cred\.?|cartao|cart\.?)(\s+\d{2}\/\d{2})?\s*/i, '')
    // ── TED / DOC / TEF ──────────────────────────────────────────────────────
    .replace(/^(ted|doc|tef)\s+(enviado|recebido|credit\.?|debit\.?)?\s*/i, '')
    // ── Saque / Depósito ─────────────────────────────────────────────────────
    .replace(/^saque\s+(caixa|eletronico|atm|24h|banco)?\s*/i, '')
    .replace(/^deposito\s+(em\s+conta|bancario)?\s*/i, '')
    // ── Débito automático ────────────────────────────────────────────────────
    .replace(/^deb(ito)?\s+aut(omatico|\.?)?\s*/i, '')
    // ── Pagamento ────────────────────────────────────────────────────────────
    .replace(/^pag(amento|to|t\.?)\s+(boleto|fatura|carne|de\s+|do\s+)?\s*/i, '')
    // ── Transferência ────────────────────────────────────────────────────────
    .replace(/^transf(erencia|\.?)?\s+(de\s+|para\s+|rec\.?|env\.?)?\s*/i, '')
    // ── Crédito / Débito em conta ────────────────────────────────────────────
    .replace(/^(credito|debito)\s+(em\s+conta|conta\s+corrente|cc)?\s*/i, '')
    // ── Recebimento / Lançamento ─────────────────────────────────────────────
    .replace(/^receb(imento|\.?)?\s+(de\s+|credit\.?)?\s*/i, '')
    .replace(/^lancamento\s+(credito|debito)\s*/i, '')
    // ── Resgate / Rendimento (mantém o substantivo para as regras baterem) ──
    // NÃO remove "resgate" ou "rend" — são usados nas regras de invest/dividend
    // ── Remove data no final: DD/MM ou DD/MM/YYYY ────────────────────────────
    .replace(/\s+\d{2}\/\d{2}(\/\d{4})?\s*$/, '')
    // ── Remove fragmentos sobrando no início ─────────────────────────────────
    .replace(/^[-–\s]+/, '')
    .trim()
}

function prep(raw: string): string {
  return stripTxPrefix(normalize(raw))
}

// ─── Regras ───────────────────────────────────────────────────────────────────
// Testadas no texto NORMALIZADO (sem acentos, minúsculo, sem prefixo de tx).
// Padrões cobrem tanto nomes completos quanto truncados (5-6 chars do Itaú PAY).

type Rule = [CategoryKey, RegExp]

const RULES: Rule[] = [

  // ══ RECEITAS ════════════════════════════════════════════════════════════════

  ['salary',
    /\b(salario|holerite|folha\s+(de\s+)?pag|proventos|vencimento|remuneracao|pgto\s+sal|credit[oa]\s+sal|13[o°]?\s*(sal)?|decimo\s+terceiro|ferias|rescisao|verbas?\s+rescis|fgts|adiant\w*\s+(sal|de\s+sal))\b/i],

  ['freelance',
    /\b(freelance|autonomo|honor(arios?)?|nota\s+fiscal|nf(e|se)?\s*\d|mei\s+|pgto\s+(serv|projeto)|prestacao\s+serv|receb\s+(serv|proj))\b/i],

  // Rendimentos financeiros: CDB resgate, rendimento de aplicação, dividendos
  ['dividend',
    /\b(dividend[oa]|jcp|juros\s+cap|rendimento\s+(cdb|lci|lca|lc|fii|fi|fundo|poupan|tesouro|invest|aplic)|resgat[eo]\s+(cdb|lci|lca|lc|fundo|invest|aplica|cofrinho)|rend\s+(pago|cred|aplic)|aplic\s+aut|rentabilidade|ir\s+sobre\s+rend|creditado\s+rend)\b/i],

  ['rent_income',
    /\b(aluguel\s+(recebido|cred|credit)|locacao\s+recebida|repasse\s+aluguel|renda\s+aluguel)\b/i],

  // ══ ALIMENTAÇÃO ════════════════════════════════════════════════════════════

  // Delivery
  ['food', /\b(ifood|ifoode|rappi|ubereats|uber\s*eat|james\s*(del|app)?|ze\s*del(ivery)?|zedel|aiqfome)\b/i],

  // Fast food — nomes completos e truncados (PAY MCDON, PAY BURGE, PAY SUBWA)
  ['food', /\b(mcdon(alds?|ald)?|mc\s*lan|burge(r|rs|r\s*king)?|b\s*king|subwa(y)?|kfc|bob'?s|bobs|habib'?s?|domino'?s?|pizza\s*hut|giraffas|madero|outback|applebee|starbuck|five\s*guys|taco\s*bell|popeye)\b/i],

  // Açaí — nome curto mas completo (PAY ACAI)
  ['food', /\b(acai|açai|acaí|bowleria)\b/i],

  // Sanduíche / Empada / similares truncados (PAY SANDU, PAY EMPAD)
  ['food', /\b(sandu(iche|icheria)?|sanwi|empad(a|ao|aria)?|esfih|coxinh|pastel|tapioc|crepe\s+|churros?)\b/i],

  // Padaria / Empório / Bar (PAY PADAR, PAY EMPOR, PAY BAR P, PAY BAR )
  ['food', /\b(padar(ia|inha)?|boulangerie|confeitaria|empor(io|ium|i)?|mercearia|quitanda|verdureiro|hortifruti|sacolao|acouguei?|frigori)\b/i],
  ['food', /\b(bar\s+[a-z]|bar\s*e\s*(rest|lanch)|lanchonete|lanch\s+|bistr[oô]|cantina\s+|refeitorio|marmita|marmitex|quentinha)\b/i],

  // Supermercados — completos e abreviados
  ['food', /\b(supermer(cado)?|superm\s|mercad(inho|ao|o)?|hipermercado|atacadao|assai|pao\s*de\s*acucar|carrefour|carref|walmart|makro|condor|hortifruti|extrasuper|minimercado|mini\s*merc)\b/i],

  // Restaurantes e cafeterias
  ['food', /\b(restaurante|rest\s+[a-z]|pizzaria|churrascaria|sushi|japanese|yakissoba|galinhada|cafeteria|cafe\s+[a-z]|sorveteria|sorvete|doceria|brigadeiro)\b/i],

  // Bebidas e conveniência
  ['food', /\b(cervejaria|distribuidora\s+beb|adega|ambev|heineken|conveniencia|7\s*eleven|am\s*pm)\b/i],

  // ══ TRANSPORTE ══════════════════════════════════════════════════════════════

  ['transport', /\b(uber\s+[a-z]|uber\*|99\s*(pop|taxi|moto|app)|indriver|cabify|buser|blablacar|taxi|taxista)\b/i],

  // Postos — abreviados e por bandeira (PAY AUTO pode ser auto posto)
  ['transport', /\b(auto\s*posto|posto\s+(de\s+)?gas|posto\s*(shell|ipiranga|petrobras|br\s*|esso|texaco|raizen|ale)|gasolina|combust|etanol|alcool\s+veic|diesel|arla|br\s+distribui|ipiranga\s+|shell\s+|vibra\s+|raizen)\b/i],

  ['transport', /\b(pedagio|sem\s*parar|veloe|conectcar|taggy|autoban|ecorodovias)\b/i],
  ['transport', /\b(estacion(amento)?|parking|estapark|multipark)\b/i],
  ['transport', /\b(metro|cptm|sptrans|bilhete\s+unico|cartao\s+bom|brt|vlt|trem\s+urb|onibus|passagem\s+(metro|onib|trem|ferrov))\b/i],
  ['transport', /\b(latam|gol\s+(ling|air)|azul\s+(bras|air)|tam\s+|passagem\s+aere|voo\s+|aeroporto)\b/i],
  ['transport', /\b(localiza|movida|unidas|hertz|avis|aluguel\s+(de\s+)?carr|locacao\s+(de\s+)?veic)\b/i],
  ['transport', /\b(ipva|licencia(mento)?\s+veic|dpvat|vistoria\s+(veic|auto)|seguro\s+(auto|veic|carro|moto))\b/i],

  // ══ MORADIA ═════════════════════════════════════════════════════════════════

  ['housing', /\b(sabesp|copasa|cedae|caesb|cagece|embasa|sanepar|caern|compesa|aguas\s+(de\s+)?(rio|brasil|parana|goias|manaus)|saneago|casan|corsan)\b/i],
  ['housing', /\b(enel|cemig|cpfl|coelba|coelce|cosern|celpe|celesc|edp|elektro|equatorial|energisa|ampla|light\s+s|eletropaulo|aes\s+sul)\b/i],
  ['housing', /\b(comgas|com\s*gas|ceg\s+|gas\s+natural|gas\s+canaliz|supergas|liquigas|ultragaz)\b/i],
  ['housing', /\b(claro\s+(res|fixa|banda|fibra)|vivo\s+(fixa|res|fibra|banda)|net\s+(virtua|banda|res)|oi\s+(fibra|fixa|res)|algar\s+|brisanet|desktop\s+internet)\b/i],
  ['housing', /\b(aluguel|condominio|cond\s+|taxa\s+cond|adm\s+cond|iptu|imposto\s+predial|arrendamento)\b/i],
  ['housing', /\b(financiamento\s+im[oó]v|parcela\s+im[oó]v|cef\s+hab|caixa\s+hab|prestacao\s+im[oó]v|minha\s+casa)\b/i],
  ['housing', /\b(leroy\s+merlin|telha\s+norte|sodimac|dicico|construcao|reforma\s+|empreitei)\b/i],

  // ══ SAÚDE ═══════════════════════════════════════════════════════════════════

  // Farmácias — nome completo e truncado (PAY DROGA)
  ['health', /\b(droga(ria|sil|o|l|raia)?|farm(acia|cias)?|ultrafarma|pague\s*menos|panvel|nissei|onofre|pacheco|extrafarma|net\s*farma)\b/i],

  ['health', /\b(unimed|amil|sulamerica\s+sau|bradesco\s+sau|notre\s+dame|hapvida|gndi|prevent\s+senior|mensalidade\s+plano|plano\s+(de\s+)?saude|convenio\s+med)\b/i],
  ['health', /\b(einstein|fleury|dasa|sirio\s+liban|santa\s+casa|hospital|clinica|policlinica|consultorio|laboratorio|exame|radiologia|ultrassom|tomografia)\b/i],
  ['health', /\b(dentista|odonto|ortodontia|implante\s+dent|odontologo|sorridents|odontoprev)\b/i],
  ['health', /\b(smartfit|smart\s*fit|bluefit|bodytech|cia\s+athletica|academia|crossfit|pilates|yoga|personal\s+train|bio\s+ritmo|totalpass)\b/i],
  ['health', /\b(remedio|medicamento|vitamina|suplemento|whey|creatina|probiotico|collagen|omega\s*3)\b/i],

  // ══ EDUCAÇÃO ════════════════════════════════════════════════════════════════

  ['education', /\b(escola|colegio|universidade|faculdade|mensalidade\s+(esc|fac|col)|anuidade\s+(esc|acad)|matricula)\b/i],
  ['education', /\b(curso|capacitacao|treinamento|workshop|mentoria|aula\s+(de|do)|coaching|pos\s+(grad|lato)|mba)\b/i],
  ['education', /\b(udemy|alura|coursera|hotmart|eduzz|kiwify|skillshare|domestika|babbel|duolingo|descomplica|gran\s+curso)\b/i],
  ['education', /\b(livraria|saraiva|cultura\s+liv|fnac|travessa|amazon\s+liv|material\s+esc|papelaria)\b/i],

  // ══ LAZER ═══════════════════════════════════════════════════════════════════

  ['leisure', /\b(cinema|cinemark|cinepolis|uci|kinoplex|ingressos?\s+|teatro|opera|show\s+|festival|concerto|ticketmaster|sympla|eventbrite|blueticket)\b/i],
  ['leisure', /\b(hotel|pousada|hostel|airbnb|booking|trivago|decolar|hospedagem|resort|expedia)\b/i],
  ['leisure', /\b(zara|h\s*&\s*m|c\s*&\s*a\s+|renner|riachuelo|marisa|hering|leader|forever\s*21|shein|amaro|farm\s+|animale|arezzo|schutz|melissa|havaianas|calcado|sapato|sapataria|centauro|netshoes)\b/i],
  ['leisure', /\b(shopping|mall\s+|americanas|casas\s+bahia|magazine\s+luiza|magalu|ponto\s+frio|fast\s+shop|ricardo\s+elet)\b/i],
  ['leisure', /\b(salao\s+(de\s+)?beleza|cabeleireiro|manicure|pedicure|spa\s+|estetica|barbearia|barbeiro|depilacao)\b/i],
  ['leisure', /\b(steam|playstation|xbox|nintendo|nuuvem|epic\s+games|riot\s+games|blizzard|gaming|google\s+play|app\s+store)\b/i],
  ['leisure', /\b(nike|adidas|puma|mizuno|under\s+armour|oakley|calvinklein|tommy\s+hilfiger)\b/i],

  // ══ ASSINATURAS ════════════════════════════════════════════════════════════

  ['saas', /\b(netflix|spotify|amazon\s*(prime|music)|disney(\+|plus)?|hbo\s*(max|go)|apple\s*(tv|music|arcade|one)|youtube\s*(premium|music)|paramount(\+|plus)?|globoplay|telecine|deezer|tidal|crunchyroll|mubi)\b/i],
  ['saas', /\b(microsoft\s*(365|office)|google\s*(one|workspace)|dropbox|icloud|adobe|canva|figma|notion|slack|zoom\s+(pro|plan)|monday\.com)\b/i],
  ['saas', /\b(tim\s+(black|beta|controle|ult)|vivo\s+(turbo|total|easy|familia)|claro\s+(controle|pos|pre)|oi\s+(pos|total|livre)|plano\s+(celular|movel)|recarga\s+(cel|tim|vivo|claro|oi)|mensalidade\s+cel)\b/i],
  ['saas', /\b(kaspersky|norton|mcafee|bitdefender|nordvpn|expressvpn|antivirus|assinatura\s+|mensalidade\s+(serv|assina)|subscricao)\b/i],
  ['saas', /\b(linkedin\s+prem|chatgpt|openai|midjourney|cursor\s+pro|github\s+pro|vercel|heroku|atlassian)\b/i],

  // ══ INVESTIMENTOS ══════════════════════════════════════════════════════════

  // Resgates e aplicações (PAY RESGATE ou "RESGATE CDB Cofrinhos")
  ['invest', /\b(resgat[eo]\s+(cdb|lci|lca|lc|fundo|invest|aplica|cofrinho|poupan)|aplica[cç][aã]o\s+(em\s+)?(cdb|lci|lca|lc|fi|fii|tesouro|renda\s+fix)|aporte\s+(invest|carteira)|compra\s+(acao|acoes|fii|etf|bdr)|tesouro\s+(selic|ipca|prefixado|direto))\b/i],
  ['invest', /\b(xp\s+(invest|corr)|btg\s+(pact|invest)|rico\s+(invest|corr)|clear\s+(corr|invest)|nuinvest|nu\s+invest|easynvest|inter\s+invest|genial\s+invest|warren|modalmais|avenue)\b/i],
  ['invest', /\b(previdencia\s+(priv|compl|pgbl|vgbl)|pgbl|vgbl|fundo\s+(de\s+)?pens|aporte\s+(prev|pgbl|vgbl))\b/i],
  ['invest', /\b(seguro\s+(de\s+)?vida|seguro\s+(res|predial)|porto\s+seguro|sulamerica\s+seg|tokio\s+mar|mapfre)\b/i],
]

// ─── Função principal ─────────────────────────────────────────────────────────
// Testa TODAS as regras independente de isIncome, para que "PAY DROGA" (entrada)
// ainda seja categorizado como "health" mesmo sendo receita.

export function autoCategory(description: string, isIncome: boolean): CategoryKey {
  const norm = prep(description)
  const full = normalize(description) // também testa sem remover prefixo

  for (const [cat, re] of RULES) {
    if (re.test(norm) || re.test(full)) return cat
  }

  return isIncome ? 'other_income' : 'other'
}

// ─── Inferência com histórico (AddTransactionModal) ────────────────────────────

export function inferCategoryFromHistory(
  description: string,
  history: { description: string; category: string }[],
  isIncome = false,
): CategoryKey | null {
  if (description.length < 3) return null
  const lower = description.toLowerCase()

  if (history.length > 0) {
    const exact = history.find(h => h.description.toLowerCase() === lower)
    if (exact) return exact.category as CategoryKey

    const matches = history.filter(h => {
      const hl = h.description.toLowerCase()
      return hl.includes(lower) || lower.includes(hl.slice(0, Math.max(4, Math.floor(hl.length * 0.6))))
    })
    if (matches.length > 0) {
      const votes = new Map<string, number>()
      matches.forEach(h => votes.set(h.category, (votes.get(h.category) || 0) + 1))
      return Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0][0] as CategoryKey
    }
  }

  const byKeyword = autoCategory(description, isIncome)
  if (byKeyword === 'other' || byKeyword === 'other_income') return null
  return byKeyword
}
