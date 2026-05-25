# SignalR Chat Monorepo

Workspace com dois projetos:

- backend: API ASP.NET Core + SignalR + SQLite
- frontend: React + Vite + SignalR client

## Start rapido

Prerequisitos:

- .NET 10 SDK
- Node.js 20+
- npm 10+

### 1. Subir o backend

Em um terminal, na pasta backend:

```bash
cd backend
dotnet restore
dotnet run
```

API local esperada:

- http://localhost:5267

### 2. Configurar e subir o frontend

Em outro terminal, na pasta frontend:

```bash
cd frontend
npm install
copy .env.example .env
```

Edite o arquivo `.env` e confirme:

```bash
VITE_API_BASE_URL=http://localhost:5267
```

Depois rode:

```bash
npm run dev
```

App local:

- http://localhost:5173

## Fluxo funcional

1. Abrir o frontend em http://localhost:5173.
2. Registrar usuario (ou fazer login).
3. Entrar em uma sala.
4. Enviar mensagens em tempo real.

## Comandos uteis

Backend:

```bash
cd backend
dotnet run
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
npm run test:run
```

## Estrutura

- [backend/README.md](backend/README.md): detalhes da API, JWT, SignalR e banco
- [frontend/README.md](frontend/README.md): detalhes do app React, scripts e testes
