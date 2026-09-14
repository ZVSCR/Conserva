# Sistema básico de sign in + register
## Registro de Usuário
Fluxo de registro:
```
username + email + tipo + senha -> validar entrada -> bcrypt.hash -> insere no BD -> 201 Created
```
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
## Limitações
Nesta etapa do MVP, o login realiza validação de credenciais e devolve dados básicos do usuário ao cliente. A persistência segura do estado autenticado por sessão será implementada posteriormente. Portanto, a identificação de usuário utilizada pelo CRUD nesta versão ainda não configura mecanismo de autorização de recursos.

Autenticação persistente e proteção de recursos por identidade ainda não implementados. A validação básica de credencias é o que compõe o CRUD funcional.

# Arquitetura Final Proposta para o CRUD
```
                  PostgreSQL
                       ↑
                       │
              ┌────────┴────────┐
              │                 │
          register()         login()
              │                 │
          bcrypt.hash       bcrypt.compare
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
```