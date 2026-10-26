# Cadastro, login e sessões

O cadastro recebe `username`, `email`, `password` e `tipo` (`domestico` ou `comercial`). O login recebe `identifier` (nome ou e-mail) e `password`. Contas antigas podem continuar fazendo login com o tipo já registrado.

## Configuração local

1. Instale as dependências na raiz com `npm install` e no frontend com `npm --prefix Frontend install`.
2. Disponibilize `DATABASE_URL`, `SESSION_SECRET` e `FRONTEND_ORIGIN` no processo do backend, tomando `.env.example` como referência. A localização definitiva do `.env` ainda será decidida pelo grupo: `dotenv.config()` procura na pasta de execução, enquanto o arquivo local existente está em `Backend/`. Esta entrega não altera esse carregamento nem as credenciais.
3. Gere uma chave aleatória para `SESSION_SECRET` com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Guarde o resultado somente no `.env`.
4. Execute `Database/Create/session.sql` no banco existente. Para um banco novo, a tabela também está em `Database/Create/merge.sql`. Não execute o script completo de criação em um banco já preenchido.
5. Inicie a API pela raiz com `node Backend/src/index.js` e o frontend com `npm --prefix Frontend run dev`.

O endereço padrão autorizado é `http://localhost:5173`. Ajuste `FRONTEND_ORIGIN` se o Vite utilizar outra porta. O backend exige uma chave de sessão de pelo menos 32 bytes e não cria a tabela automaticamente. As alterações de configuração e de banco não são aplicadas pelos testes.

## Operações de sessão

- `POST /api/auth/register`: cadastra, sem iniciar sessão automaticamente.
- `POST /api/auth/login`: confere a senha, gera uma sessão nova e envia o cookie `conservia.sid`.
- `GET /api/users/me`: retorna os dados públicos do usuário da sessão, ou `401` quando não há sessão válida.
- `POST /api/auth/logout`: encerra a sessão e remove o cookie; pode ser chamado mesmo sem usuário conectado.

O navegador deve enviar `credentials: 'include'` nas chamadas de sessão. A sessão guarda apenas `userId` no banco, além dos dados do cookie. A validade padrão é fixa em 24 horas e pode ser configurada por `SESSION_MAX_AGE_MS`. Reiniciar o servidor não apaga sessões persistidas, desde que a chave e o banco sejam mantidos.

O cookie usa `HttpOnly` e `SameSite=Lax`; com `NODE_ENV=production`, exige HTTPS. Antes de um deploy, configure o HTTPS e o eventual proxy conforme a infraestrutura escolhida. Solicitações de alteração em `/api` rejeitam uma origem de navegador diferente da configurada.

## Escopo desta entrega

O frontend usa `Frontend/src/services/auth.js` para centralizar as chamadas e `AuthProvider` para compartilhar o usuário, o estado de verificação e as operações de login e saída. Ao atualizar a página, a aplicação consulta `/api/users/me`. O cookie permanece sob controle do navegador; senhas e comprovantes de sessão não são salvos em `localStorage`.

Depois do cadastro, a tela confirma o resultado e encaminha para o login. Depois do login, abre o estoque. As páginas pessoais aguardam a consulta inicial de sessão e encaminham visitantes para o login. O cabeçalho compartilhado apresenta a conta conectada e o botão de sair. Uma resposta `401` durante o uso encerra o estado local de autenticação e informa a expiração. Ao trocar de conta, os estados das páginas pessoais são descartados.

`Frontend/src/services/apiClient.js` envia cookies e desativa o cache das chamadas. O endereço da API é definido por `VITE_API_BASE_URL`, no `.env` do frontend, sem `/api` no final. O Vite normalmente usa a porta `5173`; a API usa `3000`. As portas podem ser diferentes, desde que os endereços configurados correspondam.

Compras, itens, estoque, receitas, histórico e preferências obtêm a identidade da sessão. Enviar `usuario_id` no corpo ou na URL não troca essa identidade. As consultas e alterações verificam o proprietário. Receitas públicas continuam consultáveis por usuários conectados, mas só receitas próprias podem ser editadas; o histórico e os gastos de preparo pertencem à conta conectada. O catálogo de ingredientes continua compartilhado.

A exclusão de ingredientes retorna `403` com a mensagem `A exclusão de ingredientes está indisponível.`, antes de consultar o banco ou identificar o usuário. O código e a estrutura de exclusão existentes foram preservados.

## Validação

Os testes Jest comuns usam sessões em memória por meio de `Tests/setupSession.js`. Há testes com cookies reais de duas contas e consultas simuladas para conferir o encaminhamento da identidade, além de verificações dos filtros de proprietário no SQL. Isso não comprova a execução desses comandos no Neon.

Execute `npm test -- --runInBand` para os testes do backend, `node --test Tests/frontendTests/*.checks.mjs` para os serviços do frontend e `npm --prefix Frontend run build` para a compilação. Os testes `*.integration.test.js` ficam ignorados quando `TEST_DATABASE_URL` não está definida. Nunca aponte essa variável para o banco normal do projeto.

`Tests/authTests/session.integration.test.js` prepara o fluxo de cadastro/login, persistência real de sessões, separação de preferências, saída e expiração contra um Neon exclusivo de testes. Ele exige o esquema e a tabela de sessões previamente criados e remove apenas seus próprios registros. Essa suíte ainda aguarda a configuração de um ambiente de testes válido.

O roteiro e os limites da conferência pelo navegador estão em [validacaoLogin.md](validacaoLogin.md).
