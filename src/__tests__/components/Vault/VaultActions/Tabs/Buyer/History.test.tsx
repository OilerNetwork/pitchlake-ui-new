import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import History from "@/components/Vault/VaultActions/Tabs/Buyer/History";
import { useExplorer, useProvider } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useHelpContext } from "@/context/HelpProvider";
import { formatUnits } from "ethers";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useExplorer: jest.fn(),
  useProvider: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
}));

jest.mock("@/context/ProtocolProvider", () => ({
  __esModule: true,
  useProtocolContext: jest.fn(),
}));

jest.mock("@/context/HelpProvider", () => ({
  useHelpContext: jest.fn(),
}));

jest.mock("ethers", () => ({
  formatUnits: jest.fn(),
}));

describe("History Component", () => {
  const mockSetBidToEdit = jest.fn();
  const mockSetIsTabsHidden = jest.fn();
  const mockExplorer = {
    getTransactionLink: jest.fn(),
  };

  const mockHistoryItems = [
    {
      bid_id: "1",
      amount: "1000",
      price: "500000000", // 0.5 GWEI
      roundState: "Auctioning",
    },
    {
      bid_id: "2",
      amount: "2000",
      price: "1000000000", // 1 GWEI
      roundState: "Auctioning",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useExplorer hook
    (useExplorer as jest.Mock).mockReturnValue(mockExplorer);

    // Mock useTransactionContext hook
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Mock useProtocolContext hook
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: {
        roundState: "Auctioning",
      },
    });

    // Mock useHelpContext hook
    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    });

    // Mock formatUnits
    (formatUnits as jest.Mock).mockImplementation((value, unit) => {
      if (unit === "gwei") {
        return (Number(value) / 1e9).toString();
      }
      if (unit === "ether") {
        return (Number(value) / 1e18).toString();
      }
      return value;
    });
  });

  it("renders history items correctly", () => {
    render(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    // Check if both history items are rendered
    expect(screen.getByText(/1,000 options at 0.5 GWEI each/)).toBeInTheDocument();
    expect(screen.getByText(/2,000 options at 1 GWEI each/)).toBeInTheDocument();

    // Check if total ETH values are displayed
    const ethValues = screen.getAllByText(/Total: .* ETH/);
    expect(ethValues).toHaveLength(2);
    expect(ethValues[0]).toHaveTextContent("Total: 5.000000000000001e-7 ETH");
    expect(ethValues[1]).toHaveTextContent("Total: 0.0000020000000000000003 ETH");
  });

  it("shows edit button only when roundState is Auctioning", () => {
    const { container } = render(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    // Should find two edit buttons (one for each history item)
    const editButtons = container.getElementsByClassName("edit-button");
    expect(editButtons.length).toBe(2);

    // Change roundState to something else
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: {
        roundState: "Completed",
      },
    });

    const { container: newContainer } = render(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    // Should not find any edit buttons
    expect(newContainer.getElementsByClassName("edit-button").length).toBe(0);
  });

  it("calls setBidToEdit and setIsTabsHidden when edit button is clicked", () => {
    const { container } = render(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    const editButtons = container.getElementsByClassName("edit-button");
    fireEvent.click(editButtons[0].querySelector("svg")!);

    expect(mockSetBidToEdit).toHaveBeenCalledWith({
      item: mockHistoryItems[0],
    });
    expect(mockSetIsTabsHidden).toHaveBeenCalledWith(true);
  });

  it("handles empty history items array", () => {
    const { container } = render(
      <History
        items={[]}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    // Should render an empty div
    expect(container.getElementsByClassName("edit-button").length).toBe(0);
    expect(screen.queryByText(/options at/)).not.toBeInTheDocument();
  });

  it("applies correct styling to history items", () => {
    render(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />
    );

    const historyItems = screen.getAllByText(/options at/);
    
    // First item should have border
    expect(historyItems[0].parentElement?.parentElement).toHaveClass("border-b");
    
    // Last item should not have border
    expect(historyItems[1].parentElement?.parentElement).not.toHaveClass("border-b");
  });
}); 