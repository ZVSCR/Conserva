# `item`

**Papel:** representa um produto comprado e seu lote. Fonte: [`merge.sql`](../../Database/Create/merge.sql).

**Campos:** `id`, `compra_id`, `nome_item` (até 100), `quantidade NUMERIC(9,2)` positiva, `unidade_de_medida` (até 20), `tipo_medida` (`unitaria` ou `variavel`), `valor_unitario NUMERIC(9,2)`, `validade_estimada` opcional e `ingrediente_id` opcional. Para unidade `un`, a quantidade deve ser inteira; medidas variáveis aceitam `kg`, `g`, `L` e `mL`.

**Relações:** pertence a `compra`; pode referenciar `ingrediente`; cada item pode ter no máximo um registro de `estoque` por causa de `estoque.item_id UNIQUE`.

**Evolução:** criada em 09/09 (`7cf0a61`), integrada ao esquema consolidado em 12/09 (`422ef95`), recebeu tipo e restrições de medida em 05/10 (`96e1e9a`) e referência opcional a ingrediente em 10/10 (`3c0e735`). A alteração da quantidade pode atualizar a flag `estoque.gasto` por trigger (`0bf6d32`).
