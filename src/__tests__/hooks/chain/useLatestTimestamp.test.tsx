import { renderHook, act } from "@testing-library/react";
import useLatestTimestamp from "@/hooks/chain/useLatestTimestamp";
import { ProviderInterface } from "starknet";

describe("useLatestTimestamp", () => {
  // Mock provider with properly typed mock function
  const mockGetBlock = jest.fn() as jest.MockedFunction<ProviderInterface["getBlock"]>;
  const mockProvider = {
    getBlock: mockGetBlock,
  } as unknown as ProviderInterface;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetBlock.mockResolvedValue({ timestamp: 1000 } as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initializes with timestamp 0", () => {
    const { result } = renderHook(() => useLatestTimestamp(undefined));
    expect(result.current.timestamp).toBe(0);
  });

  it("fetches initial timestamp on mount", async () => {
    const { result } = renderHook(() => useLatestTimestamp(mockProvider));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockGetBlock).toHaveBeenCalledWith("latest");
    expect(result.current.timestamp).toBe(1000);
  });

  it("updates timestamp at specified interval", async () => {
    const { result } = renderHook(() => useLatestTimestamp(mockProvider, 5000));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    // Update mock to return a different timestamp
    mockGetBlock.mockResolvedValue({ timestamp: 2000 } as any);

    // Fast-forward past interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(mockGetBlock).toHaveBeenCalledTimes(2);
    expect(result.current.timestamp).toBe(2000);
  });

  it("handles provider error", async () => {
    const consoleLogSpy = jest.spyOn(console, "log");
    mockGetBlock.mockRejectedValue(new Error("Failed to fetch block"));

    const { result } = renderHook(() => useLatestTimestamp(mockProvider));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(new Error("Failed to fetch block"));
    expect(result.current.timestamp).toBe(0);
  });

  it("cleans up interval on unmount", async () => {
    const { unmount } = renderHook(() => useLatestTimestamp(mockProvider, 5000));

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    const initialCallCount = mockGetBlock.mock.calls.length;

    // Unmount
    unmount();

    // Fast-forward past interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    // Should not have made any more calls after unmount
    expect(mockGetBlock.mock.calls.length).toBe(initialCallCount);
  });

  it("updates when provider changes", async () => {
    const newMockGetBlock = jest.fn().mockResolvedValue({ timestamp: 3000 } as any) as jest.MockedFunction<ProviderInterface["getBlock"]>;
    const newMockProvider = {
      getBlock: newMockGetBlock,
    } as unknown as ProviderInterface;

    const { result, rerender } = renderHook(
      ({ provider }) => useLatestTimestamp(provider),
      {
        initialProps: { provider: mockProvider },
      }
    );

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.timestamp).toBe(1000);

    // Change provider
    rerender({ provider: newMockProvider });

    // Wait for new fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(newMockGetBlock).toHaveBeenCalledWith("latest");
    expect(result.current.timestamp).toBe(3000);
  });
}); 