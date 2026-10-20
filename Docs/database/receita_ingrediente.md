# `receita_ingrediente`

**Papel:** lista os ingredientes exigidos por uma receita. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** chave primária composta (`receita_id`, `ingrediente_id`), `quantidade NUMERIC(9,2)` positiva e `unidade_de_medida` restrita a `un`, `kg`, `g`, `L` ou `mL`.

**Relações:** `receita_id` usa `ON DELETE CASCADE`; `ingrediente_id` usa `ON DELETE RESTRICT`. Assim, excluir uma receita remove seus requisitos, mas um ingrediente em uso não pode ser excluído diretamente.

**Evolução:** entrou no esquema consolidado em 10/10 (`ce47f3f`). A partir dela, a verificação de disponibilidade e o preparo passaram a comparar requisitos com os lotes do estoque do usuário (`c95dd12`).
