import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSignalR } from "./useSignalR";

type Handler = (...args: unknown[]) => void | Promise<void>;

type MockConnection = {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  invoke: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  onreconnected: ReturnType<typeof vi.fn>;
  onclose: ReturnType<typeof vi.fn>;
  triggerReconnected: () => Promise<void>;
  triggerClose: () => void;
};

function createMockConnection(): MockConnection {
  const handlers = new Map<string, Handler>();
  let reconnectedHandler: Handler | undefined;
  let closeHandler: Handler | undefined;

  const connection: MockConnection = {
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    invoke: vi.fn().mockResolvedValue(undefined),
    on: vi.fn((eventName: string, handler: Handler) => {
      handlers.set(eventName, handler);
    }),
    off: vi.fn((eventName: string) => {
      handlers.delete(eventName);
    }),
    onreconnected: vi.fn((handler: Handler) => {
      reconnectedHandler = handler;
    }),
    onclose: vi.fn((handler: Handler) => {
      closeHandler = handler;
    }),
    triggerReconnected: async () => {
      if (reconnectedHandler) {
        await reconnectedHandler();
      }
    },
    triggerClose: () => {
      if (closeHandler) {
        void closeHandler();
      }
    },
  };

  return connection;
}

let activeConnection: MockConnection = createMockConnection();

vi.mock("@microsoft/signalr", () => ({
  HubConnectionBuilder: class {
    withUrl() {
      return this;
    }

    withAutomaticReconnect() {
      return this;
    }

    build() {
      return activeConnection;
    }
  },
}));

describe("useSignalR reconnection behavior", () => {
  beforeEach(() => {
    activeConnection = createMockConnection();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejoins room after reconnect", async () => {
    const { result } = renderHook(() => useSignalR("geral", "token-1"));

    await waitFor(() => {
      expect(activeConnection.start).toHaveBeenCalledTimes(1);
      expect(activeConnection.invoke).toHaveBeenCalledWith("JoinRoom", "geral");
      expect(result.current.connected).toBe(true);
    });

    await act(async () => {
      await activeConnection.triggerReconnected();
    });

    expect(activeConnection.invoke).toHaveBeenNthCalledWith(
      2,
      "JoinRoom",
      "geral",
    );
    expect(result.current.connected).toBe(true);
  });

  it("marks disconnected when connection closes", async () => {
    const { result } = renderHook(() => useSignalR("geral", "token-1"));

    await waitFor(() => {
      expect(result.current.connected).toBe(true);
    });

    act(() => {
      activeConnection.triggerClose();
    });

    await waitFor(() => {
      expect(result.current.connected).toBe(false);
    });
  });

  it("sets connection error when start fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    activeConnection.start.mockRejectedValueOnce(new Error("start failed"));

    const { result } = renderHook(() => useSignalR("geral", "token-1"));

    await waitFor(() => {
      expect(result.current.connectionError).toBe(
        "Nao foi possivel conectar ao chat.",
      );
    });

    expect(errorSpy).toHaveBeenCalled();
  });

  it("cleans up handlers and stops connection on unmount", async () => {
    const { unmount } = renderHook(() => useSignalR("geral", "token-1"));

    await waitFor(() => {
      expect(activeConnection.start).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(activeConnection.off).toHaveBeenCalledWith("LoadHistory");
    expect(activeConnection.off).toHaveBeenCalledWith("ReceiveMessage");
    expect(activeConnection.off).toHaveBeenCalledWith("UserJoined");
    expect(activeConnection.stop).toHaveBeenCalledTimes(1);
  });
});
