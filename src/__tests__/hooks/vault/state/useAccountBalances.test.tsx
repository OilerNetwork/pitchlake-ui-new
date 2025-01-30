import { renderHook } from "@testing-library/react";
import { useAccount } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import useAccountBalances from "@/hooks/vault/state/useAccountBalances";
import { optionRoundABI } from "@/lib/abi";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => jest.fn());

describe("useAccountBalances", () => {
  const mockAddress = "0x123";
  const mockAccountAddress = "0x456";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: mockAccountAddress },
    });

    // Mock useContractReads
    (useContractReads as jest.Mock).mockReturnValue({
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "500",
    });
  });

  it("initializes with correct contract data", () => {
    renderHook(() => useAccountBalances(mockAddress));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: optionRoundABI,
          address: mockAddress,
        },
        watch: false,
      })
    );
  });

  it("returns correct balances", () => {
    const { result } = renderHook(() => useAccountBalances(mockAddress));

    expect(result.current).toEqual({
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "500",
    });
  });

  it("returns zero balances when values are undefined", () => {
    (useContractReads as jest.Mock).mockReturnValue({
      lockedBalance: undefined,
      unlockedBalance: undefined,
      stashedBalance: undefined,
    });

    const { result } = renderHook(() => useAccountBalances(mockAddress));

    expect(result.current).toEqual({
      lockedBalance: 0,
      unlockedBalance: 0,
      stashedBalance: 0,
    });
  });

  it("watches for changes when watch is true", () => {
    renderHook(() => useAccountBalances(mockAddress, { watch: true }));
    
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      })
    );
  });

  it("uses empty string for account address when account is null", () => {
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    renderHook(() => useAccountBalances(mockAddress));

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

  it("calls contract reads with correct function names", () => {
    renderHook(() => useAccountBalances(mockAddress));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        states: [
          {
            functionName: "get_account_locked_balance",
            args: [mockAccountAddress],
            key: "lockedBalance",
          },
          {
            functionName: "get_account_unlocked_balance",
            args: [mockAccountAddress],
            key: "unlockedBalance",
          },
          {
            functionName: "get_account_stashed_balance",
            args: [mockAccountAddress],
            key: "stashedBalance",
          },
        ],
      })
    );
  });
}); 