# Cadastro, login e sessões

O cadastro recebe `username`, `email`, `password` e `tipo` (`domestico` ou `comercial`). O login recebe `identifier` (nome ou e-mail) e `password`. Contas antigas podem continuar fazendo login com o tipo já registrado.

## Configuração local

1. Instale as dependências na raiz com `npm install` e no frontend com `npm --prefix Frontend install`.
2. Configure `DATABASE_URL`, `SESSION_SECRET` e `FRONTEND_ORIGIN` no `.env` da raiz, tomando `.env.example` como referência. Preserve as credenciais que já utiliza.
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

O cookie usa `HttpOnly` e `SameSite=Lax`; com `NODE_ENV=production`, exige HTTPS. Antes de um deploy, configure o HTTPS e o eventual proxy conforme a infraestrutura escolhida. Solicitações de alteração às rotas de autenticação e perfil rejeitam uma origem de navegador diferente da configurada.

## Escopo desta entrega

O frontend usa `Frontend/src/services/auth.js` para centralizar as chamadas e `AuthProvider` para compartilhar o usuário, o estado de verificação e as operações de login e saída. Ao atualizar a página, a aplicação consulta `/api/users/me`. O cookie permanece sob controle do navegador; senhas e comprovantes de sessão não são salvos em `localStorage`.

As telas exibem o resultado do cadastro e login. O serviço de saída já está disponível, mas o botão de sair e os redirecionamentos automáticos ficam para a etapa 5. O endereço da API pode ser configurado por `VITE_API_BASE_URL` no ambiente do frontend.

As etapas 1–3 preparam o cadastro, a sessão e a conexão do frontend. A migração das demais rotas e telas que ainda usam usuário fixo pertence à etapa 4. A proteção da navegação e o botão de sair pertencem à etapa 5; portanto, esta entrega ainda não torna toda a aplicação privada.

Os testes Jest usam armazenamento de sessão em memória por meio de `Tests/setupSession.js`, sem acessar o armazenamento real de sessões. A integração com Neon e navegador deve ser validada com um banco de testes separado.

Execute `npm test -- --runInBand` para os testes do backend e `node --test Tests/frontendTests/*.checks.mjs` para os contratos do serviço do frontend. `npm --prefix Frontend run build` verifica a compilação da interface.
