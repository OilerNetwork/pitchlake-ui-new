import { renderHook } from "@testing-library/react";
import { useRoundPermissions } from "@/hooks/stateTransition/useRoundPermissions";
import { OptionRoundStateType } from "@/lib/types";

describe("useRoundPermissions", () => {
  const FOSSIL_DELAY = 3600; // 1 hour in seconds
  const mockRoundState: OptionRoundStateType = {
    address: "0x123",
    vaultAddress: "0x456",
    roundId: "1",
    roundState: "Open",
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

  it("initializes with all permissions false when no round state", () => {
    const timestamp = "500";
    const { result } = renderHook(() =>
      useRoundPermissions(timestamp, undefined, FOSSIL_DELAY)
    );

    expect(result.current.canAuctionStart).toBe(false);
    expect(result.current.canAuctionEnd).toBe(false);
    expect(result.current.canRoundSettle).toBe(false);
    expect(result.current.canSendFossilRequest).toBe(false);
  });

  it("calculates auction start permission correctly", () => {
    // Test before auction start date
    const { result: beforeStart } = renderHook(() =>
      useRoundPermissions("999", mockRoundState, FOSSIL_DELAY)
    );
    expect(beforeStart.current.canAuctionStart).toBe(false);

    // Test at auction start date
    const { result: atStart } = renderHook(() =>
      useRoundPermissions("1000", mockRoundState, FOSSIL_DELAY)
    );
    expect(atStart.current.canAuctionStart).toBe(true);

    // Test after auction start date
    const { result: afterStart } = renderHook(() =>
      useRoundPermissions("1001", mockRoundState, FOSSIL_DELAY)
    );
    expect(afterStart.current.canAuctionStart).toBe(true);
  });

  it("calculates auction end permission correctly", () => {
    // Test before auction end date
    const { result: beforeEnd } = renderHook(() =>
      useRoundPermissions("1999", mockRoundState, FOSSIL_DELAY)
    );
    expect(beforeEnd.current.canAuctionEnd).toBe(false);

    // Test at auction end date
    const { result: atEnd } = renderHook(() =>
      useRoundPermissions("2000", mockRoundState, FOSSIL_DELAY)
    );
    expect(atEnd.current.canAuctionEnd).toBe(true);

    // Test after auction end date
    const { result: afterEnd } = renderHook(() =>
      useRoundPermissions("2001", mockRoundState, FOSSIL_DELAY)
    );
    expect(afterEnd.current.canAuctionEnd).toBe(true);
  });

  it("calculates round settlement permission correctly", () => {
    const settleTime = Number(mockRoundState.optionSettleDate) + FOSSIL_DELAY;

    // Test before settlement time
    const { result: beforeSettle } = renderHook(() =>
      useRoundPermissions((settleTime - 1).toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(beforeSettle.current.canRoundSettle).toBe(false);

    // Test at settlement time
    const { result: atSettle } = renderHook(() =>
      useRoundPermissions(settleTime.toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(atSettle.current.canRoundSettle).toBe(true);

    // Test after settlement time
    const { result: afterSettle } = renderHook(() =>
      useRoundPermissions((settleTime + 1).toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(afterSettle.current.canRoundSettle).toBe(true);
  });

  it("calculates fossil request permission correctly", () => {
    const fossilTime = Number(mockRoundState.optionSettleDate) + FOSSIL_DELAY;

    // Test before fossil request time
    const { result: beforeFossil } = renderHook(() =>
      useRoundPermissions((fossilTime - 1).toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(beforeFossil.current.canSendFossilRequest).toBe(false);

    // Test at fossil request time
    const { result: atFossil } = renderHook(() =>
      useRoundPermissions(fossilTime.toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(atFossil.current.canSendFossilRequest).toBe(true);

    // Test after fossil request time
    const { result: afterFossil } = renderHook(() =>
      useRoundPermissions((fossilTime + 1).toString(), mockRoundState, FOSSIL_DELAY)
    );
    expect(afterFossil.current.canSendFossilRequest).toBe(true);
  });

  it("updates permissions when round state changes", () => {
    const timestamp = "2500";
    const { result, rerender } = renderHook(
      ({ state }) => useRoundPermissions(timestamp, state, FOSSIL_DELAY),
      {
        initialProps: { state: mockRoundState },
      }
    );

    // Initial permissions
    expect(result.current.canAuctionStart).toBe(true);
    expect(result.current.canAuctionEnd).toBe(true);
    expect(result.current.canRoundSettle).toBe(false);
    expect(result.current.canSendFossilRequest).toBe(false);

    // Update round state with different dates
    const newState = {
      ...mockRoundState,
      auctionStartDate: "3000",
      auctionEndDate: "4000",
      optionSettleDate: "5000",
    };

    rerender({ state: newState });

    // Permissions should update based on new dates
    expect(result.current.canAuctionStart).toBe(false);
    expect(result.current.canAuctionEnd).toBe(false);
    expect(result.current.canRoundSettle).toBe(false);
    expect(result.current.canSendFossilRequest).toBe(false);
  });
}); 