# Autenticação por cookie

`POST /api/auth/login` recebe `identifier` e `password`. Em caso de sucesso, grava um JWT assinado no cookie `conservia_session`, com `HttpOnly`, `SameSite=Lax` e duração de sete dias. `GET /api/auth/me` restaura o usuário e `POST /api/auth/logout` limpa o cookie no navegador.

`requireAuth` verifica a assinatura e o prazo do token e disponibiliza o ID numérico em `req.user.id`. As operações de compras, estoque, itens e receitas usam esse ID; valores `usuario_id` recebidos do cliente não definem o proprietário. Receitas sem proprietário continuam visíveis como catálogo do sistema. Alterações no catálogo global de ingredientes e a consulta de gastos gerais exigem o usuário administrador, atualmente identificado por `id = 1` no código existente.

Configure `Backend/.env` com `DATABASE_URL`, `SESSION_SECRET` de pelo menos 32 caracteres e, quando o frontend não estiver no endereço local padrão, `FRONTEND_URL`. O backend carrega esse arquivo independentemente do diretório usado para iniciar o processo. No frontend, `VITE_API_BASE_URL` aponta para a API. Os exemplos estão em `Backend/.env.example` e `Frontend/.env.example`; nunca use o banco normal como `TEST_DATABASE_URL`.

Este contrato usa JWT sem armazenamento de sessões no banco. O logout apaga o cookie do navegador, mas uma cópia anterior do token continua válida até expirar. Revogação imediata exigiria persistir e invalidar sessões no servidor.
