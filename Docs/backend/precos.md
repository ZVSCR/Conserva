# Preços de compras e itens

Os formulários recebem **Preço total do item**. A API recebe esse preço em
`preco_total_item`, e o backend calcula `item.valor_unitario` por unidade de
medida (`un`, `kg`, `g`, `L` ou `mL`). O banco continua com a estrutura existente.

## Criação e inclusão de itens

`POST /api/compras`, `POST /api/compras/:compraId/items` e `POST /api/items`
recebem itens como:

```json
{
  "nome_item": "Produto",
  "quantidade": 3,
  "unidade_de_medida": "un",
  "preco_total_item": 6
}
```

O exemplo produz um lote de três unidades com `valor_unitario = 2`. Na criação
direta por `/api/items`, informe também `compra_id`. As outras duas rotas recebem
os itens no array `itens`; a criação da compra recebe ainda o estabelecimento.

Para medidas variáveis, `quantidade` é a medida de cada embalagem e o total cobre
todo o conjunto de `numero_embalagens` (opcional; padrão 1). Duas embalagens de
0,5 kg por R$ 20 produzem dois registros com 0,5 kg e preço de R$ 20 por kg.

`valor_unitario` não é aceito como preço de entrada, nem em combinação com o total.
`compra.valor_total` continua calculado pelo backend a partir dos itens; o total
geral não é dividido entre produtos diferentes.

## Consulta e edição

As consultas de itens e de detalhes da compra incluem `preco_total_item`, calculado
como `ROUND(quantidade * valor_unitario, 2)`. Esse valor preenche a edição e os
detalhes exibidos na interface. O preço unitário permanece disponível na resposta.

`PATCH /api/items/:id` e `PATCH /api/compras/:compraId/items/:itemId` recebem o total
do item, sem exigir que o cliente calcule o preço unitário. Alterações somente de
nome ou validade preservam o preço. Repetir o total já exibido também preserva o
unitário original, inclusive quando o produto precisou de arredondamento.

Corrigir a quantidade original preserva o total e recalcula o unitário. A correção
de quantidade/unidade continua proibida após consumo. Ao trocar a unidade,
envie quantidade e total. Atualizar o saldo disponível em `/api/estoque` não altera
o preço nem o total histórico da compra.

Na edição coletiva (`PATCH /api/compras/:compraId/items`), `itemBusca.valor_unitario`
continua sendo o preço **original**, usado para selecionar os lotes homogêneos.
`novosValores.preco_total_item` é o total do **conjunto selecionado**, dividido pela
medida e pelo número de registros. O retorno contém o total de cada registro.

Edição, inclusão e exclusão de itens coordenam a atualização do total pela compra
e usam transações. A edição não grava um preço calculado com o saldo restante.

## Precisão e limites

O total deve ser um número não negativo, com até duas casas decimais e no máximo
R$ 9.999.999,99. O preço unitário também precisa caber em `NUMERIC(9,2)`.
O cálculo utiliza aritmética decimal e arredondamento monetário por registro.

O servidor reconstrói o total depois da conversão. Se ele divergir do informado,
a API responde **400** e não grava a operação. Exemplos rejeitados: três unidades
por R$ 10, ou 500 g por R$ 8. Na edição coletiva, o mesmo teste considera todos os
registros selecionados. Não há ajuste silencioso de centavos.

Os registros anteriores não são corrigidos automaticamente: não é possível inferir
se um preço antigo foi digitado como total ou como preço unitário. Alterar um preço
continua afetando os custos consultados de receitas anteriores, que usam o preço
atual do item, sem uma cópia histórica do preço por preparo.
