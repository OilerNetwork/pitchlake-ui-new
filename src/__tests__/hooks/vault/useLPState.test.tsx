import { renderHook } from "@testing-library/react";
import useLPState from "@/hooks/vault_v2/states/useLPState";
import { useAccount } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import { LiquidityProviderStateType } from "@/lib/types";
import { vaultABI } from "@/lib/abi";

// Mock dependencies
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => jest.fn());

describe("useLPState", () => {
  const mockVaultAddress = "0x123";
  const mockAccountAddress = "0x456";
  const mockLPState: LiquidityProviderStateType = {
    address: mockAccountAddress,
    lockedBalance: "500000",
    unlockedBalance: "300000",
    stashedBalance: "100000",
    queuedBps: "1000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      address: mockAccountAddress,
    });
    // Mock useContractReads
    (useContractReads as jest.Mock).mockReturnValue(mockLPState);
  });

  it("initializes with correct contract data for RPC connection", () => {
    renderHook(() => useLPState(mockVaultAddress, "rpc"));

    expect(useContractReads).toHaveBeenCalledWith({
      contractData: {
        abi: vaultABI,
        address: mockVaultAddress,
      },
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
        {
          functionName: "get_account_queued_bps",
          args: [mockAccountAddress],
          key: "queuedBps",
        },
      ],
    });
  });

  it("initializes with undefined address for non-RPC connection", () => {
    renderHook(() => useLPState(mockVaultAddress, "mock"));

    expect(useContractReads).toHaveBeenCalledWith({
      contractData: {
        abi: vaultABI,
        address: undefined,
      },
      states: expect.any(Array),
    });
  });

  it("returns LP state from contract reads", () => {
    const { result } = renderHook(() => useLPState(mockVaultAddress, "rpc"));

    expect(result.current).toEqual(mockLPState);
  });

  it("updates contract data when vault address changes", () => {
    const { rerender } = renderHook(
      ({ address }) => useLPState(address, "rpc"),
      {
        initialProps: { address: mockVaultAddress },
      }
    );

    const newVaultAddress = "0x789";
    rerender({ address: newVaultAddress });

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: vaultABI,
          address: newVaultAddress,
        },
      })
    );
  });

  it("updates contract data when connection type changes", () => {
    const { rerender } = renderHook(
      ({ conn }) => useLPState(mockVaultAddress, conn),
      {
        initialProps: { conn: "rpc" },
      }
    );

    // Change to mock connection
    rerender({ conn: "mock" });

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: vaultABI,
          address: undefined,
        },
      })
    );

    // Change back to RPC connection
    rerender({ conn: "rpc" });

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: vaultABI,
          address: mockVaultAddress,
        },
      })
    );
  });

  it("handles undefined vault address", () => {
    renderHook(() => useLPState(undefined, "rpc"));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: vaultABI,
          address: undefined,
        },
      })
    );
  });

  it("uses account address for contract read arguments", () => {
    const newAccountAddress = "0x789";
    (useAccount as jest.Mock).mockReturnValue({
      address: newAccountAddress,
    });

    renderHook(() => useLPState(mockVaultAddress, "rpc"));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        states: expect.arrayContaining([
          expect.objectContaining({
            args: [newAccountAddress],
          }),
        ]),
      })
    );
  });
}); 