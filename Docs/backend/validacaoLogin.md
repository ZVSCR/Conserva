# Validação do login e das sessões

## Resultado desta entrega

- Backend: 615 testes aprovados; 13 ignorados, incluindo integrações que dependem de banco separado.
- Serviços do frontend: 14 verificações aprovadas.
- Compilação da interface aprovada. A análise estática continua apresentando avisos anteriores em componentes de estoque, perfil, extrato e receitas.
- Nenhum teste desta entrega acessou o banco normal do projeto.

Os testes de autorização usam o aplicativo, cookies e verificação de sessão reais, com repositórios simulados. Conferem operações sem sessão, identidade forjada pelo navegador, separação de contas, acesso a receitas públicas e bloqueio antecipado da exclusão de ingredientes. Os testes dos repositórios verificam os filtros de proprietário nos comandos SQL. Os testes do cliente HTTP verificam cookies, expiração e respostas atrasadas de uma sessão anterior.

Os testes de identificação também cobrem um nome de usuário antigo igual ao e-mail de outra conta: o login deve selecionar somente o proprietário do e-mail e recusar a senha da outra pessoa. Cadastro e perfil rejeitam novos nomes com `@` e e-mails sem o formato básico, antes de gravar. A edição dos dados é seguida de novo login por nome e por e-mail para conferir a normalização.

## Conferência pelo navegador

Foi utilizado o frontend e o backend da aplicação, com contas, estoque e sessões somente em memória. Os seguintes fluxos foram conferidos:

1. Abrir `/estoque` sem sessão encaminha para `/login`.
2. Cadastrar uma conta mostra a confirmação no login e preenche seu e-mail.
3. Uma senha incorreta apresenta erro e mantém a página de login, sem colocar a senha na URL.
4. Uma entrada válida abre o estoque e mostra o nome da conta.
5. Atualizar a página recupera a sessão e o estoque da mesma conta.
6. O perfil e as configurações consultam as rotas com o cookie da sessão.
7. Sair retorna ao login; voltar pelo histórico não reabre os dados pessoais.
8. Entrar com uma segunda conta mostra somente o estoque fictício dessa conta.
9. Expirar as sessões e abrir uma página pessoal retorna ao login com a mensagem de expiração.

A conferência também identificou uma tentativa de interpretar uma resposta `401` como uma lista de produtos. A tela de estoque agora interrompe esse processamento e cancela a consulta quando é desmontada.

### Reproduzir sem Neon

Em dois terminais PowerShell, a partir da raiz:

```powershell
node Tests/authTests/browserTestServer.cjs
```

```powershell
$env:VITE_API_BASE_URL='http://localhost:3107'
npm --prefix Frontend run dev -- --host 127.0.0.1 --port 5178 --strictPort
```

Abra `http://localhost:5178/estoque`. Cadastre duas contas fictícias; cada conta recebe um item de estoque de demonstração. O servidor cobre cadastro, login, perfil, leitura de preferências e estoque; não serve para validar alterações de compras, receitas ou preferências. Para simular expiração durante o uso:

```powershell
Invoke-WebRequest -Uri 'http://localhost:3107/__qa/expire-sessions' -Method Post
```

Essa rota existe somente no servidor de QA, restrito ao computador local. Encerre os dois processos com `Ctrl+C`. Nenhum dado demonstrativo é persistido, e as variáveis acima valem somente para esses processos.

## Validação ainda pendente

A execução com Neon continua dependendo da configuração do backend acordada pelo grupo: URL válida do banco, carregamento do ambiente, chave de sessão, origem do frontend e tabela `user_sessions`. Esses ajustes não foram aplicados.

Depois de preparar um Neon exclusivo de testes com o esquema atual, defina `TEST_DATABASE_URL` no terminal e execute:

```powershell
npm test -- --runInBand Tests/authTests/session.integration.test.js
```

Essa integração usa o armazenamento real e duas contas temporárias. A conferência completa pelo navegador com o banco de testes real e a infraestrutura de deploy continua pendente. Os resultados em memória não confirmam essas integrações.
