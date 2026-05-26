import { jwtDecode } from "jwt-decode";

export type AuthMode = "login" | "register";

export type AuthUser = {
  id: number;
  username: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

type RawLoginResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  user?: AuthUser | string;
  username?: string;
};

type TokenPayload = {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"?: string;
  unique_name?: string;
  name?: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:5000";

export async function requestAuth(
  mode: AuthMode,
  username: string,
  password: string,
): Promise<LoginResponse> {
  const payload = {
    username,
    passwordHash: password,
  };

  if (mode === "register") {
    const registerResponse = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!registerResponse.ok) {
      throw new Error("Nao foi possivel registrar o usuario.");
    }
  }

  const loginResponse = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!loginResponse.ok) {
    throw new Error("Login invalido. Confira usuario e senha.");
  }

  const raw = (await loginResponse.json()) as RawLoginResponse;

  const accessToken =
    typeof raw.accessToken === "string" && raw.accessToken
      ? raw.accessToken
      : typeof raw.token === "string" && raw.token
        ? raw.token
        : "";

  const usernameFromUser =
    typeof raw.user === "object" && raw.user !== null
      ? raw.user.username
      : typeof raw.user === "string"
        ? raw.user
        : "";

  const resolvedUsername =
    usernameFromUser ||
    (typeof raw.username === "string" ? raw.username : "") ||
    readUsernameFromToken(accessToken);

  return {
    accessToken,
    refreshToken: typeof raw.refreshToken === "string" ? raw.refreshToken : "",
    user: {
      id:
        typeof raw.user === "object" && raw.user !== null && typeof raw.user.id === "number"
          ? raw.user.id
          : 0,
      username: resolvedUsername,
    },
  };
}

export function readUsernameFromToken(token: string) {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return (
      decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ??
      decoded.unique_name ??
      decoded.name ??
      ""
    );
  } catch {
    return "";
  }
}
