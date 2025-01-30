import { renderHook } from "@testing-library/react";
import useOptionRoundActions from "@/hooks/optionRound/useOptionRoundActions";
import { useAccount, useContract, useProvider } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContract: jest.fn(),
  useProvider: jest.fn(),
  useNetwork: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

describe("useOptionRoundActions", () => {
  const mockSetPendingTx = jest.fn();
  const mockTypedContract = {
    connect: jest.fn(),
    place_bid: jest.fn(),
    update_bid: jest.fn(),
    refund_unused_bids: jest.fn(),
    mint_options: jest.fn(),
    exercise_options: jest.fn(),
    typedv2: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });

    // Mock useProvider
    (useProvider as jest.Mock).mockReturnValue({
      provider: {
        getNonceForAddress: jest.fn().mockResolvedValue("1"),
      },
    });

    // Mock useContract
    (useContract as jest.Mock).mockReturnValue({
      contract: mockTypedContract,
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      setPendingTx: mockSetPendingTx,
    });

    // Mock contract function responses
    mockTypedContract.place_bid.mockResolvedValue({ transaction_hash: "0xabc" });
    mockTypedContract.update_bid.mockResolvedValue({ transaction_hash: "0xdef" });
    mockTypedContract.refund_unused_bids.mockResolvedValue({ transaction_hash: "0xghi" });
    mockTypedContract.mint_options.mockResolvedValue({ transaction_hash: "0xjkl" });
    mockTypedContract.exercise_options.mockResolvedValue({ transaction_hash: "0xmno" });
  });

  it("initializes with contract and account", () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    expect(useContract).toHaveBeenCalledWith(expect.objectContaining({
      address: "0x456",
    }));
  });

  it("handles missing contract", () => {
    (useContract as jest.Mock).mockReturnValue({ contract: null });
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    expect(mockTypedContract.connect).not.toHaveBeenCalled();
  });

  it("handles missing account", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    expect(mockTypedContract.connect).not.toHaveBeenCalled();
  });

  it("calls placeBid with correct arguments", async () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    const bidArgs = { amount: BigInt("1000"), price: BigInt("500") };
    await result.current.placeBid(bidArgs);

    expect(mockTypedContract.place_bid).toHaveBeenCalledWith(BigInt("1000"), BigInt("500"), { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xabc");
  });

  it("calls updateBid with correct arguments", async () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    const updateArgs = { bidId: "0x789", priceIncrease: BigInt("600") };
    await result.current.updateBid(updateArgs);

    expect(mockTypedContract.update_bid).toHaveBeenCalledWith("0x789", BigInt("600"), { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xdef");
  });

  it("calls refundUnusedBids with correct arguments", async () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    const refundArgs = { optionBuyer: "0x123" };
    await result.current.refundUnusedBids(refundArgs);

    expect(mockTypedContract.refund_unused_bids).toHaveBeenCalledWith("0x123", { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xghi");
  });

  it("calls tokenizeOptions with no arguments", async () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    await result.current.tokenizeOptions();

    expect(mockTypedContract.mint_options).toHaveBeenCalledWith({ nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xjkl");
  });

  it("calls exerciseOptions with no arguments", async () => {
    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    await result.current.exerciseOptions();

    expect(mockTypedContract.exercise_options).toHaveBeenCalledWith({ nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xmno");
  });

  it("handles nonce fetch error", async () => {
    // Mock provider to throw error when getting nonce
    (useProvider as jest.Mock).mockReturnValue({
      provider: {
        getNonceForAddress: jest.fn().mockRejectedValue(new Error("Nonce fetch failed")),
      },
    });

    const { result } = renderHook(() => useOptionRoundActions("0x456"));
    const bidArgs = { amount: BigInt("1000"), price: BigInt("500") };
    
    // We expect this to throw
    await expect(result.current.placeBid(bidArgs)).rejects.toThrow("Nonce fetch failed");
    
    // Contract should not have been called
    expect(mockTypedContract.place_bid).not.toHaveBeenCalled();
  });
}); 