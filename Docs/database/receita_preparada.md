# `receita_preparada`

**Papel:** registra uma execução de receita por um usuário. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id`, `usuario_id` obrigatório, `receita_id` obrigatório e `data_preparo` com valor padrão.

**Relações:** pertence a `users` e `receita`, ambos com exclusão em cascata. Cada preparo pode ter vários consumos em `receita_preparada_estoque`.

**Evolução:** modelada em 12/09 (`422ef95`). O fluxo de preparo com baixa de estoque foi integrado em 11/10 (`c95dd12`); histórico e cálculo de gastos foram incorporados em 12–13/10 (`432c8a8`, `cac45c7`).
