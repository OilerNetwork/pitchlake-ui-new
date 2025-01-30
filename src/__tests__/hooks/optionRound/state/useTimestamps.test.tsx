import { renderHook } from "@testing-library/react";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";
import useContractReads from "@/lib/useContractReads";
import { optionRoundABI } from "@/lib/abi";

// Mock useContractReads
jest.mock("@/lib/useContractReads", () => jest.fn());

describe("useTimestamps", () => {
  const mockAddress = "0x123";

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useContractReads
    (useContractReads as jest.Mock).mockReturnValue({
      deploymentDate: "1000",
      auctionStartDate: "2000",
      auctionEndDate: "3000",
      optionSettleDate: "4000",
    });
  });

  it("initializes with correct contract data", () => {
    renderHook(() => useTimestamps(mockAddress));

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

  it("returns correct timestamps", () => {
    const { result } = renderHook(() => useTimestamps(mockAddress));

    expect(result.current).toEqual({
      deploymentDate: "1000",
      auctionStartDate: "2000",
      auctionEndDate: "3000",
      optionSettleDate: "4000",
    });
  });

  it("returns undefined timestamps when values are undefined", () => {
    (useContractReads as jest.Mock).mockReturnValue({
      deploymentDate: undefined,
      auctionStartDate: undefined,
      auctionEndDate: undefined,
      optionSettleDate: undefined,
    });

    const { result } = renderHook(() => useTimestamps(mockAddress));

    expect(result.current).toEqual({
      deploymentDate: undefined,
      auctionStartDate: undefined,
      auctionEndDate: undefined,
      optionSettleDate: undefined,
    });
  });

  it("watches for changes when watch is true", () => {
    renderHook(() => useTimestamps(mockAddress, { watch: true }));
    
    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        watch: true,
      })
    );
  });

  it("calls contract reads with correct function names", () => {
    renderHook(() => useTimestamps(mockAddress));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        states: [
          {
            functionName: "get_deployment_date",
            key: "deploymentDate",
          },
          {
            functionName: "get_auction_start_date",
            key: "auctionStartDate",
          },
          {
            functionName: "get_auction_end_date",
            key: "auctionEndDate",
          },
          {
            functionName: "get_option_settlement_date",
            key: "optionSettleDate",
          },
        ],
      })
    );
  });

  it("handles undefined address", () => {
    renderHook(() => useTimestamps(undefined));

    expect(useContractReads).toHaveBeenCalledWith(
      expect.objectContaining({
        contractData: {
          abi: optionRoundABI,
          address: undefined,
        },
      })
    );
  });
}); 