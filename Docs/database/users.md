# `users`

**Papel:** conta de usuário; identificada por `id`. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `username` (até 50 caracteres, único), `email` (até 100, único), `tipo` (até 11), `password_hash`, `created_at` e `updated_at`. Os quatro primeiros campos são obrigatórios; as datas têm valor padrão. A senha é armazenada como hash, não em texto puro.

**Relações:** um usuário pode ter compras, registros de estoque, receitas próprias e receitas preparadas. As chaves estrangeiras dessas tabelas usam `ON DELETE CASCADE`.

**Evolução:** a tabela surgiu em 02/09 (`c4b5fd4`). O esquema consolidado de 12/09 (`422ef95`) a vinculou às outras entidades; o vínculo opcional com `receita` foi acrescentado em 18/10 (`369f21f`).
