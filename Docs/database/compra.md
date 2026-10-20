# `compra`

**Papel:** agrupa os itens de uma compra. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id`; `usuario_id` obrigatório; `data_compra` com valor padrão; `valor_total NUMERIC(9,2)` obrigatório; `estabelecimento` opcional, até 50 caracteres.

**Relações:** pertence a `users`; seus `item` são removidos em cascata quando a compra é excluída. A exclusão de um usuário também exclui suas compras.

**Evolução:** criada em 08/09 (`619f07a`); `valor_total` tornou-se obrigatório em 09/09 (`98d6208`). As operações de criação, consulta, edição e exclusão de compras foram incorporadas ao backend em setembro, culminando no fluxo de cadastro e extrato (`b9735d1`, `c5234e4`).
