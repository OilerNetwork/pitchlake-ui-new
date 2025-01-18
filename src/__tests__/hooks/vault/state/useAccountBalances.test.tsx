import { renderHook } from "@testing-library/react";
import { useAccount } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import useAccountBalances from "@/hooks/vault/state/useAccountBalances";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => jest.fn());

describe("useAccountBalances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });
    (useContractReads as jest.Mock).mockReturnValue({
      lockedBalance: BigInt("1000"),
      unlockedBalance: BigInt("2000"),
      stashedBalance: BigInt("3000"),
    });
  });

  it("initializes with correct balances", () => {
    const { result } = renderHook(() => useAccountBalances("0x456"));
    
    expect(result.current.lockedBalance).toBe("1000");
    expect(result.current.unlockedBalance).toBe("2000");
    expect(result.current.stashedBalance).toBe("3000");
  });

  it("handles missing account", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    const { result } = renderHook(() => useAccountBalances("0x456"));
    
    // Should call useContractReads with empty address
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        states: expect.arrayContaining([
          expect.objectContaining({
            args: [""],
          }),
        ]),
      })
    );
  });

  it("handles undefined contract data", () => {
    (useContractReads as jest.Mock).mockReturnValue({});
    const { result } = renderHook(() => useAccountBalances("0x456"));
    
    expect(result.current.lockedBalance).toBe(0);
    expect(result.current.unlockedBalance).toBe(0);
    expect(result.current.stashedBalance).toBe(0);
  });

  it("watches for changes when watch is true", () => {
    renderHook(() => useAccountBalances("0x456", { watch: true }));
    
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      })
    );
  });
}); 