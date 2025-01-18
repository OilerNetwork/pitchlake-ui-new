import { renderHook, act } from "@testing-library/react";
import { useAccount } from "@starknet-react/core";
import useWebSocketVault from "@/hooks/websocket/useWebSocketVault";
import { getPerformanceLP, getPerformanceOB } from "@/lib/utils";

// Mock dependencies
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  getPerformanceLP: jest.fn(),
  getPerformanceOB: jest.fn(),
  removeLeadingZeroes: jest.fn().mockImplementation(str => str),
}));

// Mock WebSocket
type WebSocketEventMap = {
  onopen: () => void;
  onmessage: (event: { data: string }) => void;
  onerror: (error: Error) => void;
  onclose: () => void;
  send: (data: string) => void;
  readyState: number;
};

const mockWebSocket: Partial<WebSocketEventMap> & { close: jest.Mock } = {
  onopen: undefined,
  onmessage: undefined,
  onerror: undefined,
  onclose: undefined,
  send: jest.fn(),
  readyState: 1, // WebSocket.OPEN
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

describe("useWebSocketVault", () => {
  const mockVaultAddress = "0x456";
  const mockAccountAddress = "0x123";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    (useAccount as jest.Mock).mockReturnValue({ address: mockAccountAddress });
    (getPerformanceLP as jest.Mock).mockReturnValue("+3.00");
    (getPerformanceOB as jest.Mock).mockReturnValue("-20.00");
  });

  it("initializes with empty states", () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    expect(result.current.wsVaultState).toBeUndefined();
    expect(result.current.wsOptionRoundStates).toEqual([]);
    expect(result.current.wsLiquidityProviderState).toBeUndefined();
    expect(result.current.wsOptionBuyerStates).toEqual([]);
  });

  it("establishes WebSocket connection and sends initial message", async () => {
    renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
    expect(console.log).toHaveBeenCalledWith("WebSocket connection established");
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        address: mockAccountAddress,
        userType: "ob",
        vaultAddress: mockVaultAddress,
      })
    );
  });

  it("handles initial payload", async () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const mockInitialPayload = {
      payloadType: "initial",
      vaultState: { address: mockVaultAddress },
      optionRoundStates: [
        { 
          roundId: "1",
          soldLiquidity: "8000",
          premiums: "1200",
          totalPayout: "960",
        }
      ],
      liquidityProviderState: { address: mockAccountAddress },
      optionBuyerStates: [{ address: mockAccountAddress }],
    };
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onmessage?.({ data: JSON.stringify(mockInitialPayload) });
    });

    expect(result.current.wsVaultState).toEqual(mockInitialPayload.vaultState);
    expect(result.current.wsOptionRoundStates[0]).toEqual(expect.objectContaining({
      ...mockInitialPayload.optionRoundStates[0],
      performanceLP: "+3.00",
      performanceOB: "-20.00",
    }));
    expect(result.current.wsLiquidityProviderState).toEqual(mockInitialPayload.liquidityProviderState);
    expect(result.current.wsOptionBuyerStates).toEqual(mockInitialPayload.optionBuyerStates);
  });

  it("handles account update", async () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const mockAccountUpdate = {
      payloadType: "account_update",
      liquidityProviderState: { address: mockAccountAddress },
      optionBuyerStates: [{ address: mockAccountAddress }],
    };
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onmessage?.({ data: JSON.stringify(mockAccountUpdate) });
    });

    expect(result.current.wsLiquidityProviderState).toEqual(mockAccountUpdate.liquidityProviderState);
    expect(result.current.wsOptionBuyerStates).toEqual(mockAccountUpdate.optionBuyerStates);
  });

  it("handles notification payload - bid update", async () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    // First set initial state
    const mockInitialPayload = {
      payloadType: "initial",
      optionBuyerStates: [{
        roundAddress: "0x789",
        bids: [{ bidId: "1", amount: "100" }],
      }],
    };
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onmessage?.({ data: JSON.stringify(mockInitialPayload) });

      // Then send bid update
      const mockBidUpdate = {
        operation: "update",
        type: "bid",
        payload: {
          bidId: "2",
          roundAddress: "0x789",
          amount: "200",
        },
      };
      ws.onmessage?.({ data: JSON.stringify(mockBidUpdate) });
    });

    expect(result.current.wsOptionBuyerStates[0].bids).toEqual([
      { bidId: "1", amount: "100" },
      { bidId: "2", roundAddress: "0x789", amount: "200" },
    ]);
  });

  it("handles WebSocket errors", async () => {
    renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const mockError = new Error("WebSocket error");
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.onerror?.(mockError);
    });

    expect(console.error).toHaveBeenCalledWith("WebSocket error:", mockError);
  });

  it("closes WebSocket connection on unmount", async () => {
    const { unmount } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      unmount();
    });

    const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
    expect(ws.close).toHaveBeenCalled();
  });

  it("sends address update when account changes", async () => {
    const { rerender } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const newAddress = "0x789";
    
    await act(async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 0));
      const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
      ws.send.mockClear(); // Clear initial message

      // Change account and wait for effect
      (useAccount as jest.Mock).mockReturnValue({ address: newAddress });
      rerender();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const ws = (MockWebSocket as jest.Mock).mock.results[0].value;
    expect(ws.send).toHaveBeenCalledWith(
      JSON.stringify({
        updatedField: "address",
        updatedValue: newAddress,
      })
    );
  });
}); 