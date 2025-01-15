import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PanelRight from "../../../components/Vault/PanelRight";
import { useProtocolContext } from "../../../context/ProtocolProvider";
import { useTransactionContext } from "../../../context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { useTabContent } from "../../../hooks/vault/useTabContent";

// Mock the hooks
jest.mock("../../../context/ProtocolProvider", () => ({
  __esModule: true,
  useProtocolContext: jest.fn(),
}));

jest.mock("../../../context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useAccount: jest.fn(),
}));

jest.mock("../../../hooks/vault/useTabContent", () => ({
  __esModule: true,
  useTabContent: jest.fn(),
}));

// Mock child components
jest.mock("../../../components/Vault/VaultActions/Tabs/Tabs", () => ({
  __esModule: true,
  default: ({ tabs, activeTab, setActiveTab }: { 
    tabs: string[], 
    activeTab: string, 
    setActiveTab: (tab: string) => void 
  }) => (
    <div className="vault-tabs">
      {tabs.map((tab: string) => (
        <button
          key={tab}
          className={`vault-tab ${activeTab === tab ? "active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  ),
}));

jest.mock("../../../components/Vault/Utils/ConfirmationModal", () => ({
  __esModule: true,
  default: jest.fn(() => <div>Mock Confirmation Modal</div>),
}));

jest.mock("../../../components/Vault/Utils/SuccessModal", () => ({
  __esModule: true,
  default: jest.fn(() => <div>Mock Success Modal</div>),
}));

jest.mock("../../../components/Vault/VaultActions/Tabs/Buyer/EditBid", () => ({
  __esModule: true,
  default: jest.fn(() => <div>Mock Edit Bid Modal</div>),
}));

describe("PanelRight Component", () => {
  const mockSelectedRoundState = {
    roundState: "Open",
    roundId: "1",
  };

  const mockSelectedRoundBuyerState = {
    bids: [],
  };

  const mockTabs = ["Deposit", "Withdraw"];
  const mockTabContent = <div>Mock Tab Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockSelectedRoundState,
      selectedRoundBuyerState: mockSelectedRoundBuyerState,
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      status: null,
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });

    (useTabContent as jest.Mock).mockReturnValue({
      tabs: mockTabs,
      tabContent: mockTabContent,
    });
  });

  it("renders with initial state", () => {
    render(
      <PanelRight
        userType="lp"
        isEditOpen={false}
        setIsEditOpen={jest.fn()}
      />
    );

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Withdraw")).toBeInTheDocument();
    expect(screen.getByText("Mock Tab Content")).toBeInTheDocument();
  });

  it("handles tab changes", () => {
    const setIsEditOpen = jest.fn();
    render(
      <PanelRight
        userType="lp"
        isEditOpen={false}
        setIsEditOpen={setIsEditOpen}
      />
    );

    fireEvent.click(screen.getByText("Withdraw"));
    expect(setIsEditOpen).toHaveBeenCalledWith(false);
  });

  it("renders edit modal when isEditOpen is true", () => {
    render(
      <PanelRight
        userType="lp"
        isEditOpen={true}
        setIsEditOpen={jest.fn()}
      />
    );

    expect(screen.getByText("Mock Edit Bid Modal")).toBeInTheDocument();
  });

  it("renders NotStartedYet when no tabs are available", () => {
    (useTabContent as jest.Mock).mockReturnValue({
      tabs: [],
      tabContent: null,
    });

    render(
      <PanelRight
        userType="lp"
        isEditOpen={false}
        setIsEditOpen={jest.fn()}
      />
    );

    expect(screen.getByText("Round In Process")).toBeInTheDocument();
    expect(screen.getByText(/This round has not started yet/)).toBeInTheDocument();
  });

  it("updates active tab when round state changes", () => {
    const setIsEditOpen = jest.fn();
    const { rerender } = render(
      <PanelRight
        userType="lp"
        isEditOpen={false}
        setIsEditOpen={setIsEditOpen}
      />
    );

    // Change round state and available tabs
    const newTabs = ["NewTab"];
    (useTabContent as jest.Mock).mockReturnValue({
      tabs: newTabs,
      tabContent: <div>New Tab Content</div>,
    });

    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { ...mockSelectedRoundState, roundState: "Running" },
      selectedRoundBuyerState: mockSelectedRoundBuyerState,
    });

    // Rerender to reflect changes
    rerender(
      <PanelRight
        userType="lp"
        isEditOpen={false}
        setIsEditOpen={setIsEditOpen}
      />
    );

    expect(screen.getByText("NewTab")).toBeInTheDocument();
    expect(screen.getByText("New Tab Content")).toBeInTheDocument();
  });
}); 