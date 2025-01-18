import { renderHook, act } from "@testing-library/react";
import useWebSocketHome from "@/hooks/websocket/useWebSocketHome";

// Mock WebSocket
type WebSocketEventMap = {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (error: Error) => void;
  onclose: () => void;
  send: (data: string) => void;
};

const mockWebSocket: Partial<WebSocketEventMap> & { close: jest.Mock } = {
  onopen: undefined,
  onmessage: undefined,
  onerror: undefined,
  onclose: undefined,
  send: jest.fn(),
  close: jest.fn(),
};

const MockWebSocket = jest.fn().mockImplementation(() => {
  const ws = { ...mockWebSocket };
  // Simulate connection established
  setTimeout(() => ws.onopen?.(), 0);
  return ws;
});

// Mock the WebSocket constructor
(global as any).WebSocket = MockWebSocket;

describe("useWebSocketHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  it("initializes with empty vaults array", () => {
    const { result } = renderHook(() => useWebSocketHome());
    expect(result.current.vaults).toEqual([]);
  });

  it("establishes WebSocket connection after loading", async () => {
    renderHook(() => useWebSocketHome());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
    expect(console.log).toHaveBeenCalledWith("WebSocket connection established");
  });

  it("updates vaults when receiving message", async () => {
    const { result } = renderHook(() => useWebSocketHome());
    const mockVaults = ["0x123", "0x456"];
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onmessage?.({ data: JSON.stringify({ vaultAddresses: mockVaults }) });
    });

    expect(result.current.vaults).toEqual(mockVaults);
  });

  it("handles WebSocket errors", async () => {
    renderHook(() => useWebSocketHome());
    const mockError = new Error("WebSocket error");
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onerror?.(mockError);
    });

    expect(console.error).toHaveBeenCalledWith("WebSocket error:", mockError);
  });

  it("closes WebSocket connection on unmount", async () => {
    const { unmount } = renderHook(() => useWebSocketHome());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      unmount();
    });

    const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
    expect(ws.close).toHaveBeenCalled();
  });
}); 