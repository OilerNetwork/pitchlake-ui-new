import { renderHook } from "@testing-library/react";
import useOptionRoundState from "@/hooks/optionRound/useOptionRoundState";
import { useAccount, useContract, useContractRead } from "@starknet-react/core";
import useContractReads from "@/lib/useContractReads";
import { CairoCustomEnum } from "starknet";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContract: jest.fn(),
  useContractRead: jest.fn(),
}));

jest.mock("@/lib/useContractReads", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("useOptionRoundState", () => {
  const mockRoundState = {
    vaultAddress: "0x789",
    roundId: "1",
    roundState: { activeVariant: () => "Auctioning" } as CairoCustomEnum,
    deploymentDate: "1000",
    auctionStartDate: "1100",
    auctionEndDate: "1200",
    optionSettleDate: "1300",
    startingLiquidity: "10000",
    soldLiquidity: "8000",
    unsoldLiquidity: "2000",
    reservePrice: "100",
    strikePrice: "200",
    capLevel: "300",
    availableOptions: "1000",
    optionsSold: "800",
    clearingPrice: "150",
    premiums: "1200",
    settlementPrice: "180",
    totalPayout: "960",
    treeNonce: "5",
  };

  const mockBuyerState = {
    treeNonce: "5",
    biddingNonce: "3",
    bids: [{ amount: "100", price: "150" }],
    refundableBids: "50",
    mintableOptions: "100",
    totalOptions: "200",
    payoutBalance: "300",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });

    // Mock useContractReads for round state
    (useContractReads as jest.Mock).mockReturnValueOnce(mockRoundState);

    // Mock useContractReads for buyer state
    (useContractReads as jest.Mock).mockReturnValueOnce(mockBuyerState);
  });

  it("initializes with correct round state", () => {
    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    expect(result.current.optionRoundState).toEqual(expect.objectContaining({
      address: "0x456",
      vaultAddress: "0x789",
      roundId: "1",
      roundState: "Auctioning",
      deploymentDate: "1000",
      auctionStartDate: "1100",
      auctionEndDate: "1200",
      optionSettleDate: "1300",
      startingLiquidity: "10000",
      soldLiquidity: "8000",
      unsoldLiquidity: "2000",
      reservePrice: "100",
      strikePrice: "200",
      capLevel: "300",
      availableOptions: "1000",
      optionsSold: "800",
      clearingPrice: "150",
      premiums: "1200",
      settlementPrice: "180",
      totalPayout: "960",
      treeNonce: "5",
    }));
  });

  it("initializes with correct buyer state", () => {
    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    expect(result.current.optionBuyerState).toEqual(expect.objectContaining({
      address: "0x123",
      roundAddress: "0x456",
      bids: [{ amount: "100", price: "150" }],
      bidderNonce: "3",
      refundableOptions: "50",
      mintableOptions: "100",
      totalOptions: "200",
      payoutBalance: "300",
    }));
  });

  it("handles undefined contract address", () => {
    jest.clearAllMocks();
    // Reset all mocks to return empty values
    (useContractReads as jest.Mock).mockReset();
    (useContractReads as jest.Mock)
      .mockReturnValueOnce({})
      .mockReturnValueOnce({});
    const { result } = renderHook(() => useOptionRoundState(undefined));
    
    expect(result.current.optionRoundState.address).toBeUndefined();
    expect(result.current.optionRoundState.vaultAddress).toBe("");
    expect(result.current.optionBuyerState.roundAddress).toBeUndefined();
  });

  it("handles missing account", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    expect(result.current.optionBuyerState.address).toBeUndefined();
  });

  it("calculates correct performance metrics", () => {
    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    // Performance LP = (premiums - totalPayout) / soldLiquidity
    // = (1200 - 960) / 8000 = +3.00%
    expect(result.current.optionRoundState.performanceLP).toBe("+3.00");
    
    // Performance OB = (totalPayout - premiums) / premiums
    // = (960 - 1200) / 1200 = -20.00%
    expect(result.current.optionRoundState.performanceOB).toBe("-20.00");
  });

  it("calculates correct payout per option", () => {
    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    // Payout per option = totalPayout / optionsSold
    // = 960 / 800 = 1
    expect(result.current.optionRoundState.payoutPerOption).toBe(BigInt("1"));
  });

  it("handles undefined values in contract reads", () => {
    jest.clearAllMocks();
    // Reset all mocks to return empty values
    (useContractReads as jest.Mock).mockReset();
    (useContractReads as jest.Mock)
      .mockReturnValueOnce({})
      .mockReturnValueOnce({});

    const { result } = renderHook(() => useOptionRoundState("0x456"));
    
    expect(result.current.optionRoundState.roundId).toBe(0);
    expect(result.current.optionRoundState.roundState).toBe("");
    expect(result.current.optionBuyerState.bids).toEqual([]);
  });
}); 