import { renderHook } from "@testing-library/react";
import useVaultState from "@/hooks/vault/useVaultState";
import { useAccount, useContractRead } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import useOptionRoundState from "@/hooks/optionRound/useOptionRoundState";
import useOptionRoundActions from "@/hooks/optionRound/useOptionRoundActions";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";

// Mock hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContractRead: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/optionRound/useOptionRoundState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/optionRound/useOptionRoundActions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/optionRound/state/useTimestamps", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("useVaultState", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });

    // Mock useContractReads for vault states
    (useContractReads as jest.Mock).mockReturnValue({
      alpha: "100",
      strikeLevel: "0",
      ethAddress: "0x456",
      fossilClientAddress: "0x789",
      currentRoundId: "1",
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "3000",
      queuedBps: "500",
    });

    // Mock useContractRead
    (useContractRead as jest.Mock).mockReturnValue({
      data: "0xabc",
    });

    // Mock useOptionRoundState
    (useOptionRoundState as jest.Mock).mockReturnValue({
      optionRoundState: {
        roundId: "1",
        state: "Open",
      },
      optionBuyerState: {
        bids: [],
      },
    });

    // Mock useOptionRoundActions
    (useOptionRoundActions as jest.Mock).mockReturnValue({
      startAuction: jest.fn(),
      endAuction: jest.fn(),
    });

    // Mock useTimestamps
    (useTimestamps as jest.Mock).mockReturnValue({
      deploymentDate: "1000000",
    });
  });

  it("initializes with correct vault state", () => {
    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: true,
      })
    );

    expect(result.current.vaultState).toEqual({
      address: "0x123",
      alpha: "100",
      strikeLevel: "0",
      ethAddress: "0x456",
      fossilClientAddress: "0x789",
      currentRoundId: "1",
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "3000",
      queuedBps: "500",
      vaultType: "ATM",
      deploymentDate: "1000000",
    });
  });

  it("returns correct LP state for connected account", () => {
    // Mock LP state specifically
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "0",
      ethAddress: "0x456",
      fossilClientAddress: "0x789",
      currentRoundId: "1",
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "3000",
      queuedBps: "500",
    }).mockReturnValueOnce({
      lockedBalance: "100",
      unlockedBalance: "200",
      stashedBalance: "300",
      queuedBps: "50",
    });

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: true,
      })
    );

    expect(result.current.lpState).toEqual({
      lockedBalance: "100",
      unlockedBalance: "200",
      stashedBalance: "300",
      queuedBps: "50",
    });
  });

  it("handles undefined address", () => {
    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        selectedRound: 1,
        getRounds: true,
      })
    );

    expect(result.current.vaultState.address).toBeUndefined();
  });

  it("computes vault type based on strike level", () => {
    // Test ATM (k = 0)
    (useContractReads as jest.Mock).mockReturnValueOnce({
      strikeLevel: "0",
    });

    let { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: true,
      })
    );

    expect(result.current.vaultState.vaultType).toBe("ATM");

    // Test OTM (k > 0)
    (useContractReads as jest.Mock).mockReturnValueOnce({
      strikeLevel: "1",
    });

    ({ result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: true,
      })
    ));

    expect(result.current.vaultState.vaultType).toBe("OTM");
  });

  it("returns undefined round actions when getRounds is false", () => {
    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: false,
      })
    );

    expect(result.current.roundActions).toBeUndefined();
  });

  it("handles undefined contract data", () => {
    // Mock all contract reads to return undefined
    (useContractReads as jest.Mock).mockReturnValue({});
    (useContractRead as jest.Mock).mockReturnValue({ data: undefined });

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        selectedRound: 1,
        getRounds: true,
      })
    );

    expect(result.current.vaultState).toEqual({
      address: "0x123",
      alpha: 0,
      strikeLevel: 0,
      ethAddress: "",
      fossilClientAddress: "",
      currentRoundId: 0,
      lockedBalance: 0,
      unlockedBalance: 0,
      stashedBalance: 0,
      queuedBps: 0,
      vaultType: "ATM",
      deploymentDate: "1000000",
    });
  });
}); 