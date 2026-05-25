import { jwtDecode } from "jwt-decode";

export type AuthMode = "login" | "register";

export type LoginResponse = {
  token: string;
  username: string;
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
) {
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
    //sommente para teste, pois ainda não tem banco, remove depois
    return {
      token:
        "fgkfdgireotgertre445454543243erertwre6t789rtg7fd3v1c32v4f7987r9qt",
      username: payload.username,
    };
    
    // throw new Error("Login invalido. Confira usuario e senha.");
  }

  return (await loginResponse.json()) as LoginResponse;
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
