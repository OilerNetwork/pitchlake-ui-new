import { renderHook } from "@testing-library/react";
import useVaultState from "@/hooks/vault/useVaultState";
import { useAccount, useReadContract } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import useOptionRoundActions from "@/hooks/optionRound/useOptionRoundActions";
import useOptionRoundState from "@/hooks/optionRound/useOptionRoundState";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContract: jest.fn(),
  useReadContract: jest.fn().mockImplementation(({ functionName }) => {
    if (functionName === "get_round_address") {
      return { data: "0x456" };
    }
    return { data: undefined };
  }),
  useContractRead: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => jest.fn());
jest.mock("@/hooks/optionRound/useOptionRoundActions", () => jest.fn());
jest.mock("@/hooks/optionRound/useOptionRoundState", () => jest.fn());
jest.mock("@/hooks/optionRound/state/useTimestamps", () => jest.fn());

describe("useVaultState", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });

    // Mock useReadContract for different cases
    (useReadContract as jest.Mock)
      .mockReturnValueOnce({ data: "0x456" }) // round1Address
      .mockReturnValueOnce({ data: "0x789" }) // currentRoundAddress
      .mockReturnValueOnce({ data: "0x101" }); // selectedRoundAddress

    // Mock useTimestamps
    (useTimestamps as jest.Mock).mockReturnValue({
      deploymentDate: 1234567890,
    });

    // Mock useOptionRoundState
    (useOptionRoundState as jest.Mock).mockReturnValue({
      optionRoundState: { roundId: 1 },
      optionBuyerState: { balance: 100 },
    });

    // Mock useOptionRoundActions
    (useOptionRoundActions as jest.Mock).mockReturnValue({
      actions: ["action1", "action2"],
    });
  });

  it("initializes with correct vault state", () => {
    // Mock useContractReads for vault states
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "0",
      ethAddress: "0x123",
      fossilClientAddress: "0x456",
      currentRoundId: "1",
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "500",
      queuedBps: "10",
    }).mockReturnValueOnce({
      lockedBalance: "100",
      unlockedBalance: "200",
      stashedBalance: "50",
      queuedBps: "5",
    });

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: true,
      })
    );

    expect(result.current.vaultState.alpha).toBe("100");
    expect(result.current.vaultState.strikeLevel).toBe("0");
    expect(result.current.vaultState.vaultType).toBe("ATM");
    expect(result.current.vaultState.lockedBalance).toBe("1000");
  });

  it("returns correct LP state for connected account", () => {
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "0",
      ethAddress: "0x123",
      fossilClientAddress: "0x456",
      currentRoundId: "1",
      lockedBalance: "1000",
      unlockedBalance: "2000",
      stashedBalance: "500",
      queuedBps: "10",
    }).mockReturnValueOnce({
      lockedBalance: "100",
      unlockedBalance: "200",
      stashedBalance: "50",
      queuedBps: "5",
    });

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: true,
      })
    );

    expect(result.current.lpState.lockedBalance).toBe("100");
    expect(result.current.lpState.unlockedBalance).toBe("200");
    expect(result.current.lpState.stashedBalance).toBe("50");
    expect(result.current.lpState.queuedBps).toBe("5");
  });

  it("handles undefined address", () => {
    (useContractReads as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        getRounds: false,
      })
    );

    expect(result.current.vaultState.alpha).toBe(0);
    expect(result.current.vaultState.strikeLevel).toBe(0);
    expect(result.current.vaultState.lockedBalance).toBe(0);
  });

  it("computes vault type based on strike level", () => {
    // Test ATM (k = 0)
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "0",
    }).mockReturnValue({});

    const { result: atmResult } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: false,
      })
    );
    expect(atmResult.current.vaultState.vaultType).toBe("ATM");

    // Test OTM (k > 0)
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "1",
    }).mockReturnValue({});

    const { result: otmResult } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: false,
      })
    );
    expect(otmResult.current.vaultState.vaultType).toBe("OTM");

    // Test ITM (k < 0)
    (useContractReads as jest.Mock).mockReturnValueOnce({
      alpha: "100",
      strikeLevel: "-1",
    }).mockReturnValue({});

    const { result: itmResult } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: false,
      })
    );
    expect(itmResult.current.vaultState.vaultType).toBe("ITM");
  });

  it("returns undefined round actions when getRounds is false", () => {
    (useContractReads as jest.Mock).mockReturnValue({
      alpha: "100",
      strikeLevel: "0",
    });

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: "0x123",
        getRounds: false,
      })
    );

    expect(result.current.roundActions).toBeUndefined();
  });

  it("handles undefined contract data", () => {
    (useContractReads as jest.Mock).mockReturnValue({});

    const { result } = renderHook(() =>
      useVaultState({
        conn: "rpc",
        address: undefined,
        getRounds: false,
      })
    );

    expect(result.current.vaultState.alpha).toBe(0);
    expect(result.current.vaultState.strikeLevel).toBe(0);
    expect(result.current.vaultState.lockedBalance).toBe(0);
  });
}); 