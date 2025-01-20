import { renderHook } from "@testing-library/react";
import useFossil from "@/hooks/fossil/useFossil";
import { useContract } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { fossilClientABI } from "@/lib/abi";
import { Account } from "starknet";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useContract: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

describe("useFossil", () => {
  const mockSetPendingTx = jest.fn();
  const mockTypedContract = {
    connect: jest.fn(),
    fossil_callback: jest.fn(),
    typedv2: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useContract
    (useContract as jest.Mock).mockReturnValue({
      contract: mockTypedContract,
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      setPendingTx: mockSetPendingTx,
    });

    // Mock contract function responses
    mockTypedContract.fossil_callback.mockResolvedValue({ transaction_hash: "0xabc" });
  });

  it("initializes with contract", () => {
    const { result } = renderHook(() => useFossil("0x456"));
    
    expect(useContract).toHaveBeenCalledWith(expect.objectContaining({
      abi: fossilClientABI,
      address: "0x456",
    }));
  });

  it("handles missing contract", async () => {
    (useContract as jest.Mock).mockReturnValue({ contract: null });
    const { result } = renderHook(() => useFossil("0x456"));
    
    await result.current.fossilCallback([], []);
    expect(mockTypedContract.connect).not.toHaveBeenCalled();
    expect(mockSetPendingTx).not.toHaveBeenCalled();
  });

  it("calls fossil_callback with correct arguments", async () => {
    const mockAccount = { address: "0x123" } as Account;
    const { result } = renderHook(() => useFossil("0x456", mockAccount));
    
    const mockRequest = ["request1", "request2"];
    const mockResult = ["result1", "result2"];
    
    await result.current.fossilCallback(mockRequest, mockResult);

    expect(mockTypedContract.typedv2).toHaveBeenCalledWith(fossilClientABI);
    expect(mockTypedContract.connect).toHaveBeenCalledWith(mockAccount);
    expect(mockTypedContract.fossil_callback).toHaveBeenCalledWith(mockRequest, mockResult);
    expect(mockSetPendingTx).toHaveBeenCalledWith("0xabc");
  });

  it("handles fossil_callback error", async () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    const mockError = new Error("Fossil callback failed");
    mockTypedContract.fossil_callback.mockRejectedValue(mockError);

    const { result } = renderHook(() => useFossil("0x456"));
    
    await result.current.fossilCallback([], []);

    expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    expect(mockSetPendingTx).not.toHaveBeenCalled();
  });

  it("handles undefined account", async () => {
    const { result } = renderHook(() => useFossil("0x456", undefined));
    
    await result.current.fossilCallback([], []);

    expect(mockTypedContract.connect).not.toHaveBeenCalled();
    expect(mockTypedContract.fossil_callback).toHaveBeenCalled();
  });
}); 