# `receita_preparada_estoque`

**Papel:** registra quanto de cada lote do estoque foi usado num preparo. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** chave primária composta (`receita_preparada_id`, `estoque_id`) e `quantidade_gasta NUMERIC(9,2)` obrigatória. O SQL atual não declara restrição `CHECK` para garantir que `quantidade_gasta` seja positiva.

**Relações:** referencia `receita_preparada` e `estoque`, ambos com exclusão em cascata. O valor gasto por preparo é calculado combinando `quantidade_gasta` com `item.valor_unitario`.

**Evolução:** modelada em 12/09 (`422ef95`) e usada pelo fluxo de preparo integrado em 11/10 (`c95dd12`). A consulta de custos por receita foi integrada em 13/10 (`cac45c7`).
