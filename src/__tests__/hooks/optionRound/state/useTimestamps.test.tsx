import { renderHook } from "@testing-library/react";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";
import { useContractRead } from "@starknet-react/core";
import { BlockTag } from "starknet";
import { optionRoundABI } from "@/lib/abi";

// Mock external dependencies
jest.mock("@starknet-react/core", () => ({
  useContractRead: jest.fn()
}));

describe("useTimestamps", () => {
  const mockAddress = "0x123";
  const mockTimestamps = {
    deploymentDate: BigInt(1000),
    auctionStartDate: BigInt(2000),
    auctionEndDate: BigInt(3000),
    optionSettleDate: BigInt(4000)
  };

  const mockContractReadParams = {
    address: mockAddress,
    abi: optionRoundABI,
    args: [],
    blockIdentifier: BlockTag.PENDING,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("timestamp retrieval", () => {
    it("returns formatted timestamps when all values are available", () => {
      // Setup mocks for each timestamp in sequence
      (useContractRead as jest.Mock)
        .mockReturnValueOnce({ data: mockTimestamps.deploymentDate })
        .mockReturnValueOnce({ data: mockTimestamps.auctionStartDate })
        .mockReturnValueOnce({ data: mockTimestamps.auctionEndDate })
        .mockReturnValueOnce({ data: mockTimestamps.optionSettleDate });

      const { result } = renderHook(() => useTimestamps(mockAddress));

      // Verify returned timestamps
      expect(result.current).toEqual({
        deploymentDate: mockTimestamps.deploymentDate.toString(),
        auctionStartDate: mockTimestamps.auctionStartDate.toString(),
        auctionEndDate: mockTimestamps.auctionEndDate.toString(),
        optionSettleDate: mockTimestamps.optionSettleDate.toString(),
      });

      // Verify contract read parameters for each timestamp
      expect(useContractRead).toHaveBeenNthCalledWith(1, {
        ...mockContractReadParams,
        functionName: "get_deployment_date",
        watch: true // Always true
      });

      expect(useContractRead).toHaveBeenNthCalledWith(2, {
        ...mockContractReadParams,
        functionName: "get_auction_start_date",
        watch: false // Uses provided watch value (default false)
      });

      expect(useContractRead).toHaveBeenNthCalledWith(3, {
        ...mockContractReadParams,
        functionName: "get_auction_end_date",
        watch: true // Always true
      });

      expect(useContractRead).toHaveBeenNthCalledWith(4, {
        ...mockContractReadParams,
        functionName: "get_option_settlement_date",
        watch: true // Always true
      });
    });

    it("returns undefined timestamps when contract reads return undefined", () => {
      (useContractRead as jest.Mock).mockReturnValue({ data: undefined });

      const { result } = renderHook(() => useTimestamps(mockAddress));

      expect(result.current).toEqual({
        deploymentDate: undefined,
        auctionStartDate: undefined,
        auctionEndDate: undefined,
        optionSettleDate: undefined,
      });
    });

    it("returns undefined timestamps when address is undefined", () => {
      const { result } = renderHook(() => useTimestamps(undefined));

      expect(result.current).toEqual({
        deploymentDate: undefined,
        auctionStartDate: undefined,
        auctionEndDate: undefined,
        optionSettleDate: undefined,
      });
    });
  });

  describe("contract read configuration", () => {
    it("uses provided watch parameter only for auction start date", () => {
      renderHook(() => useTimestamps(mockAddress, { watch: true }));

      const calls = (useContractRead as jest.Mock).mock.calls;
      
      expect(calls[0][0].watch).toBe(true); // deploymentDate - always true
      expect(calls[1][0].watch).toBe(true); // auctionStartDate - uses provided watch
      expect(calls[2][0].watch).toBe(true); // auctionEndDate - always true
      expect(calls[3][0].watch).toBe(true); // optionSettleDate - always true
    });

    it("uses BlockTag.PENDING for all contract reads", () => {
      renderHook(() => useTimestamps(mockAddress));

      const calls = (useContractRead as jest.Mock).mock.calls;
      
      calls.forEach(call => {
        expect(call[0].blockIdentifier).toBe(BlockTag.PENDING);
      });
    });
  });
}); 