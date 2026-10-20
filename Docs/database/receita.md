# `receita`

**Papel:** cadastro da receita, separado dos registros de preparo. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id`, `usuario_id` opcional, `nome VARCHAR(100) NOT NULL`, `descricao` opcional, `modo_preparo` opcional e `created_at` com valor padrão. Não há coluna `tempo_preparo` no esquema atual.

**Relações:** `receita_ingrediente` define ingredientes necessários; `receita_preparada` registra execuções. A exclusão da receita remove essas associações em cascata. `usuario_id` nulo ainda é aceito pelo SQL.

**Evolução:** apareceu no esquema consolidado de 12/09 (`422ef95`) sem ingredientes definidos. O vínculo com `ingrediente` foi acrescentado em 10/10 (`ce47f3f`); a API de receitas ganhou criação (`fb6904a`), leitura, exclusão e edição em outubro (`e7cf9da`, `3faa9d4`, `0b6c3cd`). O campo de usuário foi adicionado em 18/10 (`369f21f`).
