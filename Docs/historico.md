# Histórico de implementação

Marcos em ordem de integração na linha principal até `89638ff` (19/10/2026). A data exibida é a do commit indicado; em alguns casos, commits internos de uma branch antecedem o merge. Esta seleção resume entregas funcionais e mudanças de estrutura, sem reproduzir todos os 462 commits.

| Período | Marco | Evidência |
| --- | --- | --- |
| 20–31/08 | Criação do repositório, visão inicial do produto e aplicação React/Vite. | `89bc26b`, `fe24831`, `efa04bd` |
| 02–13/09 | Primeiro esquema de `users`, `compra`, `item` e `estoque`; em 12/09 surge o esquema consolidado com `receita`, `receita_preparada` e `receita_preparada_estoque`. | `c4b5fd4`, `619f07a`, `7cf0a61`, `4c22f21`, `422ef95`, `3d1449d` |
| 09–18/09 | API Express conectada ao PostgreSQL, rotas de itens e autenticação inicial; `app.js` passa a definir o aplicativo separado de `index.js`. | `a5f9628`, `0bb7db7`, `bc82bf7` |
| 11–29/09 | Telas e operações de usuário, estoque e compras; cadastro, atualização e extrato passam a compor o fluxo principal. | `a923c33`, `b9735d1`, `c5234e4`, `003db45` |
| 04–10/10 | Flag `gasto` e triggers do estoque, granularidade de medidas, estrutura de receitas, criação de receitas e catálogo de ingredientes. | `0bf6d32`, `96e1e9a`, `b84cd0c`, `fb6904a`, `3c0e735`, `ce47f3f` |
| 11–13/10 | Verificação e preparo de receitas com baixa no estoque; leitura, exclusão e atualização de receitas; catálogo, histórico de refeições e cálculo de gastos. | `c95dd12`, `e7cf9da`, `3faa9d4`, `0b6c3cd`, `caa75c7`, `432c8a8`, `cac45c7` |
| 13–15/10 | Autenticação reorganizada em validator, service e repository; componentes React reorganizados por domínio. | `3f540eb`, `843826c` |
| 17–19/10 | Cadastro de ingredientes, associação de receitas ao usuário, filtros por usuário e modal de cadastro de receita no frontend. | `82ac830`, `369f21f`, `feb95ea`, `89638ff` |

## Leitura da evolução

- [Banco de dados](database/README.md): cada entidade registra sua criação e alterações de esquema.
- [Backend](backend/arquitetura.md): descreve a evolução das camadas e o fluxo atual.
- [Frontend](frontend/estrutura.md): mostra a sequência das telas e a organização atual.

O [README principal](../README.md) ainda descreve OCR e sugestão automática de receitas como objetivos. Eles não correspondem a rotas ou telas completas no código deste recorte.
