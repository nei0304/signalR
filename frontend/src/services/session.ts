export type SessionState = {
  token: string | null;
  username: string;
  room: string;
  joined: boolean;
};

const SESSION_KEY = "signalr-chat-session";

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return {
        token: null,
        username: "",
        room: "geral",
        joined: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<SessionState>;

    return {
      token: typeof parsed.token === "string" ? parsed.token : null,
      username: typeof parsed.username === "string" ? parsed.username : "",
      room: typeof parsed.room === "string" ? parsed.room : "geral",
      joined: Boolean(parsed.joined),
    };
  } catch {
    return {
      token: null,
      username: "",
      room: "geral",
      joined: false,
    };
  }
}

export function saveSession(session: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
