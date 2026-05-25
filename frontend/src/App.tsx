import { useEffect, useMemo, useState } from "react";
import { useSignalR } from "./hooks/useSignalR";
import {
  type AuthMode,
  readUsernameFromToken,
  requestAuth,
} from "./services/auth";
import { clearSession, loadSession, saveSession } from "./services/session";

function App() {
  const [initialSession] = useState(loadSession);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState(initialSession.username);
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [room, setRoom] = useState(initialSession.room || "geral");
  const [joined, setJoined] = useState(initialSession.joined);
  const [input, setInput] = useState("");

  const { messages, users, sendMessage, connected, connectionError } =
    useSignalR(joined && token ? room : "", token);

  const canJoin = useMemo(
    () => Boolean(token && username.trim() && room.trim()),
    [token, username, room],
  );

  useEffect(() => {
    if (!token) {
      clearSession();
      return;
    }

    saveSession({
      token,
      username,
      room,
      joined,
    });
  }, [token, username, room, joined]);

  const handleAuthSubmit = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const result = await requestAuth(authMode, username.trim(), password);
      setToken(result.token);
      setUsername(result.username || readUsernameFromToken(result.token));
      setJoined(false);
      setPassword("");
    } catch (error) {
      console.error(error);
      setAuthError(
        error instanceof Error ? error.message : "Falha de autenticacao.",
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  if (!token) {
    return (
      <main className="page auth-page">
        <section className="card auth-card">
          <h1>SignalR Chat</h1>
          <p className="subtitle">
            Conecte-se para entrar nas salas em tempo real.
          </p>

          <div
            className="mode-switch"
            role="group"
            aria-label="Modo de autenticacao"
          >
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Entrar
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <label>
              Usuario
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Seu usuario"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                autoComplete={
                  authMode === "register" ? "new-password" : "current-password"
                }
                required
              />
            </label>

            {authError && <p className="error">{authError}</p>}

            <button
              type="submit"
              disabled={authLoading || !username.trim() || !password}
            >
              {authLoading
                ? "Aguarde..."
                : authMode === "register"
                  ? "Cadastrar e entrar"
                  : "Entrar"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="page">
        <section className="card join-card">
          <h1>Escolha sua sala</h1>
          <p className="subtitle">
            Logado como <strong>{username}</strong>
          </p>
          <label>
            Sala
            <input
              placeholder="Nome da sala"
              value={room}
              onChange={(event) => setRoom(event.target.value)}
            />
          </label>

          <div className="actions">
            <button onClick={() => setJoined(true)} disabled={!canJoin}>
              Entrar na sala
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setToken(null);
                setUsername("");
                setJoined(false);
              }}
            >
              Trocar conta
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page chat-page">
      <section className="chat-layout">
        <article className="card chat-card">
          <header className="chat-header">
            <h2>Sala: {room}</h2>
            <span className={connected ? "status online" : "status offline"}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </header>

          {connectionError && <p className="error">{connectionError}</p>}

          <div className="messages">
            {messages.map((msg) => (
              <div key={msg.id} className="message-row">
                <b>{msg.username}:</b> {msg.content}
                <span>{new Date(msg.sentAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>

          <div className="composer">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleSend();
                }
              }}
              placeholder="Digite sua mensagem..."
            />
            <button
              onClick={() => void handleSend()}
              disabled={!input.trim() || !connected}
            >
              Enviar
            </button>
          </div>
        </article>

        <aside className="card users-card">
          <h3>Online: {users.length}</h3>
          <div className="users-list">
            {users.map((u) => (
              <div key={u}>{u}</div>
            ))}
          </div>

          <button
            type="button"
            className="ghost"
            onClick={() => {
              setJoined(false);
              setInput("");
            }}
          >
            Trocar sala
          </button>
        </aside>
      </section>
    </main>
  );
}

export default App;
