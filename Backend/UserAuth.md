Este documento serve para descrever o básico da implementação de autenticação de usuário.
## Autenticação: quem é este usuário?
Fluxo de operações:
1. Usuário envia email/username + senha
2. Servidor verifica credenciais
3. Sessão criada
4. Usuário autenticado
## Arquitetura a ser implementada
### Registro
`username + email + senha -> validação -> bcrypt.hash() -> PostgreSQL`
### Login
`email/username + senha -> buscar usuário -> bcrypt.compare() -> criar sessão -> cookie com session ID`
### Requisições Futuras
`cookie ->  Express Session -> req.session.userId -> usuário autenticado`
### Logout
`destruir sessão`

Com essas decisões de arquitetura, haverão quatro endpoints:
- `POST (/api/auth/register)`: Criar usuário
- `POST (/api/auth/login)`: Fazer login
- `GET (/api/auth/me)`: Obter usuário autenticado
- `POST (/api/auth/logout)`: Encerrar sessão

E também um middleware `requireAuth`.

## Estrutura de Diretórios
``` 
src/
│
├── index.js
│
├── config/
│   └── database.js
│
├── routes/
│   └── authRoutes.js
│
├── controllers/
│   └── authController.js
│
└── middleware/
    └── requireAuth.js
```

## Formato ideal do banco de dados
Para a manipulação precisa e segura dos dados salvos em PostgreSQL, temos dois requisitos:
- username é único e não contém @;
- email é único.
Vale ressaltar que a unicidade desses dados independem de maiúsculos/minúsculos.

Com isso, a tabela de usuários deve ser representada da seguinte forma:
```SQL
CREATE TABLE users {
    id BIGSERIAL PRIMARY KEY,

    username VARCHAR(30) NOT NULL,
    email VARCHAR(225) NOT NULL,
    password_hash(225) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEAFULT NOW(),
}

CREATE UNIQUE INDEX users_username_lower_unique
ON users (LOWER(username));

CREATE UNIQUE INDEX users_email_lower_unique
ON users (LOWER(email));
```

## Bibliotecas instaladas na implementação
```
express
-> servidor e rotas

pg
-> PostgreSQL

bcrypt
-> hash e comparação de senhas

express-session
-> gerenciamento de sessão

connect-pg-simple
-> salvar sessões no PostgreSQL

dotenv
-> variáveis de ambiente
```
## Responsabilidade de cada implementação
`database.js`
Responsável por:
```
Node.js <-> PostgreSQL
```

`authRoutes.js`
Responsável por:
```
/register
/login
/logout
/me
```

`authController.js`
Responsável por:
```
register()
login()
logout()
me()
```

`requireAuth.js`
Responsável por bloquear endpoints que exigem login.