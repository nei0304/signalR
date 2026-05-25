import { useState } from "react";

type AuthData = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; username: string };
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:5000";

export function useAuth() {
  const [auth, setAuth] = useState<AuthData | null>(() => {
    const saved = localStorage.getItem("auth");
    return saved ? JSON.parse(saved) : null;
  });
  
  const login = async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, passwordHash: password }),
    });
    if (!res.ok) throw new Error("Login falhou");

    const data: AuthData = await res.json();
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
    return data;
  };

  const refresh = async () => {
    if (!auth?.refreshToken) return null;

    const res = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    });

    if (!res.ok) {
      logout();
      return null;
    }

    const data: AuthData = await res.json();
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
    return data.accessToken;
  };

  const logout = async () => {
    if (auth?.refreshToken) {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
    }
    localStorage.removeItem("auth");
    setAuth(null);
  };

  return { auth, login, refresh, logout };
}
