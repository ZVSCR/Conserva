# Arquitetura do backend

O servidor é uma API Express em CommonJS. [`index.js`](../../Backend/src/index.js) inicia a porta 3000; [`app.js`](../../Backend/src/app.js) configura JSON, CORS e monta as rotas. O PostgreSQL é acessado pela conexão Neon em [`config/database.js`](../../Backend/src/config/database.js) e por um pool para operações transacionais em [`config/transactionDatabase.js`](../../Backend/src/config/transactionDatabase.js). A conexão usa `DATABASE_URL`.

## Fluxo atual

`requisição → rota → middleware, quando houver → controller → service, quando houver → repository → PostgreSQL`

| Diretório | Responsabilidade | Exemplo |
| --- | --- | --- |
| [`routes/`](../../Backend/src/routes) | Define caminho, método e handler. | `receitaRoutes.js` monta o catálogo e o preparo. |
| [`middleware/`](../../Backend/src/middleware) | Validação e identificação provisória de usuário. | `receitaUser.js`, `compraValidator.js`. |
| [`controllers/`](../../Backend/src/controllers) | Lê a requisição e envia respostas HTTP. | `receitaController.js`. |
| [`services/`](../../Backend/src/services) | Aplica regras que não pertencem à camada HTTP ou SQL. | `receitaPreparoService.js` planeja o consumo dos lotes. |
| [`repositories/`](../../Backend/src/repositories) | Executa consultas e transações. | `receitaRepository.js`. |

Nem toda operação percorre todas as camadas: algumas rotas chamam o repository a partir do controller. A criação e o preparo de receitas usam services para normalizar dados ou planejar o consumo. As consultas de compra e estoque também usam transações quando precisam atualizar mais de uma tabela.

## Rotas montadas

| Prefixo em `app.js` | Domínio |
| --- | --- |
| `/api/auth` e `/api/users` | Registro, login e dados do usuário. |
| `/api/items` e `/api/estoque` | Itens comprados e saldos. |
| `/api/compras` | Compras e seus itens. |
| `/api/receitas` | Cadastro, consulta, edição, exclusão, disponibilidade, preparo e gastos. |
| `/api/ingredientes` | Cadastro de ingredientes. |

Confira métodos e parâmetros nos arquivos de `routes/`; esta tabela documenta apenas os prefixos. `receitaUser` e `compraUser` recebem um ID informado pelo cliente, e há rotas que usam `mockAuth` com usuário fixo. Essas peças **não verificam a identidade do solicitante**; a autenticação efetiva e as regras de autorização ainda precisam ser integradas antes de confiar nesses IDs.

## Evolução

1. Em setembro, a conexão Express/PostgreSQL e as rotas de itens estabeleceram a API (`a5f9628`); `app.js` foi separado do ponto de entrada (`bc82bf7`).
2. Ainda em setembro, controllers e repositories de compras, itens, estoque e usuários passaram a concentrar as operações dessas áreas (`b9735d1`, `c5234e4`).
3. Em outubro, a área de receitas ganhou criação (`fb6904a`), preparo transacional e verificação de disponibilidade (`c95dd12`), leitura, exclusão, edição e gastos (`e7cf9da`, `3faa9d4`, `0b6c3cd`, `cac45c7`).
4. Em 13–15/10, a autenticação existente foi reorganizada em validator, service e repository (`3f540eb`). Em 17–19/10, ingredientes e identificação de usuário nas receitas entraram na API (`82ac830`, `feb95ea`).

Os testes estão em [`Tests/`](../../Tests), por domínio. Para executá-los: `npm test -- --runInBand`; testes que exigem banco devem usar `TEST_DATABASE_URL` separado do banco de desenvolvimento.
