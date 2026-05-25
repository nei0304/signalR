import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

type Message = {
  id: number;
  room: string;
  username: string;
  content: string;
  sentAt: string;
};

export function useSignalR(room: string, token: string | null) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:5000";

  const sendMessage = useCallback(
    async (message: string) => {
      const connection = connectionRef.current;
      if (!connection || !connected || !message.trim() || !room) {
        return;
      }

      await connection.invoke("SendMessage", room, message.trim());
    },
    [connected, room],
  );

  useEffect(() => {
    if (!token || !room) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/chat`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    connectionRef.current = conn;

    conn.on("LoadHistory", (history: Message[]) => {
      setMessages(history);
      setUsers(Array.from(new Set(history.map((msg) => msg.username))));
    });

    conn.on("ReceiveMessage", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      setUsers((prev) =>
        prev.includes(msg.username) ? prev : [...prev, msg.username],
      );
    });

    conn.on("UserJoined", (username: string) => {
      if (!username?.trim()) return;
      setUsers((prev) =>
        prev.includes(username) ? prev : [...prev, username],
      );
    });

    conn.onreconnected(async () => {
      setConnected(true);
      try {
        await conn.invoke("JoinRoom", room);
      } catch (error) {
        console.error(error);
      }
    });

    conn
      .start()
      .then(async () => {
        setConnected(true);
        setConnectionError(null);
        await conn.invoke("JoinRoom", room);
      })
      .catch((error) => {
        console.error(error);
        setConnectionError("Nao foi possivel conectar ao chat.");
      });

    conn.onclose(() => setConnected(false));

    return () => {
      conn.off("LoadHistory");
      conn.off("ReceiveMessage");
      conn.off("UserJoined");
      connectionRef.current = null;
      setConnected(false);
      conn.stop();
    };
  }, [token, room, API_BASE_URL]);

  return { messages, users, sendMessage, connected, connectionError };
}
