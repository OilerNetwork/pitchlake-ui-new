import { renderHook } from "@testing-library/react";
import useVaultActions from "@/hooks/vault/useVaultActions";
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

describe("useVaultActions", () => {
  const mockSetPendingTx = jest.fn();
  const mockTypedContract = {
    connect: jest.fn(),
    deposit: jest.fn(),
    withdraw: jest.fn(),
    withdraw_stash: jest.fn(),
    queue_withdrawal: jest.fn(),
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
    mockTypedContract.deposit.mockResolvedValue({ transaction_hash: "0xabc" });
    mockTypedContract.withdraw.mockResolvedValue({ transaction_hash: "0xdef" });
    mockTypedContract.withdraw_stash.mockResolvedValue({ transaction_hash: "0xghi" });
    mockTypedContract.queue_withdrawal.mockResolvedValue({ transaction_hash: "0xjkl" });
  });

  it("initializes with contract and account", () => {
    const { result } = renderHook(() => useVaultActions("0x456"));
    expect(useContract).toHaveBeenCalledWith(expect.objectContaining({
      address: "0x456",
    }));
  });

  it("handles missing contract", () => {
    (useContract as jest.Mock).mockReturnValue({ contract: null });
    const { result } = renderHook(() => useVaultActions("0x456"));
    expect(mockTypedContract.connect).not.toHaveBeenCalled();
  });

  it("handles missing account", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    const { result } = renderHook(() => useVaultActions("0x456"));
    expect(mockTypedContract.connect).not.toHaveBeenCalled();
  });

  it("calls deposit with correct arguments", async () => {
    const { result } = renderHook(() => useVaultActions("0x456"));
    const depositArgs = { amount: BigInt("1000"), beneficiary: "0x123" };
    await result.current.depositLiquidity(depositArgs);

    expect(mockTypedContract.deposit).toHaveBeenCalledWith(BigInt("1000"), "0x123", { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xabc");
  });

  it("calls withdraw with correct arguments", async () => {
    const { result } = renderHook(() => useVaultActions("0x456"));
    const withdrawArgs = { amount: BigInt("500") };
    await result.current.withdrawLiquidity(withdrawArgs);

    expect(mockTypedContract.withdraw).toHaveBeenCalledWith(BigInt("500"), { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xdef");
  });

  it("calls withdraw stash with correct arguments", async () => {
    const { result } = renderHook(() => useVaultActions("0x456"));
    const collectArgs = { account: "0x123" };
    await result.current.withdrawStash(collectArgs);

    expect(mockTypedContract.withdraw_stash).toHaveBeenCalledWith("0x123", { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xghi");
  });

  it("calls queue withdrawal with correct arguments", async () => {
    const { result } = renderHook(() => useVaultActions("0x456"));
    const queueArgs = { bps: BigInt("1000") };
    await result.current.queueWithdrawal(queueArgs);

    expect(mockTypedContract.queue_withdrawal).toHaveBeenCalledWith(BigInt("1000"), { nonce: "1" });
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xjkl");
  });

  it("handles nonce fetch error", async () => {
    // Mock provider to throw error when getting nonce
    (useProvider as jest.Mock).mockReturnValue({
      provider: {
        getNonceForAddress: jest.fn().mockRejectedValue(new Error("Nonce fetch failed")),
      },
    });

    const { result } = renderHook(() => useVaultActions("0x456"));
    const depositArgs = { amount: BigInt("1000"), beneficiary: "0x123" };
    
    // We expect this to throw
    await expect(result.current.depositLiquidity(depositArgs)).rejects.toThrow("Nonce fetch failed");
    
    // Contract should not have been called
    expect(mockTypedContract.deposit).not.toHaveBeenCalled();
  });
}); 