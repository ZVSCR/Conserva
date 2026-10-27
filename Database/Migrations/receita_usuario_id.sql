-- Receitas existentes permanecem públicas (usuario_id NULL).
ALTER TABLE receita
ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
