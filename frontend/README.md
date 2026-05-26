# Frontend - Chat React + SignalR

Aplicacao React para autenticacao, entrada em sala e chat em tempo real via SignalR.

## Visao geral

Fluxo principal da interface:

- Login ou cadastro
- Escolha de sala
- Conversa em tempo real

Quando autenticado, o app conecta no hub e carrega historico da sala.

## Stack

- React 19
- TypeScript
- Vite
- @microsoft/signalr
- jwt-decode
- Vitest + Testing Library

## Estrutura

- src/App.tsx: fluxo das telas e estado principal
- src/hooks/useSignalR.ts: conexao, eventos e envio de mensagens
- src/services/auth.ts: chamadas de auth usadas na tela principal
- src/services/session.ts: persistencia de sessao no localStorage
- src/App.test.tsx: testes de interface e fluxo principal
- src/hooks/useSignalR.test.ts: testes do hook de SignalR

## Pre-requisitos

- Node.js 20+
- npm 10+
- Backend em execucao

## Configuracao de ambiente

No diretorio frontend, criar arquivo .env com:

VITE_API_BASE_URL=http://localhost:5267

Observacao:

- Se a variavel nao estiver definida, o codigo usa fallback para http://localhost:5000.
- Em desenvolvimento deste projeto, recomenda-se sempre configurar 5267.

## Como executar

1. Instalar dependencias:

npm install

2. Iniciar servidor de desenvolvimento:

npm run dev

3. Abrir no navegador:

http://localhost:5173

## Scripts

- npm run dev: inicia Vite em modo dev
- npm run build: type-check e build de producao
- npm run preview: sobe build local
- npm run lint: roda ESLint
- npm run test: testes em modo watch
- npm run test:run: executa testes uma vez

## Integracao com backend

Base URL:

- VITE_API_BASE_URL

Rotas HTTP usadas:

- POST /register
- POST /login
- POST /refresh
- POST /logout

Hub usado:

- /chat

Eventos recebidos no cliente:

- LoadHistory
- ReceiveMessage
- UserJoined
- UserTyping
- UserLeft

Metodos invocados pelo cliente:

- JoinRoom
- SendMessage

## Sessao local

Chave localStorage:

- signalr-chat-session

Campos persistidos:

- token
- username
- room
- joined

## Testes

Rodar suite completa:

npm run test:run

Cobertura atual inclui:

- autenticacao
- erro de login
- entrada em sala
- envio de mensagem
- restauracao de sessao
- troca de conta
- reconexao e cleanup do SignalR

## Troubleshooting

### Erro de CORS

- Confirme frontend em localhost:5173 ou 127.0.0.1:5173
- Confirme backend em 5267
- Confirme VITE_API_BASE_URL apontando para http://localhost:5267

### Falha ao conectar no chat

- Verifique token valido
- Verifique endpoint /chat acessivel no backend
- Verifique logs do backend para erros no negotiate
