-- Adiciona coluna avatar_url na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ATENÇÃO: Também é necessário criar o bucket de Storage manualmente no Supabase:
-- Storage → New bucket → nome: "avatars" → Public: true → Save
