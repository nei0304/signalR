import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { useSignalR } from "./hooks/useSignalR";

vi.mock("./hooks/useSignalR", () => ({
  useSignalR: vi.fn(),
}));

const mockedUseSignalR = vi.mocked(useSignalR);
const sendMessageMock = vi.fn(async () => undefined);

describe("App integration flows", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    mockedUseSignalR.mockReturnValue({
      messages: [],
      users: ["alice"],
      sendMessage: sendMessageMock,
      connected: true,
      connectionError: null,
    });
  });

  it("authenticates and enters the room", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ token: "token-123", username: "alice" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    const usernameInput = screen.getByPlaceholderText("Seu usuario");
    const passwordInput = screen.getByPlaceholderText("Sua senha");

    await userEvent.type(usernameInput, "alice");
    await userEvent.type(passwordInput, "123456");
    await userEvent.click(
      screen.getByText("Entrar", { selector: "button[type='submit']" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Escolha sua sala")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Logado como/i)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "Entrar na sala" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Sala: geral")).toBeInTheDocument();
    });
  });

  it("sends a message from composer", async () => {
    localStorage.setItem(
      "signalr-chat-session",
      JSON.stringify({
        token: "token-456",
        username: "alice",
        room: "geral",
        joined: true,
      }),
    );

    render(<App />);

    const composerInput = screen.getByPlaceholderText("Digite sua mensagem...");

    await userEvent.type(composerInput, "Oi pessoal");
    await userEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(sendMessageMock).toHaveBeenCalledWith("Oi pessoal");

    await waitFor(() => {
      expect(composerInput).toHaveValue("");
    });
  });

  it("shows auth error when login fails", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await userEvent.type(screen.getByPlaceholderText("Seu usuario"), "alice");
    await userEvent.type(screen.getByPlaceholderText("Sua senha"), "senha");
    await userEvent.click(
      screen.getByText("Entrar", { selector: "button[type='submit']" }),
    );

    await waitFor(() => {
      expect(
        screen.getByText("Login invalido. Confira usuario e senha."),
      ).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("loads persisted session on initial render", async () => {
    localStorage.setItem(
      "signalr-chat-session",
      JSON.stringify({
        token: "token-999",
        username: "alice",
        room: "time-a",
        joined: false,
      }),
    );

    render(<App />);

    expect(screen.getByText("Escolha sua sala")).toBeInTheDocument();
    expect(screen.getByDisplayValue("time-a")).toBeInTheDocument();
    expect(screen.getByText(/Logado como/i)).toBeInTheDocument();
  });

  it("clears session and returns to auth screen when switching account", async () => {
    localStorage.setItem(
      "signalr-chat-session",
      JSON.stringify({
        token: "token-123",
        username: "alice",
        room: "geral",
        joined: false,
      }),
    );

    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Trocar conta" }));

    await waitFor(() => {
      expect(screen.getByText("SignalR Chat")).toBeInTheDocument();
    });

    expect(localStorage.getItem("signalr-chat-session")).toBeNull();
  });
});
