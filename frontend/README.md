# Frontend - Chat React + SignalR

Aplicacao React para chat em tempo real com SignalR, autenticacao por JWT e persistencia de sessao no navegador.

## Visao geral

O frontend possui tres fluxos principais:

- autenticacao (login/cadastro)
- escolha de sala
- chat em tempo real

Quando autenticado, o app conecta no Hub SignalR e sincroniza historico/mensagens da sala.

## Tecnologias

- React 19 + TypeScript
- Vite
- @microsoft/signalr
- jwt-decode
- Vitest + Testing Library

## Estrutura

- src/App.tsx: fluxo de telas e estados principais
- src/hooks/useSignalR.ts: conexao SignalR, eventos e envio de mensagem
- src/services/auth.ts: chamadas de register/login e decode do token
- src/services/session.ts: persistencia de sessao no localStorage
- src/App.test.tsx: testes de integracao do fluxo principal
- src/hooks/useSignalR.test.ts: testes de reconexao e comportamento do hook

## Requisitos

- Node.js 20+
- npm 10+
- backend rodando localmente

## Configuracao

Opcionalmente, defina a URL da API via variavel de ambiente:

```bash
copy .env.example .env
```

No `.env`, use:

```bash
VITE_API_BASE_URL=http://localhost:5267
```

Se nao definir, o frontend usa por padrao `http://localhost:5000`.

## Como executar

1. Instalar dependencias:

```bash
npm install
```

2. Rodar em desenvolvimento:

```bash
npm run dev
```

3. Acessar no navegador:

- http://localhost:5173

## Scripts

- npm run dev: inicia servidor de desenvolvimento
- npm run build: type-check e build de producao
- npm run preview: preview do build
- npm run lint: lint do projeto
- npm run test: modo watch dos testes
- npm run test:run: executa testes uma vez

## Integracao com backend

### Endpoints HTTP usados

- POST /register
- POST /login

### Hub SignalR usado

- /chat

### Eventos recebidos

- LoadHistory
- ReceiveMessage
- UserJoined

### Metodos invocados

- JoinRoom
- SendMessage

## Persistencia de sessao

Chave usada no localStorage:

- signalr-chat-session

Dados salvos:

- token
- username
- room
- joined

## Testes

Executar suite completa:

```bash
npm run test:run
```

Cobertura atual inclui:

- autenticacao com sucesso
- erro de login
- entrada em sala
- envio de mensagem
- restauracao de sessao
- troca de conta
- reconexao do SignalR com rejoin
- fechamento de conexao
- tratamento de falha de start
- cleanup do hook no unmount

## Observacoes

- Durante o build pode aparecer warning de INVALID_ANNOTATION em dependencia do SignalR. Isso nao bloqueia compilacao nem execucao do app.
