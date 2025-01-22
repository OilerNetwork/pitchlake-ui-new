import { renderHook, act } from "@testing-library/react";
import useLatestTimestamp from "@/hooks/chain/useLatestTimestamp";
import { ProviderInterface } from "starknet";

describe("useLatestTimestamp", () => {
  // Mock provider
  const mockProvider = {
    getBlock: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with timestamp 0", () => {
    const { result } = renderHook(() => useLatestTimestamp(undefined));
    expect(result.current.timestamp).toBe(0);
  });

  it("fetches initial timestamp on mount", async () => {
    const mockTimestamp = 1234567890;
    mockProvider.getBlock.mockResolvedValueOnce({ timestamp: mockTimestamp });

    const { result } = renderHook(() => useLatestTimestamp(mockProvider as any));

    // Wait for the initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockProvider.getBlock).toHaveBeenCalledWith("latest");
    expect(result.current.timestamp).toBe(mockTimestamp);
  });

  it("updates timestamp at specified interval", async () => {
    const timestamps = [1000, 2000, 3000];
    let callCount = 0;
    mockProvider.getBlock.mockImplementation(async () => ({
      timestamp: timestamps[callCount++],
    }));

    const interval = 5000; // 5 seconds
    const { result } = renderHook(() => useLatestTimestamp(mockProvider as any, interval));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.timestamp).toBe(timestamps[0]);

    // Advance timer by interval and check next update
    await act(async () => {
      jest.advanceTimersByTime(interval);
      await Promise.resolve();
    });
    expect(result.current.timestamp).toBe(timestamps[1]);

    // Advance timer again and check third update
    await act(async () => {
      jest.advanceTimersByTime(interval);
      await Promise.resolve();
    });
    expect(result.current.timestamp).toBe(timestamps[2]);
  });

  it("handles provider errors gracefully", async () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const mockError = new Error("Failed to fetch block");
    mockProvider.getBlock.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useLatestTimestamp(mockProvider as any));

    // Wait for the initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith(mockError);
    expect(result.current.timestamp).toBe(0); // Should keep default value
    consoleSpy.mockRestore();
  });

  it("cleans up interval on unmount", async () => {
    const { unmount } = renderHook(() => useLatestTimestamp(mockProvider as any));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Clear mock calls from initial fetch
    mockProvider.getBlock.mockClear();

    // Unmount and advance timer
    unmount();
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    // Should not make any more calls after unmount
    expect(mockProvider.getBlock).not.toHaveBeenCalled();
  });

  it("reinitializes when provider changes", async () => {
    const mockTimestamp1 = 1000;
    const mockTimestamp2 = 2000;
    const mockProvider1 = { getBlock: jest.fn().mockResolvedValue({ timestamp: mockTimestamp1 }) };
    const mockProvider2 = { getBlock: jest.fn().mockResolvedValue({ timestamp: mockTimestamp2 }) };

    const { result, rerender } = renderHook(
      ({ provider }) => useLatestTimestamp(provider as any),
      {
        initialProps: { provider: mockProvider1 },
      }
    );

    // Wait for initial fetch with first provider
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.timestamp).toBe(mockTimestamp1);

    // Change provider and wait for new fetch
    rerender({ provider: mockProvider2 });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.timestamp).toBe(mockTimestamp2);
  });
}); 