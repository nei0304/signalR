export type SessionState = {
  accessToken: string | null;
  username: string;
  room: string;
  joined: boolean;
};

type LegacySessionState = {
  token?: unknown;
  user?: unknown;
  username?: unknown;
};

const SESSION_KEY = "signalr-chat-session";

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return {
        accessToken: null,
        username: "",
        room: "geral",
        joined: false,
      };
    }

    const parsed = JSON.parse(raw) as Partial<SessionState> & LegacySessionState;

    const accessToken =
      typeof parsed.accessToken === "string"
        ? parsed.accessToken
        : typeof parsed.token === "string"
          ? parsed.token
          : null;

    const username =
      typeof parsed.username === "string"
        ? parsed.username
        : typeof parsed.user === "string"
          ? parsed.user
          : typeof parsed.user === "object" &&
              parsed.user !== null &&
              "username" in parsed.user &&
              typeof (parsed.user as { username?: unknown }).username === "string"
            ? (parsed.user as { username: string }).username
            : "";

    return {
      accessToken,
      username,
      room: typeof parsed.room === "string" ? parsed.room : "geral",
      joined: Boolean(parsed.joined),
    };
  } catch {
    return {
      accessToken: null,
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
