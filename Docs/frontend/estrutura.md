# Estrutura do frontend

O frontend usa React, Vite e React Router. [`main.jsx`](../../Frontend/src/main.jsx) monta a aplicação; [`App.jsx`](../../Frontend/src/App.jsx) define as URLs e escolhe a página exibida.

| Diretório | Responsabilidade |
| --- | --- |
| [`pages/`](../../Frontend/src/pages) | Telas ligadas às rotas: início, login, registro, dados e preferências do usuário, estoque, compras, receitas e histórico de refeições. |
| [`components/`](../../Frontend/src/components) | Partes de tela organizadas por `usuario`, `estoque`, `compras`, `receitas` e `shared`. |
| [`services/`](../../Frontend/src/services) | Helpers de API, como `userPreferences.js`. |
| [`assets/`](../../Frontend/src/assets) | Imagens e ícones. |

As páginas combinam componentes do próprio domínio; por exemplo, `pages/Receitas/PageViewReceita.jsx` usa o painel de catálogo e `pages/RefeicoesPreparadas/PageRefeicoesPreparadas.jsx` usa o painel de histórico. Componentes compartilhados concentram cabeçalho, navegação inferior e rodapé.

## Rotas de tela

`/home`, `/login`, `/registrar`, `/alterar-dados`, `/configuracoes`, `/estoque`, `/extrato-compras`, `/nova-compra`, `/receitas` e `/historico-refeicoes`. A raiz redireciona para `/home`; um caminho desconhecido mostra a página 404. Consulte [`App.jsx`](../../Frontend/src/App.jsx) para os nomes exatos e componentes associados.

## Integração com a API

As chamadas a dados pessoais usam `services/api.js`, que envia o cookie com `credentials: 'include'` e usa `VITE_API_BASE_URL` (padrão `http://localhost:3000`). O usuário vem da sessão; as telas não enviam `usuario_id`. O contexto de autenticação restaura a sessão ao abrir a aplicação e redireciona ao login quando uma chamada pessoal recebe `401`. O histórico consulta `/api/receitas/preparadas`.

## Evolução

1. A estrutura React/Vite surgiu em 31/08 (`efa04bd`); login e registro entraram no começo de setembro (`4644897`).
2. Em setembro, chegaram as telas de dados do usuário, estoque, compras e configurações (`a923c33`, `2520c55`, `c5234e4`, `325f381`).
3. Em 12/10, entraram o catálogo de receitas e o histórico de refeições preparadas (`caa75c7`, `432c8a8`).
4. Em 15/10, os componentes foram agrupados por domínio (`843826c`). Em 19/10, o cadastro de receitas pelo modal foi integrado ao catálogo (`89638ff`).
5. Em 26/10, as telas protegidas passaram a usar o cookie de sessão para compras, estoque e receitas; o cabeçalho oferece saída da conta.

O [README principal](../../README.md) inclui ideias de OCR e sugestão automática de receitas. Não há telas completas para esses fluxos neste recorte.
