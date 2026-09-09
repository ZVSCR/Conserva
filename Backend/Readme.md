# Tutorial de teste do sistema de autenticação
## Testar conexões Express<->PostgreSQL
Primeiro passo:
`node src/index.js`
É esperado no terminal:
```
PostgreSQL conectado: { now: ... }
Servidor rodando na porta 3000
```
Com isso, sabe-se que a infraestrutura básica funciona.

## Rotas de autenticação
Será possível realizar os seguintes comandos de API:
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Papel de `POST /register`
Ele recebe os dados em formato JSON:
```JSON
{
    "username": "fulano",
    "email": "fulano@yahoo.br",
    "password": "vocenuncasabera"
}
```
A rota se chama `register`, e toda a lógica de validação e inserção de dados ainda precisa ser implementada.

### Papel de `POST /login`
Recebe:
```JSON
{
    "identifier": "irmaoDoFulano"/"email@doirmao.com",
    "password": "senha"
}
```
Dessa forma, `identifier` representa dois contextos: login por email ou por username.
O controller fará busca de usuário, comparação, criar sessão e fornecer resposta.

### Papel de `POST /logout`
Esta rota exige autenticação, pois não faz sentido destruir o login de um usuário não autenticado.
Pós autenticação, o controller estará autorizado a destruir a sessão.

### Papel de `GET /me`
Esta rota responde quem é o usuário autenticado. Isso significa que o usuário também deve estar autenticado.
Se há sessão autenticada, retorna o username, caso não haja, retorna exceção
