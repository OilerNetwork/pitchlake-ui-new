import { renderHook, act } from "@testing-library/react";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { OptionRoundStateType } from "@/lib/types";
import * as utils from "@/lib/utils";

// Mock the ProtocolContext
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

// Mock the utils functions
jest.mock("@/lib/utils", () => ({
  createJobId: jest.fn(),
  getDurationForRound: jest.fn(),
  getTargetTimestampForRound: jest.fn(),
}));

describe("useFossilStatus", () => {
  const mockRoundState: OptionRoundStateType = {
    address: "0x123",
    vaultAddress: "0x456",
    roundId: "1",
    roundState: "Running",
    deploymentDate: "500",
    auctionStartDate: "1000",
    auctionEndDate: "2000",
    optionSettleDate: "3000",
    startingLiquidity: "1000000",
    soldLiquidity: "0",
    unsoldLiquidity: "1000000",
    reservePrice: "100",
    strikePrice: "200",
    capLevel: "300",
    availableOptions: "1000",
    optionSold: "0",
    clearingPrice: "0",
    premiums: "0",
    settlementPrice: "0",
    optionsSold: "0",
    totalPayout: "0",
    payoutPerOption: "0",
    treeNonce: "0",
    performanceLP: "0",
    performanceOB: "0",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Mock fetch globally
    global.fetch = jest.fn();
    // Mock utils functions
    (utils.createJobId as jest.Mock).mockReturnValue("test-job-id");
    (utils.getDurationForRound as jest.Mock).mockReturnValue(3600);
    (utils.getTargetTimestampForRound as jest.Mock).mockReturnValue(1000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with null status and no error", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      conn: "mainnet",
    });

    const { result } = renderHook(() => useFossilStatus());
    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("handles mock connection correctly", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { ...mockRoundState, roundState: "FossilReady" },
      conn: "mock",
    });

    const { result } = renderHook(() => useFossilStatus());
    expect(result.current.status).toEqual({ status: "Completed" });
  });

  it("fetches status on mount and polls", async () => {
    const mockResponse = { status: "Pending" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      conn: "mainnet",
    });

    const { result } = renderHook(() => useFossilStatus());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_FOSSIL_API_URL}/job_status/test-job-id`
    );
    expect(result.current.status).toEqual(mockResponse);

    // Update response for next poll
    const updatedResponse = { status: "Completed" };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedResponse),
    });

    // Fast forward past polling interval
    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    expect(result.current.status).toEqual(updatedResponse);
  });

  it("handles fetch errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      conn: "mainnet",
    });

    const { result } = renderHook(() => useFossilStatus());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("Error fetching job status");
  });

  it("stops polling when status is Completed", async () => {
    const mockResponse = { status: "Completed" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      conn: "mainnet",
    });

    const { result } = renderHook(() => useFossilStatus());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.status).toEqual(mockResponse);

    // Clear mock to track new calls
    (global.fetch as jest.Mock).mockClear();

    // Fast forward past polling interval
    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    // Should not make any more fetch calls
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("skips fetching for Auctioning and Settled states", async () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { ...mockRoundState, roundState: "Auctioning" },
      conn: "mainnet",
    });

    renderHook(() => useFossilStatus());

    await act(async () => {
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();

    // Test Settled state
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { ...mockRoundState, roundState: "Settled" },
      conn: "mainnet",
    });

    renderHook(() => useFossilStatus());

    await act(async () => {
      await Promise.resolve();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("cleans up interval on unmount", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "Pending" }),
    });

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      conn: "mainnet",
    });

    const { unmount } = renderHook(() => useFossilStatus());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Clear mock to track new calls
    (global.fetch as jest.Mock).mockClear();

    // Unmount and advance timer
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    // Should not make any more fetch calls after unmount
    expect(global.fetch).not.toHaveBeenCalled();
  });
}); 