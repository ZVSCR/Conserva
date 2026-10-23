# `estoque`

**Papel:** saldo disponível de um item comprado. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id`, `usuario_id`, `item_id` único, `quantidade_disponivel NUMERIC(9,2)` não negativa e `gasto BOOLEAN` com padrão `FALSE`.

**Relações:** pertence a `users` e a um `item`; ambos os vínculos usam exclusão em cascata. Os consumos por preparo aparecem em `receita_preparada_estoque`.

**Evolução:** criada em 10/09 (`4c22f21`); a unicidade de `item_id` foi estabelecida no mesmo período (`ac4e01f`). Em 04/10 surgiram a flag `gasto` e as triggers que a atualizam (`0bf6d32`). As regras posteriores impedem saldo negativo, saldo acima da quantidade comprada e fração de unidade para itens unitários; veja [`Triggers/merge.sql`](../../Database/Triggers/merge.sql).
