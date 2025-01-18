import { renderHook, act } from "@testing-library/react";
import useERC20 from "@/hooks/erc20/useERC20";
import { useAccount, useContract, useReadContract, useProvider } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { erc20ABI } from "@/lib/abi";

// Mock all the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContract: jest.fn(),
  useReadContract: jest.fn(),
  useProvider: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

describe("useERC20", () => {
  const mockAccount = {
    address: "0x123" as `0x${string}`,
  };

  const mockContract = {
    typedv2: jest.fn().mockReturnValue({
      connect: jest.fn(),
      approve: jest.fn(),
      increase_allowance: jest.fn(),
    }),
  };

  const mockProvider = {
    getNonceForAddress: jest.fn(),
  };

  const mockSetPendingTx = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: mockAccount,
    });

    // Mock useContract
    (useContract as jest.Mock).mockReturnValue({
      contract: mockContract,
    });

    // Mock useProvider
    (useProvider as jest.Mock).mockReturnValue({
      provider: mockProvider,
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      setPendingTx: mockSetPendingTx,
      pendingTx: false,
    });

    // Mock useReadContract for balance and allowance
    (useReadContract as jest.Mock).mockImplementation(({ functionName }) => {
      if (functionName === "balance_of") {
        return { data: "1000" };
      }
      if (functionName === "allowance") {
        return { data: "500" };
      }
      return { data: undefined };
    });
  });

  it("initializes with correct balance and allowance", () => {
    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    expect(result.current.balance).toBe(1000);
    expect(result.current.allowance).toBe(500);
  });

  it("calls approve with correct arguments", async () => {
    const mockTxHash = "0xabc";
    mockContract.typedv2().approve.mockResolvedValue({
      transaction_hash: mockTxHash,
    });
    mockProvider.getNonceForAddress.mockResolvedValue("1");

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.approve({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(mockContract.typedv2).toHaveBeenCalledWith(erc20ABI);
    expect(mockContract.typedv2().approve).toHaveBeenCalledWith(
      "0x789",
      100,
      { nonce: "1" }
    );
    expect(mockSetPendingTx).toHaveBeenCalledWith(mockTxHash);
  });

  it("calls increaseAllowance with correct arguments", async () => {
    const mockTxHash = "0xabc";
    mockContract.typedv2().increase_allowance.mockResolvedValue({
      transaction_hash: mockTxHash,
    });

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.increaseAllowance({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(mockContract.typedv2).toHaveBeenCalledWith(erc20ABI);
    expect(mockContract.typedv2().increase_allowance).toHaveBeenCalledWith(
      "0x789",
      100
    );
    expect(mockSetPendingTx).toHaveBeenCalledWith(mockTxHash);
  });

  it("handles undefined contract", async () => {
    (useContract as jest.Mock).mockReturnValue({
      contract: undefined,
    });

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.approve({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(mockSetPendingTx).not.toHaveBeenCalled();
  });

  it("handles approve error", async () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    const mockError = new Error("Approve failed");
    mockContract.typedv2().approve.mockRejectedValue(mockError);
    mockProvider.getNonceForAddress.mockResolvedValue("1");

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.approve({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("ERR", mockError);
    expect(mockSetPendingTx).not.toHaveBeenCalled();
  });

  it("handles increaseAllowance error", async () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    const mockError = new Error("IncreaseAllowance failed");
    mockContract.typedv2().increase_allowance.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.increaseAllowance({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    expect(mockSetPendingTx).not.toHaveBeenCalled();
  });

  it("handles nonce fetch error", async () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    const mockError = new Error("Nonce fetch failed");
    mockProvider.getNonceForAddress.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useERC20("0x456" as `0x${string}`, "0x789")
    );

    await act(async () => {
      await result.current.approve({
        spender: "0x789",
        amount: 100,
      });
    });

    expect(consoleLogSpy).toHaveBeenCalledWith("Error fetching nonce:", mockError);
    expect(mockContract.typedv2().approve).toHaveBeenCalledWith(
      "0x789",
      100,
      { nonce: "0" }
    );
  });
}); 