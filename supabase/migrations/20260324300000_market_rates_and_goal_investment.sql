-- Tabela de taxas de mercado (CDI, SELIC) — dados públicos, sem RLS
CREATE TABLE IF NOT EXISTS market_rates (
  id            TEXT PRIMARY KEY,           -- 'cdi_daily', 'selic_daily'
  value         DECIMAL(12, 8) NOT NULL,    -- taxa diária em decimal (ex: 0.00041854)
  reference_date DATE NOT NULL,             -- data a que a taxa se refere
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Dados públicos — sem Row Level Security
-- (qualquer chamada server-side pode ler/escrever)

-- Coluna de tipo de investimento nas metas
ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS investment_type TEXT DEFAULT 'none'
  CHECK (investment_type IN ('none', 'cdb_100', 'cdb_110', 'selic', 'poupanca'));
