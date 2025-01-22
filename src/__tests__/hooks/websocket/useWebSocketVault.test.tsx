import { renderHook, act } from "@testing-library/react";
import { useAccount } from "@starknet-react/core";
import useWebSocketVault from "@/hooks/websocket/useWebSocketVault";
import * as utils from "@/lib/utils";
import { 
  VaultStateType, 
  OptionRoundStateType, 
  LiquidityProviderStateType, 
  OptionBuyerStateType,
  Bid 
} from "@/lib/types";

// Mock dependencies
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  removeLeadingZeroes: jest.fn(str => str),
  getPerformanceLP: jest.fn(),
  getPerformanceOB: jest.fn(),
}));

// Mock WebSocket
class MockWebSocket implements WebSocket {
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent<any>) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  close = jest.fn();
  send = jest.fn();

  // Required WebSocket properties
  binaryType: BinaryType = 'blob';
  bufferedAmount: number = 0;
  extensions: string = '';
  protocol: string = '';
  readyState: number = WebSocket.CONNECTING;
  url: string = '';
  CLOSED: typeof WebSocket.CLOSED = WebSocket.CLOSED;
  CLOSING: typeof WebSocket.CLOSING = WebSocket.CLOSING;
  CONNECTING: typeof WebSocket.CONNECTING = WebSocket.CONNECTING;
  OPEN: typeof WebSocket.OPEN = WebSocket.OPEN;
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  constructor(url: string) {
    this.url = url;
    this.readyState = WebSocket.OPEN; // Set to OPEN by default for testing
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      const messageEvent = new MessageEvent('message', {
        data: JSON.stringify(data),
        origin: this.url,
        lastEventId: '',
        source: null,
        ports: [],
      });
      this.onmessage(messageEvent);
    }
  }

  // Helper method to simulate connection open
  simulateOpen() {
    if (this.onopen) {
      const event = new Event('open');
      this.onopen(event);
    }
  }

  // Helper method to simulate error
  simulateError(error: any) {
    if (this.onerror) {
      const event = new Event('error');
      this.onerror(event);
    }
  }

  // Helper method to simulate connection close
  simulateClose() {
    if (this.onclose) {
      const closeEvent = new CloseEvent('close', {
        wasClean: true,
        code: 1000,
        reason: '',
      });
      this.onclose(closeEvent);
    }
  }
}

// Mock the WebSocket constructor
global.WebSocket = MockWebSocket as any;

describe("useWebSocketVault", () => {
  const mockVaultAddress = "0x123";
  const mockAccountAddress = "0x456";
  let mockWs: MockWebSocket;

  const mockVaultState: VaultStateType = {
    address: mockVaultAddress,
    vaultType: "call",
    alpha: "1000",
    strikeLevel: "2000",
    ethAddress: "0x789",
    fossilClientAddress: "0xabc",
    currentRoundId: "1",
    lockedBalance: "500000",
    unlockedBalance: "500000",
    stashedBalance: "0",
    queuedBps: "0",
    now: "1234567890",
    deploymentDate: "1000000000",
  };

  const mockOptionRoundState: OptionRoundStateType = {
    address: "0x789",
    vaultAddress: mockVaultAddress,
    roundId: "1",
    roundState: "Running",
    deploymentDate: "500",
    auctionStartDate: "1000",
    auctionEndDate: "2000",
    optionSettleDate: "3000",
    startingLiquidity: "1000000",
    soldLiquidity: "0",
    unsoldLiquidity: "1000000",
    reservePrice: "100",
    strikePrice: "200",
    capLevel: "300",
    availableOptions: "1000",
    optionSold: "0",
    clearingPrice: "0",
    premiums: "0",
    settlementPrice: "0",
    optionsSold: "0",
    totalPayout: "0",
    payoutPerOption: "0",
    treeNonce: "0",
    performanceLP: "0",
    performanceOB: "0",
  };

  const mockLPState: LiquidityProviderStateType = {
    address: mockAccountAddress,
    lockedBalance: "500000",
    unlockedBalance: "500000",
    stashedBalance: "0",
    queuedBps: "0",
  };

  const mockBuyerState: OptionBuyerStateType = {
    address: mockAccountAddress,
    roundAddress: "0x789",
    bids: [],
    mintableOptions: "0",
    refundableOptions: "0",
    totalOptions: "0",
    payoutBalance: "0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockWs = new MockWebSocket("");
    jest.spyOn(global, "WebSocket").mockImplementation(() => mockWs);

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      address: mockAccountAddress,
    });

    // Mock utils functions
    (utils.removeLeadingZeroes as jest.Mock).mockImplementation(str => str);
    (utils.getPerformanceLP as jest.Mock).mockReturnValue("0");
    (utils.getPerformanceOB as jest.Mock).mockReturnValue("0");
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
      performanceLP: "0",
      performanceOB: "0",
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

  it("initializes WebSocket connection with correct parameters", () => {
    renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    // Wait for isLoaded to be true
    act(() => {
      jest.runAllTimers();
    });

    expect(WebSocket).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_WS_URL}/subscribeVault`
    );

    // Should send initial subscription message
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({
        address: mockAccountAddress,
        userType: "ob",
        vaultAddress: mockVaultAddress,
      })
    );
  });

  it("handles initial payload correctly", () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    // Simulate WebSocket connection and initial payload
    act(() => {
      mockWs.simulateMessage({
        payloadType: "initial",
        vaultState: mockVaultState,
        optionRoundStates: [mockOptionRoundState],
        liquidityProviderState: mockLPState,
        optionBuyerStates: [mockBuyerState],
      });
    });

    expect(result.current.wsVaultState).toEqual(mockVaultState);
    expect(result.current.wsOptionRoundStates).toEqual([mockOptionRoundState]);
    expect(result.current.wsLiquidityProviderState).toEqual(mockLPState);
    expect(result.current.wsOptionBuyerStates).toEqual([mockBuyerState]);
  });

  it("handles account updates correctly", () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    // Simulate account update
    act(() => {
      mockWs.simulateMessage({
        payloadType: "account_update",
        liquidityProviderState: mockLPState,
        optionBuyerStates: [mockBuyerState],
      });
    });

    expect(result.current.wsLiquidityProviderState).toEqual(mockLPState);
    expect(result.current.wsOptionBuyerStates).toEqual([mockBuyerState]);
  });

  it("handles notification payloads correctly", () => {
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    // Initialize with initial state
    act(() => {
      mockWs.simulateMessage({
        payloadType: "initial",
        vaultState: mockVaultState,
        optionRoundStates: [mockOptionRoundState],
        liquidityProviderState: mockLPState,
        optionBuyerStates: [mockBuyerState],
      });
    });

    // Test LP state update
    act(() => {
      mockWs.simulateMessage({
        operation: "update",
        type: "lpState",
        payload: { ...mockLPState, lockedBalance: "600000" },
      });
    });
    expect(result.current.wsLiquidityProviderState?.lockedBalance).toBe("600000");

    // Test vault state update
    act(() => {
      mockWs.simulateMessage({
        operation: "update",
        type: "vaultState",
        payload: { ...mockVaultState, lockedBalance: "600000" },
      });
    });
    expect(result.current.wsVaultState?.lockedBalance).toBe("600000");

    // Test option round state update
    const updatedRound = { ...mockOptionRoundState, roundState: "Settled" };
    act(() => {
      mockWs.simulateMessage({
        operation: "update",
        type: "optionRoundState",
        payload: updatedRound,
      });
    });
    expect(result.current.wsOptionRoundStates[0].roundState).toBe("Settled");
  });

  it("updates WebSocket subscription when account address changes", () => {
    const { rerender } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    // Simulate initial connection
    act(() => {
      mockWs.simulateOpen();
    });

    // Change account address
    const newAddress = "0x789";
    (useAccount as jest.Mock).mockReturnValue({
      address: newAddress,
    });

    // Rerender hook
    rerender();

    // Should send address update message
    expect(mockWs.send).toHaveBeenCalledWith(
      JSON.stringify({
        updatedField: "address",
        updatedValue: newAddress,
      })
    );
  });

  it("cleans up WebSocket connection on unmount", () => {
    const { unmount } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    unmount();

    expect(mockWs.close).toHaveBeenCalled();
  });

  it("does not establish WebSocket connection for non-ws connections", () => {
    renderHook(() => useWebSocketVault("mock", mockVaultAddress));

    expect(WebSocket).not.toHaveBeenCalled();
  });

  it("handles WebSocket errors gracefully", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));

    act(() => {
      mockWs.simulateError(new Error("WebSocket error"));
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "WebSocket error:",
      expect.any(Event)
    );
    consoleSpy.mockRestore();
  });
}); 