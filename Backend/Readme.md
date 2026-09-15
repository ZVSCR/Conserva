# Sistema básico de registro e validação de credenciais
Esta implementação traz o fluxo mínimo de *registro de usuário* e *validação de credenciais no login*, necessários para o MVP do CRUD.

Nesta etapa, não há persistência de autenticação por sessão ou token. Após login, os dados de usuário são enviados ao frontend, que mantém o usuário atual apenas no estado da aplicação.
---
## Registro de Usuário
### Endpoint
`POST /api/auth/register`
### Fluxo
```
username + email + tipo + senha -> valida entrada -> bcrypt.hash -> INSERT no PostgreSQL -> 201 Created
```
O usuário fornece:
```
{
    "username": "fulano",
    "email": "email@dofulano.com",
    "tipo": "adm",
    "password": "senha"
}
```
Antes do registro, os dados são validados conforme requisitos e limites definidos pela tabela `users`.

A senha nunca é armazenada diretamente no banco de dados. O backend utiliza `bcrypt` para gerar seu hash antes da inserção:
```
password -> bcrypt.hash() -> password_hash -> PostgreSQL
```
Em caso de sucesso, a API retorna `201 Created` e os dados básicos do usuário criado.
O campo `password_hash` nunca é enviado na resposta.
### Possíveis respostas
| *Status* | *Situação* |
|--- | --- |
| `201 Created` | Usuário registrado com sucesso |
| `400 Bad Request` | Dados obrigatórios ausentes ou inválidos |
| `409 Conflict` | Dados obrigatórios ausentes ou inválidos |
| `500 Internal Server Error` | Falha inesperada de infraestrutura |
---
## Validação de Credenciais
### Endpoint
`POST /api/auth/login`
O login aceita tanto `username` quanto `email` através de um campo único chamado `identifier`.
Exemplo:
```
{
    "identifier": "fulano",
    "password": "senha"
}
```
e também:
```
{
    "identifier": "email@fulano.com",
    "password": "senha"
}
```
### Fluxo
```
identifier + password
        ↓
validar entrada
        ↓
buscar usuário por username/email
        ↓
usuário existe?
   ┌────┴────┐
  não       sim
   ↓         ↓
  401   bcrypt.compare()
             ↓
        senha válida?
        ┌────┴────┐
       não       sim
        ↓         ↓
       401    retorna user
                  ↓
               200 OK
```
O backend:
1. valida e normaliza o identificador;
2. procura um usuário correspondente no PostgreSQL;
3. recupera `password_hash`;
4. utiliza `bcrypt.compare()` para verificar a senha fornecida;
5. retorna os dados básicos do usuário em caso de sucesso.

Para evitar exposição de informação sobre contas existentes, usuário inexistente e senha incorreta produzem a mesma resposta de autenticação inválida.

*Retorno*
Em um login válido:
```
{
    "message": "Login efetuado. Seja bem-vindo!",
    "user": {
        "id": 7,
        "username": "fulano",
        "email": "fulano@email.com",
        "tipo": "adm"
    }
}
```
O `password_hash` nunca é retornado ao cliente.
Em suma, o que acontece aqui é que o usuário fornecerá informações de registro, que serão adicionadas ao banco de dados em PostgreSQL. Depois de se registrar, ainda será necessário que o usuário faça login (valide suas credenciais)

## Validação de Credenciais
Fluxo de login:
```
identificador + senha -> valida entrada -> bcrypt.compare -> usuário existe?
não -> 401 / sim -> devolve usuário -> 200 OK (frontend "entra")
```

Integração com Frontend:
```
POST /login

Frontend <- user
guarda user em currentUser -> vai para a aplicação
```

A função de `login()` é validar as credenciais, encontrar registro de usuário, retornar seus dados básicos ao Frontend e permitir o acesso ao CRUD pelo usuário. Como MVP de um CRUD funcional, não é necessário implementar `logout`. Como os dados de usuário são armazenados na memória de estado do React, ao atualizar o servidor todas as informações são excluídas. `logout` ocorre sempre e de forma automática.

### Retorno de `user.id`
No contrato do CRUD, realizar login sempre retornará `user.id`. Isso permite o fluxo:
```
login -> user.id = 7 -> frontend -> CRUD -> user_id = 7
```
### Possíveis respostas
| *Status* | *Situação* |
|--- | --- |
| `200 OK` | Credenciais válidas |
| `400 Bad Request` | Dados ausentes ou inválidos |
| `401 Unauthorized` | Identificador ou senha inválidos |
| `500 Internal Server Error` | Falha inesperada de infraestrutura |
---
## Integração com o Frontend
Nesta versão do MVP, o backend não cria sessão nem token de autenticação.
Após
`POST /api/auth/login`
o backend devolve:
`user`
O frontend mantém esse objeto em memória:
```
login
  ↓
backend retorna user
  ↓
frontend armazena currentUser
  ↓
usuário acessa a aplicação
```
Enquanto a aplicação estiver aberta, currentUser pode ser utilizado pelo frontend para identificar o usuário durante o uso do CRUD.

Ao recarregar ou reinicializar a aplicação, esse estado em memória é perdido.

Não há endpoint de logout nesta versão. Um mecanismo explícito de logout será necessário quando autenticação persistente por sessão ou token for implementada.
---
### Retorno de user.id
O contrato de login sempre retorna o identificador do usuário: `user.id`

Isso permite ao restante do CRUD utilizar o usuário correspondente:
```
login
  ↓
user.id = 7
  ↓
frontend
  ↓
CRUD
  ↓
user_id = 7
```
Esse identificador pode ser utilizado temporariamente pelos módulos de inventário, preferências e demais recursos associados ao usuário.
---
## Limitações do MVP
Nesta etapa, o login realiza apenas validação de credenciais e devolve os dados básicos do usuário ao cliente.

Ainda não foram implementados:
- sessões
- tokens de autenticação
- persistência de login
- logout no backend
- proteção de rotas autenticadas
- autorização de recursos por identidade

A autenticação persistente e a proteção dos recursos pessoais deverão ser implementadas em uma etapa posterior.

Esta limitação é conhecida e aceita no escopo atual do MVP, cujo objetivo é disponibilizar o fluxo básico necessário para o funcionamento do CRUD.
---
## Arquitetura atual

                  PostgreSQL
                       ↑
                       │
              ┌────────┴────────┐
              │                 │
          register()         login()
              │                 │
          bcrypt.hash()     bcrypt.compare()
              │                 │
              └──── authController
                       ↑
                   authRoutes
                       ↑
                    frontend
                       │
                       ↓
                  currentUser
                       │
             ┌─────────┴──────────┐
             ↓                    ↓
        inventário           preferências
---
## Testes
A implementação possui testes automatizados utilizando:
```
Jest
+
Supertest
```
Os testes utilizam mock do acesso ao PostgreSQL, permitindo validar o comportamento da API sem depender de uma instância real do banco de dados.

São testados cenários de:
- registro válido
- campos obrigatórios ausentes
- campos inválidos
- limites de tamanho
- username/e-mail duplicado
- login por username
- login por e-mail
- senha incorreta
- usuário inexistente
- falhas de banco
- não exposição de password_hash

Para executar:
```
npm test
```