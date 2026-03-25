import type { CategoryKey } from './categories'

// ─── Normalização ─────────────────────────────────────────────────────────────
// Remove acentos, caracteres especiais e prefixos de tipo de transação
// que não dizem nada sobre a categoria (PIX ENVIADO, COMPRA DEBITO, etc.)

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
    // Pix
    .replace(/^pix\s+(enviado|recebido|transf\.?|transferencia|para|de|cred\.?|deb\.?)\s*/i, '')
    // Compra
    .replace(/^compra\s+(no\s+)?(debito|credito|deb\.?|cred\.?|cartao|cart\.?)(\s+\d{2}\/\d{2})?\s*/i, '')
    // TED / DOC / TEF
    .replace(/^(ted|doc|tef)\s+(enviado|recebido|credit\.?|debit\.?)?\s*/i, '')
    // Saque
    .replace(/^saque\s+(caixa|eletronico|atm|24h|banco)?\s*/i, '')
    // Débito automático
    .replace(/^deb(ito)?\s+aut(omatico|\.?)?\s*/i, '')
    // Pagamento
    .replace(/^pag(amento|to|t\.?)\s+(boleto|fatura|carne|de\s+|do\s+)?\s*/i, '')
    // Transferência
    .replace(/^transf(erencia|\.?)?\s+(de\s+|para\s+|rec\.?|env\.?)?\s*/i, '')
    // Crédito / Débito em conta
    .replace(/^(credito|debito)\s+(em\s+conta|conta\s+corrente|cc)?\s*/i, '')
    // Recebimento
    .replace(/^receb(imento|\.?)?\s+(de\s+|credit\.?)?\s*/i, '')
    // Lançamento
    .replace(/^lancamento\s+(credito|debito)\s*/i, '')
    .trim()
}

// Aplica normalização + remoção de prefixo
function prep(raw: string): string {
  return stripTxPrefix(normalize(raw))
}

// ─── Regras por categoria ─────────────────────────────────────────────────────
// Cada regra é testada no texto NORMALIZADO e SEM PREFIXO DE TRANSAÇÃO.
// Use padrões curtos/parciais para capturar nomes truncados (20-30 chars).

type Rule = [CategoryKey, RegExp]

const RULES: Rule[] = [

  // ══ RECEITAS ════════════════════════════════════════════════════════════════

  ['salary',
    /\b(salario|salario\s+liq|holerite|folha\s+(de\s+)?pag|proventos|vencimento|remuneracao|remu?n\.?|pgto\s+sal|credit[oa]\s+sal|13[o°]?\s*(sal)?|decimo\s+terceiro|ferias|1\/3\s+ferias|rescisao|verbas?\s+rescis|fgts\s+|adiant(amento)?\s+(sal|de\s+sal))\b/i],

  ['freelance',
    /\b(freelance|autonomo|honor(arios?)?|nota\s+fiscal|nf(e|se)?\s*\d|mei\s+|pgto\s+(serv|projeto)|pagamento\s+serv|prestacao\s+serv|receb\s+(serv|proj))\b/i],

  ['dividend',
    /\b(dividend[oa]|jcp|juros\s+cap|rendimento\s+(cdb|lci|lca|lc|fii|fi|fundo|poupan|tesouro|invest)|resgat[eo]\s+(cdb|lci|lca|lc|fundo|invest|aplica)|rentabilidade|ir\s+sobre\s+rend|creditado\s+rend|rend\s+cred|creditado\s+(cdb|lci|lca))\b/i],

  ['rent_income',
    /\b(aluguel\s+(recebido|cred|credit)|locacao\s+recebida|repasse\s+aluguel|renda\s+aluguel|aluguel\s+im[oó]vel\s+rec)\b/i],

  // ══ DESPESAS ════════════════════════════════════════════════════════════════

  // ── Alimentação ─────────────────────────────────────────────────────────────
  // Delivery apps
  ['food',
    /\b(ifood|ifoode|rappi|ubereats|uber\s+eat|james\s+del|james\s+app|ze\s+del|zedel|aiqfome|loggi\s+food|chefdelivery|delivery\s+much)\b/i],

  // Fast food (nomes truncados a 10-12 chars são comuns em extratos)
  ['food',
    /\b(mcdon(alds?|ald)?|mcdonald|mc\s+lan|burguer?\s+king|bk\s+lanche|bk\s+|subway|kfc\s+|bob'?s\s+|bobs\s+|habib'?s|habib\s+|domino'?s|pizza\s*hut|giraffas|madero|outback|applebee|chilis|popeye|five\s+guys|taco\s+bell|starbucks|starbuck)\b/i],

  // Redes de supermercado (vários nomes truncados)
  ['food',
    /\b(supermer|superm\s|mercad(inho|ao|o\s+extra|o\s+livre)?|hipermercado|atacadao|atacad\s+|assai\s+|pao\s+de\s+acucar|panificadora|grupo\s+cbd|grupo\s+gpa|carrefour|carref\s+|extra\s+super|walmart|sams\s+club|makro|condor\s+|copa\s+super|hortifruti|sacolao|feira\s+(livre|municipal)|quitanda|verdureiro|acougue|frigorifico|mercearia)\b/i],

  // Restaurantes, padarias, lanchonetes
  ['food',
    /\b(restaurante|rest\s+|lanchonete|lanch\s+|pizza(ria)?|churrascaria|churrasc\s+|bistr[ôo]|sushi|japanese|temaki|yakissoba|galinhada|marmita|quentinha|refeitorio|cantina|bar\s+(e\s+)?(rest|lanch)|food\s+court|praça\s+de\s+alim|cafeteria|cafe\s+|padaria|padarinha|boulangerie|confeitaria|doceria|brigadeiro|sorveteria|sorvete|acai\s+|açai\s+|tapiocaria|tapioca\s+|crepe\s+|pastelaria|pastel\s+)\b/i],

  // Bebidas e conveniência
  ['food',
    /\b(ambev|heineken|skol|brahma|cervejaria|distribuidora\s+beb|emporio|empori\s+|mercearia|adega|vinhos?|minimercado|mini\s+mercado|conveniencia|conveniên|7\s*eleven|am\s*pm)\b/i],

  // ── Transporte ───────────────────────────────────────────────────────────────
  ['transport',
    /\b(uber\s+|99\s+(pop|taxi|moto|app)|indriver|cabify|buser\s+|blablacar|taxi\s+|taxista)\b/i],

  // Postos de combustível (nomes truncados)
  ['transport',
    /\b(posto\s+(de\s+)?gas|posto\s+(shell|ipiranga|petrobras|br\s+|esso|texaco|raizen|ale|bandeirante|satelite)|auto\s+posto|gas\s+station|gasolina|combust|etanol|alcool\s+veic|diesel|arla|br\s+distribui|ipiranga\s+|shell\s+|vibra\s+|raizen\s+)\b/i],

  ['transport',
    /\b(pedagio|sem\s+parar|veloe|conectcar|connect\s+car|taggy\s+|autoban|ecorodovias|cart\s+pedagio|via\s+\d{3}|rod\s+(pres|gov|br))\b/i],

  ['transport',
    /\b(estacion(amento)?|parking\s+|park\s+\d|park\s+plus|estapark|multipark|rotativos?)\b/i],

  ['transport',
    /\b(metro\s+|metr[ôo]\s+|cptm\s+|sptrans|bilhete\s+unico|cartao\s+bom|brt\s+|vlt\s+|trem\s+urb|onibus\s+|oibus|passagem\s+(metro|onib|trem|ferrov)|ciclo)\b/i],

  ['transport',
    /\b(latam\s+|gol\s+(ling|air|transp)|azul\s+(bras|air)|tam\s+|passagem\s+aere|voo\s+|aeroporto|embarque|check.?in|cia\s+aere)\b/i],

  ['transport',
    /\b(localiza\s+|movida\s+|unidas\s+|hertz\s+|avis\s+|aluguel\s+(de\s+)?carr|locacao\s+(de\s+)?veic)\b/i],

  ['transport',
    /\b(ipva\s+|licencia(mento)?\s+veic|dpvat|vistoria\s+(veic|auto)|seguro\s+(auto|veic|carro|moto)\s+)\b/i],

  // ── Moradia ───────────────────────────────────────────────────────────────────
  // Água e esgoto
  ['housing',
    /\b(sabesp|copasa|cedae|caesb|cagece|embasa|sanepar|caern|compesa|aguas\s+(de\s+)?(rio|brasil|parana|goias|manaus)|saneago|casan|corsan|sanesul|agespisa|caerd|cagepa|cosama)\b/i],

  // Energia elétrica
  ['housing',
    /\b(enel\s+|cemig\s+|cpfl\s+|coelba\s+|coelce\s+|cosern\s+|celpe\s+|celesc\s+|edp\s+|elektro|equatorial|energisa|ampla\s+|light\s+s|eletropaulo|aes\s+sul|boa\s+vista\s+energ|ceron\s+|eletroacre|amazonas\s+energ|roraima\s+energ)\b/i],

  // Gás
  ['housing',
    /\b(comgas|com\s*gas|ceg\s+|gas\s+natural|gas\s+canaliz|supergas|liquigas|ultragaz|nacional\s+gas)\b/i],

  // Internet e telefone fixo
  ['housing',
    /\b(claro\s+(res|fixa|banda|fibra)|vivo\s+(fixa|res|fibra|banda)|net\s+(virtua|banda|res)|oi\s+(fibra|fixa|res)|algar\s+|sercomtel|brisanet|unifique|desktop\s+internet|wantel|mob\s+telecom)\b/i],

  // Aluguel, condomínio, IPTU
  ['housing',
    /\b(aluguel|condominio|cond\s+|taxa\s+cond|adm\s+cond|iptu\s+|imposto\s+predial|tx\s+im[oó]vel|arrendamento)\b/i],

  // Financiamento imobiliário
  ['housing',
    /\b(financiamento\s+im[oó]v|parcela\s+im[oó]v|cef\s+hab|caixa\s+hab|bradesco\s+im[oó]v|itau\s+im[oó]v|prestacao\s+im[oó]v|minha\s+casa)\b/i],

  // Materiais de construção / móveis
  ['housing',
    /\b(leroy\s+merlin|telha\s+norte|c\s*\&\s*c\s+|sodimac|dicico|etna\s+m|casa\s+show|center\s+cast|construcao|reforma\s+|empreitei|pinturas?)\b/i],

  // ── Saúde ─────────────────────────────────────────────────────────────────────
  // Farmácias
  ['health',
    /\b(drogasil|droga\s+raia|drogaraia|drogaria|farmacia|farm[áa]cia|ultrafarma|extra\s+farm|pague\s+menos|panvel\s+|nissei\s+|onofre\s+|pacheco\s+|drogao\s+|sao\s+paulo\s+farm|net\s+farma|farma\s+conde|raia\s+drog|drogal\s+)\b/i],

  // Planos de saúde
  ['health',
    /\b(unimed\s+|amil\s+|sulamerica\s+sau|bradesco\s+sau|notre\s+dame|hapvida|gndi\s+|prevent\s+senior|mediservice|intermed|green\s+line|assim\s+saude|mensalidade\s+plano|plano\s+(de\s+)?saude|convenio\s+med)\b/i],

  // Hospitais, clínicas, laboratórios
  ['health',
    /\b(einstein|fleury|dasa\s+|sirio\s+liban|santa\s+casa|upa\s+|ubs\s+|hospital\s+|hosp\s+|clinica\s+|policlinica|consultorio|laboratorio|lab\s+|exame\s+|radiologia|ultrassom|tomografia|ressonancia)\b/i],

  // Dentista
  ['health',
    /\b(dentista|odonto|ortodontia|implante\s+dent|clinica\s+dent|odontologo|oralsin|sorridents|odontoprev)\b/i],

  // Academia e bem-estar
  ['health',
    /\b(smartfit|smart\s+fit|bluefit|bodytech|cia\s+athletica|academia\s+|crossfit|pilates|yoga\s+|personal\s+train|bio\s+ritmo|bio\s+system|total\s+pass)\b/i],

  // Medicamentos, suplementos
  ['health',
    /\b(remedio|medicamento|vitamina\s+|suplemento|whey\s+|creatina|probiotico|collagen|omega\s+3)\b/i],

  // ── Educação ──────────────────────────────────────────────────────────────────
  ['education',
    /\b(escola\s+|colegio\s+|col\s+|universidade|faculdade|fac\s+|institui[cç]\s+(de\s+)?ensino|mensalidade\s+(esc|fac|col)|anuidade\s+(esc|acad)|matricula\s+)\b/i],

  ['education',
    /\b(curso\s+|capacitacao|treinamento|workshop|mentoria|aula\s+(de|do)\s+|coaching|pos\s+(grad|lato|stricto)|mba\s+)\b/i],

  ['education',
    /\b(udemy|alura\s+|coursera|hotmart|eduzz|kiwify|skillshare|domestika|babbel|duolingo|descomplica|gran\s+curso|estrategia\s+concurso)\b/i],

  ['education',
    /\b(livraria|livro\s+|saraiva\s+|cultura\s+liv|fnac\s+|travessa\s+|amazon\s+liv|material\s+esc|papelaria)\b/i],

  // ── Lazer ─────────────────────────────────────────────────────────────────────
  // Entretenimento
  ['leisure',
    /\b(cinema|cinemark|cinepolis|uci\s+|kinoplex|ingresso(s)?\s+|teatro\s+|opera\s+|show\s+|festival\s+|concerto|ticket(master)?|sympla|eventbrite|blueticket)\b/i],

  // Viagem e hospedagem
  ['leisure',
    /\b(hotel\s+|pousada\s+|hostel\s+|airbnb|booking\s+|trivago|decolar|hospedagem|resort\s+|apart\s+hotel|viagem\s+|expedia|hotel\s+inn|apart\s+)|passagem\b/i],

  // Vestuário e calçados
  ['leisure',
    /\b(zara\s+|h\s*&\s*m\s+|c\s*&\s*a\s+|renner\s+|riachuelo|marisa\s+|hering\s+|leader\s+|forever\s+21|shein\s+|amaro\s+|farm\s+|animale|arezzo|schutz\s+|melissa\s+|havaianas|calcado|calcados|sapato|sapataria|tenis\s+(adidas|nike|puma)|oakley|adidas\s+|nike\s+|puma\s+|mizuno|under\s+armour|centauro|netshoes)\b/i],

  // Shopping e lojas de departamento
  ['leisure',
    /\b(shopping\s+|shoppings|mall\s+|americanas\s+|casas\s+bahia|magazine\s+luiza|magalu|ponto\s+frio|fast\s+shop|ricardo\s+elet|lojas\s+(ame|bahia|salv|cearens|maia|becker)|lojas\s+cia\s+|marabraz\s+|mobilplan)\b/i],

  // Beleza e estética
  ['leisure',
    /\b(salao\s+(de\s+)?beleza|cabeleireiro|manicure|pedicure|spa\s+|estetica|esteticista|barbearia|barbeiro|sobrancelha|depilacao|depil\s+|salon\s+|beauty\s+)\b/i],

  // Games e lazer digital
  ['leisure',
    /\b(steam\s+|playstation|xbox\s+|nintendo\s+|nuuvem|epic\s+games|riot\s+games|blizzard|gaming|in.game|google\s+play|apple\s+store|app\s+store)\b/i],

  // Parques, turismo
  ['leisure',
    /\b(parque\s+(aquatic|tematic|diverso)|hopi\s+hari|beto\s+carrero|beach\s+park|museu\s+|aquario|zoologico)\b/i],

  // ── Assinaturas / SaaS ────────────────────────────────────────────────────────
  // Streaming e entretenimento digital
  ['saas',
    /\b(netflix\s+|netflix\.com|spotify\s+|amazon\s+(prime|music)|disney(\+|plus|\s+plus)|hbo\s+(max|go)|max\s+\d|apple\s+(tv|music|arcade|one)|youtube\s+(premium|music)|paramount\s+(plus|\+)|globoplay|telecine|deezer\s+|tidal\s+|mubi\s+|crunchyroll)\b/i],

  // Produtividade e cloud
  ['saas',
    /\b(microsoft\s+(365|office)|google\s+(one|workspace)|dropbox\s+|icloud\s+|adobe\s+|canva\s+(pro|plan)|figma\s+|notion\s+|slack\s+|zoom\s+(pro|plan)|monday\.com|pipedrive|hubspot)\b/i],

  // Planos móveis (celular)
  ['saas',
    /\b(tim\s+(black|beta|controle|ult|prat|pós?)|vivo\s+(turbo|total|easy|familia|v|contole)|claro\s+(controle|pos|pre|res|familia)|oi\s+(pos|total|livre)|nextel|algar\s+movel|plano\s+(celular|m[oó]vel)|recarga\s+(cel|tim|vivo|claro|oi|nextel)|mensalidade\s+cel)\b/i],

  // Segurança e outros SaaS
  ['saas',
    /\b(kaspersky|norton\s+|mcafee\s+|bitdefender|nordvpn|expressvpn|vpn\s+|antivirus|assinatura\s+|mensalidade\s+(serv|assina)|subscricao|plan\s+(mensal|anual))\b/i],

  // LinkedIn e ferramentas profissionais
  ['saas',
    /\b(linkedin\s+prem|chatgpt\s+plus|openai\s+|midjourney|cursor\s+pro|github\s+|atlassian|jira\s+|confluence|vercel\s+|heroku)\b/i],

  // ── Investimentos ─────────────────────────────────────────────────────────────
  ['invest',
    /\b(xp\s+(invest|corr)|btg\s+(pact|invest)|rico\s+(invest|corr)|clear\s+(corr|invest)|nuinvest|nu\s+invest|easynvest|inter\s+invest|itau\s+(corr|invest|bba)|bradesco\s+(corr|invest)|genial\s+invest|warren\s+(invest|asset)|modalmais|ModalMais|icatu|c6\s+invest|avenue\s+|inter\s+corr)\b/i],

  ['invest',
    /\b(aplica[cç][aã]o\s+(em\s+)?(cdb|lci|lca|lc|fi\s+|fii|tesouro|renda\s+fix)|resgat[eo]\s+(cdb|lci|lca|fundo|invest)|aporte\s+(invest|carteira)|compra\s+(a[cç][aã]o|acoes|fii\s+|etf\s+|bdr)|tesouro\s+(selic|ipca|prefixado|direto))\b/i],

  ['invest',
    /\b(previdencia\s+(priv|compl|pgbl|vgbl)|pgbl\s+|vgbl\s+|fundo\s+(de\s+)?pens|aporte\s+(prev|pgbl|vgbl)|resgate\s+prev)\b/i],

  ['invest',
    /\b(seguro\s+(de\s+)?vida|seguro\s+(res|predial)|porto\s+seguro|sulamérica\s+seg|itau\s+seg|tokio\s+mar|bradesco\s+seg|azul\s+seg|mapfre\s+)\b/i],
]

// ─── Função principal ─────────────────────────────────────────────────────────

export function autoCategory(description: string, isIncome: boolean): CategoryKey {
  const norm = prep(description)
  const original = normalize(description) // também testa sem remover prefixo

  // Para receitas, só testa regras de income
  if (isIncome) {
    for (const [cat, re] of RULES) {
      if (cat === 'salary' || cat === 'freelance' || cat === 'dividend' || cat === 'rent_income') {
        if (re.test(norm) || re.test(original)) return cat
      }
    }
    return 'other_income'
  }

  // Para despesas, testa as demais regras
  for (const [cat, re] of RULES) {
    if (cat === 'salary' || cat === 'freelance' || cat === 'dividend' || cat === 'rent_income') continue
    if (re.test(norm) || re.test(original)) return cat
  }
  return 'other'
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
    // Match exato
    const exact = history.find(h => h.description.toLowerCase() === lower)
    if (exact) return exact.category as CategoryKey

    // Match parcial com votação
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

  // Fallback para regras por palavra-chave
  const byKeyword = autoCategory(description, isIncome)
  if (byKeyword === 'other' || byKeyword === 'other_income') return null
  return byKeyword
}
