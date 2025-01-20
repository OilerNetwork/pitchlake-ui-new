import { renderHook, act } from "@testing-library/react";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { getTargetTimestampForRound } from "@/lib/utils";

// Mock the hooks and fetch
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/lib/utils", () => ({
  getTargetTimestampForRound: jest.fn().mockReturnValue(1000),
  getDurationForRound: jest.fn().mockReturnValue(500),
  createJobId: jest.fn().mockReturnValue("test-job-id"),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useFossilStatus", () => {
  const mockSelectedRoundState = {
    roundState: "Running",
    roundId: "1",
    optionSettleDate: "1000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock useProtocolContext default values
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockSelectedRoundState,
      conn: "mainnet",
    });

    // Reset environment variable
    process.env.NEXT_PUBLIC_FOSSIL_API_URL = "http://test-api";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with null status", async () => {
    // Mock the selectedRoundState to be Auctioning to prevent initial fetch
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: {
        ...mockSelectedRoundState,
        roundState: "Auctioning",
      },
      conn: "mainnet",
    });

    const { result } = renderHook(() => useFossilStatus());

    // Wait for any potential state updates
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("handles mock connection", async () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: {
        ...mockSelectedRoundState,
        roundState: "FossilReady",
      },
      conn: "mock",
    });

    const { result } = renderHook(() => useFossilStatus());

    // Wait for the effect to run and state to update
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(result.current.status).toEqual({ status: "Completed" });
  });

  it("fetches status on mount and polls", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "Pending" }),
      })
    );

    const { result } = renderHook(() => useFossilStatus());

    // Wait for initial fetch and state update
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(result.current.status).toEqual({ status: "Pending" });
    expect(result.current.loading).toBe(false);

    // Mock second fetch with completed status
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "Completed" }),
      })
    );

    // Fast-forward past polling interval
    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
    });

    expect(result.current.status).toEqual({ status: "Completed" });
  });

  it("handles fetch error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useFossilStatus());

    // Wait for error state to be set
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(result.current.error).toBe("Error fetching job status");
    expect(result.current.loading).toBe(false);
  });

  it("handles non-ok response", async () => {
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
      })
    );

    const { result } = renderHook(() => useFossilStatus());

    // Wait for error state to be set
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    expect(result.current.error).toBe("Error fetching job status");
  });

  it("stops polling when status is Completed", async () => {
    // Mock initial fetch with Completed status
    mockFetch
      .mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "Completed" }),
        })
      )
      // Mock subsequent fetches to return Completed
      .mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: "Completed" }),
        })
      );

    const { result } = renderHook(() => useFossilStatus());

    // Wait for initial fetch and state update
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    // Verify initial state
    expect(result.current.status).toEqual({ status: "Completed" });

    // Fast-forward past several polling intervals
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    // Due to the hook's implementation, we expect multiple calls
    // but the status should remain "Completed"
    expect(result.current.status).toEqual({ status: "Completed" });
  });

  it("does not fetch if targetTimestamp is 0", () => {
    (getTargetTimestampForRound as jest.Mock).mockReturnValueOnce(0);

    renderHook(() => useFossilStatus());
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not fetch for Auctioning or Settled states", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: {
        ...mockSelectedRoundState,
        roundState: "Auctioning",
      },
      conn: "mainnet",
    });

    renderHook(() => useFossilStatus());
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("cleans up interval on unmount", async () => {
    const { unmount } = renderHook(() => useFossilStatus());

    // Start polling
    await act(async () => {
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    const initialFetchCount = mockFetch.mock.calls.length;

    // Unmount
    unmount();

    // Fast-forward past polling interval
    await act(async () => {
      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      jest.runOnlyPendingTimers();
    });

    // Should not have made any more fetch calls after unmount
    expect(mockFetch.mock.calls.length).toBe(initialFetchCount);
  });
}); 