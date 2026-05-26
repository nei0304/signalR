# Backend - Chat API + SignalR

API ASP.NET Core com autenticacao JWT, refresh token, persistencia em MySQL e chat em tempo real com SignalR.

## Visao geral

O backend expoe:

- Endpoints de autenticacao e sessao
- Hub SignalR protegido por JWT
- Persistencia de usuarios, mensagens e refresh tokens
- Swagger em ambiente Development

## Stack

- .NET 10 (minimal API)
- Entity Framework Core + Pomelo MySQL
- JWT Bearer Authentication
- SignalR
- BCrypt

## Estrutura

- Program.cs: configuracao da aplicacao, endpoints e ChatHub
- Data/AppDbContext.cs: mapeamento EF Core
- Services/TokenService.cs: criacao e renovacao de tokens
- Models/Message.cs: entidades User, Message e RefreshToken
- Migrations/: historico de migracoes
- run-backend.ps1: script para executar sem conflito de processo

## Pre-requisitos

- SDK .NET 10+
- MySQL em execucao

## Configuracao local

1. Restaurar dependencias:

```bash
dotnet restore
```

2. Definir chave JWT (uma unica vez por maquina):

```bash
dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "COLOQUE_AQUI_UMA_CHAVE_GRANDE_DE_PELO_MENOS_64_BYTES_PARA_HS512"
```

3. Validar connection string em appsettings.json (ConnectionStrings:DefaultConnection).

4. Aplicar migracoes:

```bash
dotnet ef database update
```

## Como executar

No diretorio backend:

```bash
./run-backend.ps1
```

Se estiver no diretorio raiz do repositorio:

```bash
./backend/run-backend.ps1
```

API local:

- http://localhost:5267

Swagger (Development):

- http://localhost:5267/swagger

## JWT

- A chave nao deve ficar no repositorio.
- Em desenvolvimento: user-secrets
- Em producao: variavel de ambiente Jwt__Key

## Banco de dados

- Provider: MySQL
- Tabelas principais: Users, Messages, RefreshTokens
- Connection string: appsettings.json

## Endpoints

### POST /register

Cria usuario.

Request:

```json
{
  "username": "alice",
  "passwordHash": "123456"
}
```

Retornos:

- 200: usuario criado
- 400: usuario ja existe

### POST /login

Autentica e retorna sessao.

Request:

```json
{
  "username": "alice",
  "passwordHash": "123456"
}
```

Response 200:

```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<refresh>",
  "user": {
    "id": 1,
    "username": "alice"
  }
}
```

### POST /refresh

Renova token via refresh token.

### GET /me

Retorna dados do usuario autenticado.

### POST /logout

Revoga refresh token enviado no body.

## SignalR

- Hub: /chat
- Requer token JWT
- Metodos:
  - JoinRoom(room)
  - SendMessage(room, message)
  - Typing(room)
- Eventos enviados:
  - LoadHistory
  - ReceiveMessage
  - UserJoined
  - UserTyping
  - UserLeft

## CORS

Origens liberadas:

- http://localhost:5173
- http://127.0.0.1:5173
- https://localhost:5173
- https://127.0.0.1:5173

## Troubleshooting

### Erro de arquivo bloqueado no build

Se aparecer erro de backend.exe em uso, existe outro processo rodando.

Use:

```bash
./run-backend.ps1
```

Esse script encerra o processo anterior antes de subir a API.

### Erro 500 no login por chave JWT

Se a chave for curta para HS512, o login pode falhar com status 500.

Defina chave forte em user-secrets com tamanho grande (recomendado 64+ bytes).
