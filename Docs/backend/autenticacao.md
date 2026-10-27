# Autenticação por cookie

`POST /api/auth/login` recebe `identifier` e `password`. Em caso de sucesso, grava um JWT assinado no cookie `conservia_session`, com `HttpOnly`, `SameSite=Lax` e duração de sete dias. `GET /api/auth/me` restaura o usuário e `POST /api/auth/logout` limpa o cookie no navegador.

`requireAuth` verifica a assinatura e o prazo do token e disponibiliza o ID numérico em `req.user.id`. As operações de compras, estoque, itens e receitas usam esse ID; valores `usuario_id` recebidos do cliente não definem o proprietário. Receitas sem proprietário continuam visíveis como catálogo do sistema. Alterações no catálogo global de ingredientes e a consulta de gastos gerais exigem o usuário administrador, atualmente identificado por `id = 1` no código existente.

Configure `Backend/.env` com `DATABASE_URL`, `SESSION_SECRET` de pelo menos 32 caracteres e, quando o frontend não estiver no endereço local padrão, `FRONTEND_URL`. O backend carrega esse arquivo independentemente do diretório usado para iniciar o processo. No frontend, `VITE_API_BASE_URL` aponta para a API. Os exemplos estão em `Backend/.env.example` e `Frontend/.env.example`; nunca use o banco normal como `TEST_DATABASE_URL`.

Este contrato usa JWT sem armazenamento de sessões no banco. O logout apaga o cookie do navegador, mas uma cópia anterior do token continua válida até expirar. Revogação imediata exigiria persistir e invalidar sessões no servidor.

## Complementos da interface e do perfil

O frontend utiliza um único contexto em `Frontend/src/contexts/AuthContext.jsx` e o cliente HTTP de `Frontend/src/services/api.js`. O serviço `auth.js` consulta `/api/auth/me` e lê `{ user }`; `/api/users/me` continua sendo a consulta de perfil e retorna `{ data }`. A identidade disponível nos controladores é `req.user.id`, sem pressupor outros dados no middleware.

O cadastro confirma a criação da conta e encaminha para o login com o e-mail preenchido. A entrada mantém a navegação da main para `/home`, incluindo a proteção da nova página de ingredientes. Falhas ao restaurar a sessão exibem uma opção de tentar novamente; uma verificação em segundo plano preserva alterações ainda não salvas da conta conectada. Ao trocar de conta, os estados das páginas pessoais são descartados. Respostas antigas de expiração não encerram uma sessão nova.

Cadastro e edição do perfil validam os campos de identificação: nomes não contêm `@`, e e-mails precisam ter uma parte antes e outra depois de um único `@`, sem espaços internos. Nome, e-mail e tipo são normalizados; os novos cadastros utilizam `domestico` ou `comercial`. Uma conta antiga cujo nome contenha `@` continua podendo entrar pelo próprio e-mail cadastrado.

Os componentes de `express-session` e a tabela `user_sessions` da implementação anterior não fazem parte deste contrato. Nenhuma tabela de sessões deve ser criada para este login. A migração `Database/Migrations/receita_usuario_id.sql` da main continua válida para bancos que ainda não possuam esse campo.

As regras, rotas e telas de ingredientes foram preservadas da main. Esta compatibilização não altera a autorização administrativa nem a exclusão de ingredientes, e também não implementa revogação de JWT no logout.
