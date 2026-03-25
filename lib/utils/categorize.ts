import type { CategoryKey } from './categories'

// ─── Rule table ───────────────────────────────────────────────────────────────
// Each rule: [category, regex].  First match wins (order matters).

const EXPENSE_RULES: [CategoryKey, RegExp][] = [
  // ── Alimentação ─────────────────────────────────────────────────────────────
  ['food', /ifood|rappi|uber\s*eat|james|99food|ze[\s_-]?delivery|aiq|yummy/i],
  ['food', /mcdonalds?|mc\s*don|burger\s*king|bk\s+|subway|kfc|bob'?s|habib'?s|pizza\s*hut|domino'?s|giraffas|madero|outback|applebee|chilis/i],
  ['food', /supermercado|mercado|hipermercado|atacad[aã]o|ass[aá]i|mart|carrefour|p[aã]o\s*de\s*a[cç][uú]car|extra\s*|walmart|sams?\s*club|makro|atacarejo|big\s+|condor\s+|copa\s+|hortifruti|sacolão|feira\s+livre/i],
  ['food', /restaurante|lanchonete|lanche|comida|culin[aá]ria|sushi|pizzaria|churrascaria|bar\s+e\s+|bistr[oô]|eataly|padaria|boulangerie|confeitaria|doceria|sorveteria|sorvete/i],
  ['food', /almo[çc]o|janta|caf[eé]\s+(da\s+manh[aã]|expresso)|refeic|refei[çc][aã]o|marmita|quentinha|delivery\s+de\s+comida/i],

  // ── Transporte ───────────────────────────────────────────────────────────────
  ['transport', /uber|99\s*(pop|taxi|moto)|indriver|cabify|buser|blablacar|taxi|t[aá]xi/i],
  ['transport', /gasolina|combust[ií]vel|etanol|diesel|posto\s+(de\s+)?gasolina|posto\s+shell|posto\s+ipiranga|posto\s+petrobras|br\s+distribui|auto\s+posto|raizen|vibra/i],
  ['transport', /ped[aá]gio|autoban|cart[aã]o\s+sem\s+parar|veloe|connect\s+car|taggy|moving/i],
  ['transport', /estacion(amento)?|parking|park\s*\+/i],
  ['transport', /metr[oô]|[ôo]nibus|[ôo]nibu|cptm|sptrans|bilhete\s+[úu]nico|cart[aã]o\s+bom|brt|vlt|trem\s+urbano|passagem\s+(de\s+)?(metro|onibus|trem)/i],
  ['transport', /gol\s+|latam|azul\s+|tam\s+|passagem\s+(a[eé]rea|voo)|voo\s+|aeroporto|compra\s+voo/i],
  ['transport', /localiza|movida|unidas|hertz|avis|alamo|aluguel\s+de\s+carro|locacao\s+ve[ií]culo/i],
  ['transport', /ipva|licenciamento\s+ve[ií]culo|dpvat|seguro\s+auto|vistoria/i],

  // ── Moradia ───────────────────────────────────────────────────────────────────
  ['housing', /aluguel\s*(pago|residencial|im[oó]vel)?|locacao\s+im[oó]vel|arrendamento/i],
  ['housing', /condom[ií]nio|taxa\s+condominial|administradora\s+cond/i],
  ['housing', /iptu|imposto\s+predial|taxa\s+de\s+im[oó]vel/i],
  ['housing', /[aá]gua\s*e\s*esgoto|sabesp|copasa|cedae|caesb|cagece|embasa|sanepar|caern|compesa|aguas?\s+do\s+rio/i],
  ['housing', /energia|luz\s+|eletricidade|enel\s+|cemig|cpfl|coelba|coelce|cosern|celpe|celesc|edp\s+|elektro|equatorial|energisa|ampla\s+energia|elektro|light\s+s\.a\./i],
  ['housing', /g[aá]s\s*(natural|canalizado|encanado)?|comg[aá]s|ceg\s+|superg[aá]s|liquig[aá]s|ultrag[aá]z/i],
  ['housing', /internet|banda\s+larga|fibra\s+[óo]ptica|claro\s+|vivo\s+|tim\s+(fixa|residencial)|net\s+(virtua|banda)|oi\s+(fibra|fixo)|algar\s+|sercomtel|brisanet/i],
  ['housing', /financiamento\s+im[oó]vel|cef\s+hab|caixa\s+hab|prestacao\s+imovel|mensalidade\s+im[oó]vel/i],
  ['housing', /m[oó]veis?|reforma|construtora|empreiteira|material\s+de\s+constru|leroy\s+merlin|telha\s+norte|c[oô]nsul|brastemp/i],

  // ── Saúde ─────────────────────────────────────────────────────────────────────
  ['health', /farm[aá]cia|drogaria|drogasil|droga\s+raia|drogão|ultrafarma|extrafarma|pague\s+menos|panvel|nissei|redes?\s+nissei|onofre|pacheco/i],
  ['health', /m[eé]dico|consulta\s+(m[eé]dica)?|cl[ií]nica|hospital|laborat[oó]rio|exame|radiologia|ultrassom|raio-?x|tomografia|ressonancia/i],
  ['health', /dasa|fleury|einstein|s[íi]rio\s+liban[eê]s|santa\s+casa|unimed|amil|sulamerica\s+sau|bradesco\s+sau|notre\s+dame|hapvida|gndi|prevent\s+senior/i],
  ['health', /plano\s+de\s+sa[uú]de|convenio\s+m[eé]dico|mensalidade\s+plano|contribui[çc][aã]o\s+plano/i],
  ['health', /dentista|odonto|odontologia|odon|clinica\s+dent|ortodontia|implante\s+dent/i],
  ['health', /academia|gym|smart\s+fit|bluefit|bodytech|crossfit|pilates|yoga|personal\s+trainer/i],
  ['health', /rem[eé]dio|medicamento|vitamina|suplemento|whey|creatina/i],

  // ── Educação ──────────────────────────────────────────────────────────────────
  ['education', /escola|col[eé]gio|universidade|faculdade|institui[çc][aã]o\s+de\s+ensino|mensalidade\s+escolar|anuidade\s+escolar/i],
  ['education', /curso|capacita[çc][aã]o|treinamento|workshop|mentoria|aula\s+(de|do)|aulas\s+(de|do)|coaching/i],
  ['education', /udemy|alura|coursera|hotmart|eduzz|kiwify|skillshare|domestika|babbel|duolingo\s+plus/i],
  ['education', /livro|livraria|saraiva|cultura\s+liv|amazon\s+livro|fnac|travessa/i],
  ['education', /material\s+escolar|papelaria|caneta|caderno|mochila\s+(escolar)?/i],

  // ── Lazer ─────────────────────────────────────────────────────────────────────
  ['leisure', /cinema|ingresso|ingresso\s+com|cinemark|cinepolis|uci\s+|show\s+|teatro|opera|festival|evento|ticket(master)?/i],
  ['leisure', /shopping|shoppings|mall\s+|plaza\s+|parque\s+(aquatico|tem[aá]tico|diversoes)|hopi\s+hari|beto\s+carrero|beach\s+park/i],
  ['leisure', /roupa|vestuario|modas?|moda\s+|zara|h&m|c&a|renner|riachuelo|marisa|hering|leader|forever\s+21|shein|amaro|farm\s+|animale|oakley|adidas|nike|puma|mizuno|under\s+armour/i],
  ['leisure', /calçado|sapato|tenis\s+|sapataria|arezzo|schutz|melissa|havaianas|via\s+marte/i],
  ['leisure', /jogo|game|steam|playstation|xbox|nintendo|nuuvem|epic\s+games|riot\s+games|blizzard|in-game/i],
  ['leisure', /viagem|hotel|pousada|hostel|airbnb|booking|trivago|decolar|hospedagem|resort|expedia/i],
  ['leisure', /beleza|sal[aã]o|cabeleireiro|manicure|spa|est[eé]tica|esteticista|barbear[ia]|barbearia/i],

  // ── Assinaturas ───────────────────────────────────────────────────────────────
  ['saas', /netflix|spotify|amazon\s*(prime|music)|disney(\+|plus)|hbo\s*max|max\s+\d|apple\s*(tv|music|arcade|one)|youtube\s*premium|paramount|globoplay|telecine|deezer|tidal/i],
  ['saas', /microsoft\s*(365|office)|google\s*(one|workspace)|dropbox|icloud|adobe|canva\s*pro|figma|notion\s*plus|slack|zoom\s+pro/i],
  ['saas', /linkedin\s*premium|chatgpt|openai|midjourney|anthr[o]pic|cursor\s+pro/i],
  ['saas', /celular|telefone\s+m[oó]vel|recarga\s+(celular|tim|vivo|claro)|plano\s+(m[oó]vel|celular)|tim\s+black|vivo\s+total|claro\s+controle/i],
  ['saas', /antivirus|kaspersky|norton|mcafee|vpn\s+|nordvpn|expressvpn/i],
  ['saas', /assinatura|mensalidade\s+(assinatura|servi[çc]o)|plano\s+mensal|subscri[çc][aã]o/i],

  // ── Investimentos ─────────────────────────────────────────────────────────────
  ['invest', /xp\s+(invest|corretora)|btg\s+pactual|rico\s+invest|clear\s+corretora|nu\s*invest|easynvest|inter\s+invest|ita[uú]\s+corretora|bradesco\s+corretora|warren\s+invest|genial\s+invest/i],
  ['invest', /tesouro\s+direto|tesouro\s+(selic|ipca|prefixado)|aplica[cç][aã]o\s+(em\s+)?cdb|lci\s+|lca\s+|cri\s+|cra\s+|debenture/i],
  ['invest', /compra\s+(de\s+)?(a[cç][aã]o|ações|fii|etf|bdr)|investimento\s+em\s+|aplica[cç][aã]o\s+|aporte\s+(de\s+)?investimento/i],
  ['invest', /prev|previdencia\s+(privada|complementar)|pgbl|vgbl|fundo\s+de\s+pens/i],
  ['invest', /seguro\s+de\s+vida|seguro\s+residencial|porto\s+seguro|sulamérica\s+seg|ita[uú]\s+seg|tokio\s+marine|bradesco\s+seg/i],
]

const INCOME_RULES: [CategoryKey, RegExp][] = [
  ['salary',      /sal[aá]rio|holerite|folha\s+(de\s+)?(pagamento|pgt)|proventos|vencimento\s+(func|serv)|remunera[çc][aã]o|pgto\s+sal[aá]rio|credit[oa]\s+sal[aá]rio/i],
  ['salary',      /13[oº]?\s*(sal[aá]rio|sal\.?)?|decimo\s+terceiro|f[eé]rias\s+(e\s+)?1\/3|rescis[aã]o\s+contratual|verbas?\s+rescis/i],
  ['freelance',   /freelance|autonomo|pessoa\s+jur[ií]dica|honorarios|nota\s+fiscal|pgto\s+servico|pagamento\s+servico|prestacao\s+de\s+servico|mei\s+|recebimento\s+(de\s+)?honorario/i],
  ['dividend',    /dividendo|jcp|juros\s+sobre\s+capital|rendimento\s+(cdb|lci|lca|poupan|tesouro|fundo|fi\s+|fii)|resgat[eo]\s+(cdb|lci|lca|fundo|invest)|rentabilidade/i],
  ['dividend',    /poupan[çc]a|renda\s+fixa|juros\s+credita|credito\s+rendimento|rendimento\s+credita/i],
  ['rent_income', /aluguel\s*(recebido|credit|locacao)|locac[aã]o\s+recebida|repasse\s+aluguel|renda\s+(de\s+)?aluguel/i],
]

// ─── Main function ─────────────────────────────────────────────────────────────

export function autoCategory(description: string, isIncome: boolean): CategoryKey {
  const d = description.trim()

  if (isIncome) {
    for (const [cat, re] of INCOME_RULES) {
      if (re.test(d)) return cat
    }
    return 'other_income'
  }

  for (const [cat, re] of EXPENSE_RULES) {
    if (re.test(d)) return cat
  }
  return 'other'
}

// ─── History-aware inference (for AddTransactionModal) ────────────────────────
// First tries transaction history, then falls back to keyword rules.

export function inferCategoryFromHistory(
  description: string,
  history: { description: string; category: string }[],
  isIncome = false,
): CategoryKey | null {
  if (description.length < 3) return null
  const lower = description.toLowerCase()

  if (history.length > 0) {
    // Exact match
    const exact = history.find(h => h.description.toLowerCase() === lower)
    if (exact) return exact.category as CategoryKey

    // Partial match — collect votes
    const matches = history.filter(h => {
      const hl = h.description.toLowerCase()
      return hl.includes(lower) || lower.includes(hl.slice(0, Math.max(4, Math.floor(hl.length * 0.6))))
    })
    if (matches.length > 0) {
      const votes = new Map<string, number>()
      matches.forEach(h => votes.set(h.category, (votes.get(h.category) || 0) + 1))
      const winner = Array.from(votes.entries()).sort((a, b) => b[1] - a[1])[0]
      return winner[0] as CategoryKey
    }
  }

  // Fallback to keyword rules
  const byKeyword = autoCategory(description, isIncome)
  // Return null if it would just be the generic fallback (caller may prefer not to suggest)
  if (byKeyword === 'other' || byKeyword === 'other_income') return null
  return byKeyword
}
