import { renderHook } from "@testing-library/react";
import useContractReads from "@/lib/useContractReads";
import useVaultBalances from "@/hooks/vault/state/useVaultBalances";

// Mock the hooks
jest.mock("@/lib/useContractReads", () => jest.fn());

describe("useVaultBalances", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useContractReads as jest.Mock).mockReturnValue({
      lockedBalance: BigInt("1000"),
      unlockedBalance: BigInt("2000"),
      stashedBalance: BigInt("3000"),
    });
  });

  it("initializes with correct balances", () => {
    const { result } = renderHook(() => useVaultBalances("0x456"));
    
    expect(result.current.lockedBalance).toBe("1000");
    expect(result.current.unlockedBalance).toBe("2000");
    expect(result.current.stashedBalance).toBe("3000");

    // Verify correct function names were used
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        states: expect.arrayContaining([
          expect.objectContaining({
            functionName: "get_vault_locked_balance",
          }),
          expect.objectContaining({
            functionName: "get_vault_unlocked_balance", 
          }),
          expect.objectContaining({
            functionName: "get_vault_stashed_balance",
          }),
        ]),
      })
    );
  });

  it("handles undefined contract data", () => {
    (useContractReads as jest.Mock).mockReturnValue({});
    const { result } = renderHook(() => useVaultBalances("0x456"));
    
    expect(result.current.lockedBalance).toBe(0);
    expect(result.current.unlockedBalance).toBe(0);
    expect(result.current.stashedBalance).toBe(0);
  });

  it("watches for changes when watch is true", () => {
    renderHook(() => useVaultBalances("0x456", { watch: true }));
    
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      })
    );
  });
}); 