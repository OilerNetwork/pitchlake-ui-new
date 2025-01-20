import { renderHook } from "@testing-library/react";
import { useTabContent } from "@/hooks/vault/useTabContent";
import { useTransactionContext } from "@/context/TransactionProvider";
import { ProviderTabs, BuyerTabs, OptionRoundStateType } from "@/lib/types";

// Mock the hooks and components
jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

// Mock all the tab content components
jest.mock("@/components/Vault/VaultActions/Tabs/Provider/Deposit", () => ({
  __esModule: true,
  default: () => "DepositContent",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Provider/Withdraw/Withdraw", () => ({
  __esModule: true,
  default: () => "Withdraw",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Buyer/PlaceBid", () => ({
  __esModule: true,
  default: () => "PlaceBid",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Buyer/Mint", () => ({
  __esModule: true,
  default: () => "Mint",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Buyer/History", () => ({
  __esModule: true,
  default: () => "History",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Buyer/Exercise", () => ({
  __esModule: true,
  default: () => "Exercise",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Buyer/Refund", () => ({
  __esModule: true,
  default: () => "Refund",
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Provider/MyInfo", () => ({
  __esModule: true,
  default: () => "MyInfo",
}));

describe("useTabContent", () => {
  const mockSetIsTabsHidden = jest.fn();
  const mockSetBidToEdit = jest.fn();
  const mockOptionRoundState: OptionRoundStateType = {
    address: "0x123",
    vaultAddress: "0x456",
    deploymentDate: "0",
    auctionStartDate: "0",
    auctionEndDate: "0",
    optionSettleDate: "0",
    roundState: "Open",
    roundId: "1",
    strikePrice: "0",
    premiums: "0",
    clearingPrice: "0",
    soldLiquidity: "0",
    unsoldLiquidity: "0",
    startingLiquidity: "0",
    availableOptions: "0",
    optionSold: "0",
    optionsSold: "0",
    settlementPrice: "0",
    totalPayout: "0",
    payoutPerOption: "0",
    capLevel: "0",
    reservePrice: "0",
    treeNonce: "0",
    performanceLP: "0",
    performanceOB: "0",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Reset environment variable
    process.env.NEXT_PUBLIC_ENVIRONMENT = "mainnet";
  });

  it("returns provider tabs for LP user type", () => {
    const { result } = renderHook(() =>
      useTabContent(
        "lp",
        ProviderTabs.Deposit,
        undefined,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabs).toEqual([
      ProviderTabs.Deposit,
      ProviderTabs.Withdraw,
    ]);
  });

  it("returns empty tabs for buyer in Open state", () => {
    const openState = { ...mockOptionRoundState, roundState: "Open" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        "",
        openState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabs).toEqual([]);
  });

  it("returns correct tabs for buyer in Auctioning state", () => {
    const auctioningState = { ...mockOptionRoundState, roundState: "Auctioning" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        BuyerTabs.PlaceBid,
        auctioningState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabs).toEqual([BuyerTabs.PlaceBid, BuyerTabs.History]);
  });

  it("returns correct tabs for buyer in Running state", () => {
    const runningState = { ...mockOptionRoundState, roundState: "Running" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        BuyerTabs.Mint,
        runningState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabs).toEqual([
      BuyerTabs.Mint,
      BuyerTabs.Refund,
      BuyerTabs.History,
    ]);
  });

  it("returns correct tabs for buyer in Settled state", () => {
    const settledState = { ...mockOptionRoundState, roundState: "Settled" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        BuyerTabs.Exercise,
        settledState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabs).toEqual([
      BuyerTabs.Exercise,
      BuyerTabs.Refund,
      BuyerTabs.History,
    ]);
  });

  it("renders Deposit content for LP user", () => {
    const { result } = renderHook(() =>
      useTabContent(
        "lp",
        ProviderTabs.Deposit,
        undefined,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeTruthy();
  });

  it("renders Withdraw content for LP user", () => {
    const { result } = renderHook(() =>
      useTabContent(
        "lp",
        ProviderTabs.Withdraw,
        undefined,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeTruthy();
  });

  it("renders PlaceBid content for buyer in Auctioning state", () => {
    const auctioningState = { ...mockOptionRoundState, roundState: "Auctioning" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        BuyerTabs.PlaceBid,
        auctioningState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeTruthy();
  });

  it("renders History content with correct props", () => {
    const mockBids = [{ id: 1 }, { id: 2 }];
    const mockBidToEdit = { id: 1 };
    const auctioningState = { ...mockOptionRoundState, roundState: "Auctioning" };

    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        BuyerTabs.History,
        auctioningState,
        false,
        mockBidToEdit,
        mockBids,
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeTruthy();
  });

  it("defaults to Deposit content for LP user with invalid tab", () => {
    const { result } = renderHook(() =>
      useTabContent(
        "lp",
        "invalid-tab",
        undefined,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeTruthy();
  });

  it("returns null content for buyer with invalid tab", () => {
    const auctioningState = { ...mockOptionRoundState, roundState: "Auctioning" };
    const { result } = renderHook(() =>
      useTabContent(
        "ob",
        "invalid-tab",
        auctioningState,
        false,
        {},
        [],
        mockSetIsTabsHidden,
        mockSetBidToEdit
      )
    );

    expect(result.current.tabContent).toBeFalsy();
  });
}); 