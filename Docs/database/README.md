# Banco de dados

O esquema consolidado está em [`Database/Create/merge.sql`](../../Database/Create/merge.sql). Os arquivos individuais em `Database/Create/` registram definições e alterações separadas; [`last_update.sql`](../../Database/Create/last_update.sql) contém uma atualização de esquema. As regras de `gasto` e de granularidade estão em [`Database/Triggers/merge.sql`](../../Database/Triggers/merge.sql). Estes arquivos SQL não formam uma sequência automática de migrações: confirme o estado do banco antes de aplicá-los.

## Entidades atuais

| Entidade | Papel |
| --- | --- |
| [`users`](users.md) | Conta à qual compras, estoque e preparos pertencem. |
| [`compra`](compra.md) | Compra e seu valor total. |
| [`ingrediente`](ingrediente.md) | Nome canônico usado por itens e receitas. |
| [`item`](item.md) | Produto comprado, quantidade, preço e validade. |
| [`estoque`](estoque.md) | Saldo disponível de cada item para um usuário. |
| [`receita`](receita.md) | Nome e instruções de uma receita. |
| [`receita_ingrediente`](receita_ingrediente.md) | Ingredientes e quantidades exigidos pela receita. |
| [`receita_preparada`](receita_preparada.md) | Evento de preparo por um usuário. |
| [`receita_preparada_estoque`](receita_preparada_estoque.md) | Lotes e quantidades consumidos no preparo. |

Relações principais: `users → compra → item → estoque`; `ingrediente → item`; `receita ↔ ingrediente` por `receita_ingrediente`; `users + receita → receita_preparada → receita_preparada_estoque → estoque`.

O esquema original de 12/09 (`422ef95`) não tinha `ingrediente` nem `receita_ingrediente`. Essas tabelas surgiram em outubro; portanto, a nota sobre receitas sem ingredientes no [README principal](../../README.md) descreve uma versão anterior. `tempo_preparo` também aparece naquele README, mas não existe no SQL consolidado atual.
