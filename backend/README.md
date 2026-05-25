# Backend - Chat API + SignalR

API em ASP.NET Core para autenticacao com JWT e chat em tempo real com SignalR, usando SQLite para persistencia de usuarios e mensagens.

## Visao geral

Este projeto expoe:

- endpoints HTTP para registro e login
- um Hub SignalR protegido por JWT
- persistencia de historico das salas

## Tecnologias

- .NET 10 (ASP.NET Core minimal API)
- SignalR
- JWT Bearer Authentication
- Entity Framework Core
- SQLite
- BCrypt para hash de senha

## Estrutura

- Program.cs: configuracao da aplicacao, endpoints e ChatHub
- Data/AppDbContext.cs: contexto do EF Core
- Services/TokenService.cs: geracao de token JWT
- Models/Message.cs e User: entidades de dominio
- appsettings.json: configuracoes gerais e chave JWT

## Requisitos

- SDK .NET 10 instalado

## Como executar

1. Restaurar dependencias:

```bash
dotnet restore
```

2. Executar a API:

```bash
dotnet run
```

3. URL local (perfil HTTP):

- http://localhost:5267

## Configuracao JWT

A chave esta em appsettings.json:

```json
"Jwt": {
  "Key": "CHAVE_SUPER_SECRETA_DE_32_CHARS_MINIMO_123456"
}
```

Para ambientes reais, mova essa chave para variavel de ambiente/secrets e use valor forte.

## Banco de dados

- Provider: SQLite
- Arquivo: chat.db (na pasta do backend)

A aplicacao usa o contexto AppDbContext para Users e Messages.

## Endpoints HTTP

### POST /register

Registra um usuario novo.

Body:

```json
{
  "username": "alice",
  "passwordHash": "123456"
}
```

Resposta:

- 200 OK quando cadastrado
- 400 BadRequest se usuario ja existe

### POST /login

Autentica usuario e retorna token JWT.

Body:

```json
{
  "username": "alice",
  "passwordHash": "123456"
}
```

Resposta 200:

```json
{
  "token": "<jwt>",
  "username": "alice"
}
```

Resposta:

- 401 Unauthorized para credenciais invalidas

## Hub SignalR

- Rota: /chat
- Requer autenticacao (Authorize)

### Metodos do Hub

- JoinRoom(room)
  - adiciona conexao ao grupo da sala
  - envia LoadHistory para o caller com as ultimas 50 mensagens
  - emite UserJoined para o grupo

- SendMessage(room, message)
  - persiste mensagem no banco
  - emite ReceiveMessage para o grupo

### Eventos enviados para o frontend

- LoadHistory(history)
- ReceiveMessage(message)
- UserJoined(username)

## CORS

CORS configurado para aceitar frontend em:

- http://localhost:5173

## Observacoes

- O pacote Microsoft.AspNetCore.SignalR aparece no projeto e pode gerar warning de dependencia possivelmente desnecessaria em runtime atual do ASP.NET Core.
- Para producao, configure issuer/audience no JWT e secret fora do repositorio.
