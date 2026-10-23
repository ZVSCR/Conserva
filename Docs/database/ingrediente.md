# `ingrediente`

**Papel:** catálogo de nomes canônicos, como ovo ou leite. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id` e `nome VARCHAR(100) NOT NULL UNIQUE`.

**Relações:** `item.ingrediente_id` pode apontar para um ingrediente; `receita_ingrediente` representa sua participação nas receitas. A associação à receita usa `ON DELETE RESTRICT` para impedir a remoção de um ingrediente ainda usado por ela.

**Evolução:** adicionada ao esquema consolidado em 10/10 (`3c0e735`); a tabela de associação chegou no mesmo dia (`ce47f3f`). O cadastro pela API foi integrado em 18/10 (`82ac830`).
