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
interface MockWebSocketInstance extends WebSocket {
  simulateMessage: (data: any) => void;
  simulateOpen: () => void;
  simulateError: (error: any) => void;
  simulateClose: () => void;
  send: jest.Mock;
  close: jest.Mock;
}

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
  readyState: number = 0;
  url: string = '';
  CLOSED: 3 = 3;
  CLOSING: 2 = 2;
  CONNECTING: 0 = 0;
  OPEN: 1 = 1;
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();

  constructor(url: string) {
    this.url = url;
    this.readyState = this.OPEN; // Set to OPEN by default for testing
  }

  // Helper method to simulate receiving a message
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: JSON.stringify(data),
      });
      this.onmessage.call(this, event);
    }
  }

  // Helper method to simulate connection open
  simulateOpen() {
    if (this.onopen) {
      const event = new Event('open');
      this.onopen.call(this, event);
    }
  }

  // Helper method to simulate error
  simulateError(error: any) {
    if (this.onerror) {
      const event = new Event('error');
      this.onerror.call(this, event);
    }
  }

  // Helper method to simulate connection close
  simulateClose() {
    if (this.onclose) {
      const event = new CloseEvent('close');
      this.onclose.call(this, event);
    }
  }
}

// Mock the WebSocket constructor
const mockWebSocketInstance = new MockWebSocket('') as MockWebSocketInstance;
jest.spyOn(global, 'WebSocket').mockImplementation(() => mockWebSocketInstance);

describe("useWebSocketVault", () => {
  const mockVaultAddress = "0x123";
  const mockAccountAddress = "0x456";

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock WebSocket instance
    mockWebSocketInstance.onopen = null;
    mockWebSocketInstance.onmessage = null;
    mockWebSocketInstance.onerror = null;
    mockWebSocketInstance.onclose = null;
    mockWebSocketInstance.send.mockClear();
    mockWebSocketInstance.close.mockClear();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      address: mockAccountAddress,
    });

    // Mock utils functions
    (utils.removeLeadingZeroes as jest.Mock).mockImplementation(str => str);
    (utils.getPerformanceLP as jest.Mock).mockReturnValue("0");
    (utils.getPerformanceOB as jest.Mock).mockReturnValue("0");
  });

  it("handles WebSocket errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const { result } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    await act(async () => {
      mockWebSocketInstance.simulateError(new Error("WebSocket error"));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith("WebSocket error:", expect.any(Event));
    consoleErrorSpy.mockRestore();
  });

  it("closes WebSocket connection on unmount", () => {
    const { unmount } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    act(() => {
      unmount();
    });

    expect(mockWebSocketInstance.close).toHaveBeenCalled();
  });

  it("sends address update when account changes", async () => {
    const { rerender } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const newAddress = "0x789";
    
    await act(async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 0));
      mockWebSocketInstance.send.mockClear(); // Clear initial message

      // Change account and wait for effect
      (useAccount as jest.Mock).mockReturnValue({ address: newAddress });
      rerender();
    });

    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        updatedField: "address",
        updatedValue: newAddress,
      })
    );
  });

  it("initializes WebSocket connection with correct parameters", async () => {
    renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      mockWebSocketInstance.simulateOpen();
    });

    // Should send initial subscription message
    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        address: mockAccountAddress,
        userType: "ob",
        vaultAddress: mockVaultAddress,
      })
    );
  });

  it("updates WebSocket subscription when account address changes", async () => {
    const { rerender } = renderHook(() => useWebSocketVault("ws", mockVaultAddress));
    const newAddress = "0x789";
    
    await act(async () => {
      // Wait for initial connection
      await new Promise(resolve => setTimeout(resolve, 0));
      mockWebSocketInstance.simulateOpen();
      mockWebSocketInstance.send.mockClear(); // Clear initial message

      // Change account and wait for effect
      (useAccount as jest.Mock).mockReturnValue({ address: newAddress });
      rerender();
    });

    // Should send address update message
    expect(mockWebSocketInstance.send).toHaveBeenCalledWith(
      JSON.stringify({
        updatedField: "address",
        updatedValue: newAddress,
      })
    );
  });
}); 