# Validação do login compatível com a main

## Contrato utilizado

O backend mantém o JWT da main no cookie `conservia_session`, com validade de sete dias. A restauração utiliza `GET /api/auth/me` e `{ user }`; o perfil utiliza `GET /api/users/me` e `{ data }`. O logout mantém a limpeza do cookie já existente, sem acrescentar revogação no servidor.

Os testes de autenticação conferem cadastro seguido de login, senha incorreta, duas contas, perfil completo, expiração de JWT e ausência de senha/hash nas respostas. Os testes de identificação preservam o caso em que um nome antigo coincide com o e-mail de outra conta e conferem novo login após editar nome/e-mail. As verificações do cliente HTTP cobrem cookies, ausência de cache, falhas de rede e respostas atrasadas de uma sessão anterior.

## Executar as verificações

A partir da raiz:

```powershell
npm test -- --runInBand
node --test Tests/frontendTests/*.checks.mjs
npm --prefix Frontend run build
npm --prefix Frontend run lint
```

Os testes comuns recebem uma chave exclusiva e uma URL fictícia no processo de testes. Os repositórios são simulados; nenhum `.env` é modificado. As integrações ficam ignoradas sem `TEST_DATABASE_URL`. Essa variável deve apontar para um banco exclusivo de testes, nunca para o banco normal do projeto.

## Limite da validação e pendência herdada

Antes da reconciliação, a main `6afecdf` apresentou 575 testes aprovados, 13 ignorados e duas falhas em `Tests/ingredienteTests/ingredienteRoutes.test.js`. São os casos de PATCH que ainda esperam a identificação antiga pela URL, enquanto o módulo já utiliza a sessão. Essa pendência foi preservada, conforme a decisão de tratar ingredientes em outra tarefa; seus testes não foram excluídos nem alterados para ocultar as falhas.

Após a reconciliação, a suíte completa apresentou 627 testes aprovados, as mesmas duas falhas prévias de ingredientes e 14 ignorados. As 14 verificações dos serviços do frontend e a compilação passaram. O lint mantém quatro avisos anteriores nos componentes de estoque, extrato e receitas. Os resultados completos ficam registrados no relatório local da tarefa.

A integração real com Neon continua pendente. `session.integration.test.js` foi adaptado para JWT e dados de duas contas; não depende de tabela de sessões. A integração de atualização de receitas envia o proprietário exigido pelo repositório.

## Conferência local pelo navegador

O servidor de QA utiliza o backend real e seu JWT, com contas e estoques fictícios em memória. Em dois terminais PowerShell, a partir da raiz:

```powershell
node Tests/authTests/browserTestServer.cjs
```

```powershell
$env:VITE_API_BASE_URL='http://localhost:3107'
npm --prefix Frontend run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Abra `http://localhost:5178/home`. Confira o encaminhamento ao login, cadastro com confirmação, senha incorreta, entrada em `/home`, atualização da página, perfil e troca entre duas contas. No estoque, cada conta recebe um item fictício com seu nome. O helper permite editar perfil e preferências, mas não cobre compras, preparo de receitas ou ingredientes.

Para instalar um JWT já expirado no navegador e conferir a rejeição, abra `http://localhost:3107/__qa/expire-session`. Essa rota existe somente no processo local de QA, que redireciona de volta à interface. Encerre os dois processos com `Ctrl+C`; nada é persistido.

Uma conferência neste ambiente comprova apenas o fluxo com banco simulado. Ela não confirma as credenciais, a integração Neon nem a infraestrutura de deploy.

Na conferência desta reconciliação foram verificados: cadastro com confirmação e e-mail preenchido, senha incorreta, entrada em `/home`, restauração ao atualizar, edição do perfil com atualização do cabeçalho, estoque de uma segunda conta, JWT expirado e recuperação pelo botão de tentar novamente após interromper e reiniciar o servidor de QA.
