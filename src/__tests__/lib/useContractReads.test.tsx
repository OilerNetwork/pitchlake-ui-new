import { renderHook } from "@testing-library/react";
import useContractReads from "@/lib/useContractReads";
import { useReadContract } from "@starknet-react/core";

// Mock the useReadContract hook
jest.mock("@starknet-react/core", () => ({
  useReadContract: jest.fn(),
}));

describe("useContractReads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns data for multiple contract reads", () => {
    // Mock the useReadContract hook to return different data for different function calls
    (useReadContract as jest.Mock)
      .mockReturnValueOnce({ data: "100" }) // For balance
      .mockReturnValueOnce({ data: "true" }); // For isApproved

    const contractData = {
      abi: {} as any,
      address: "0x123" as `0x${string}`,
    };

    const states = [
      { functionName: "balance", args: ["0x123"], key: "balance" },
      { functionName: "isApproved", args: ["0x123"], key: "approved" },
    ];

    const { result } = renderHook(() =>
      useContractReads({ contractData, states, watch: false })
    );

    expect(result.current).toEqual({
      balance: "100",
      approved: "true",
    });

    expect(useReadContract).toHaveBeenCalledTimes(2);
    expect(useReadContract).toHaveBeenCalledWith({
      ...contractData,
      functionName: "balance",
      args: ["0x123"],
      watch: false,
    });
    expect(useReadContract).toHaveBeenCalledWith({
      ...contractData,
      functionName: "isApproved",
      args: ["0x123"],
      watch: false,
    });
  });

  it("handles undefined contract data", () => {
    (useReadContract as jest.Mock).mockReturnValue({ data: undefined });

    const contractData = {
      abi: undefined,
      address: undefined,
    };

    const states = [
      { functionName: "balance", args: ["0x123"], key: "balance" },
    ];

    const { result } = renderHook(() =>
      useContractReads({ contractData, states, watch: false })
    );

    expect(result.current).toEqual({
      balance: undefined,
    });
  });

  it("handles missing args", () => {
    (useReadContract as jest.Mock).mockReturnValue({ data: "100" });

    const contractData = {
      abi: {} as any,
      address: "0x123" as `0x${string}`,
    };

    const states = [
      { functionName: "totalSupply", key: "supply" }, // No args provided
    ];

    const { result } = renderHook(() =>
      useContractReads({ contractData, states, watch: false })
    );

    expect(result.current).toEqual({
      supply: "100",
    });

    expect(useReadContract).toHaveBeenCalledWith({
      ...contractData,
      functionName: "totalSupply",
      args: [], // Should default to empty array
      watch: false,
    });
  });

  it("updates when watch is true", () => {
    (useReadContract as jest.Mock).mockReturnValue({ data: "100" });

    const contractData = {
      abi: {} as any,
      address: "0x123" as `0x${string}`,
    };

    const states = [
      { functionName: "balance", args: ["0x123"], key: "balance" },
    ];

    const { result } = renderHook(() =>
      useContractReads({ contractData, states, watch: true })
    );

    expect(result.current).toEqual({
      balance: "100",
    });

    expect(useReadContract).toHaveBeenCalledWith({
      ...contractData,
      functionName: "balance",
      args: ["0x123"],
      watch: true,
    });
  });
}); 