import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import History from "@/components/Vault/VaultActions/Tabs/Buyer/History";
import { useExplorer } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";
import { formatUnits } from "ethers";
import useOptionBuyerStateRPC from "@/hooks/vault_v2/rpc/useOptionBuyerStateRPC";
import useOptionRoundActions from "@/hooks/vault_v2/actions/useOptionRoundActions";
import { useNewContext } from "@/context/NewProvider";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useExplorer: jest.fn(),
  useContractRead: jest.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));

jest.mock("@/context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="transaction-provider">{children}</div>,
}));

jest.mock("@/context/HelpProvider", () => ({
  __esModule: true,
  useHelpContext: jest.fn(),
  HelpProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="help-provider">{children}</div>,
}));

jest.mock("@/context/NewProvider", () => ({
  __esModule: true,
  useNewContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/rpc/useOptionBuyerStateRPC", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/actions/useOptionRoundActions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("ethers", () => ({
  formatUnits: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    roundState: "Auctioning"
  }),
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    selectedRoundAddress: "0x456"
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <div data-testid="help-provider">
      <div data-testid="transaction-provider">
        {ui}
      </div>
    </div>
  );
};

describe("History Component", () => {
  const mockSetBidToEdit = jest.fn();
  const mockSetIsTabsHidden = jest.fn();
  const mockExplorer = {
    getTransactionLink: jest.fn(),
  };

  const mockHistoryItems = [
    {
      bid_id: "1",
      amount: "1000000000", // 1 billion
      price: "500000000", // 0.5 GWEI
      roundState: "Auctioning",
    },
    {
      bid_id: "2",
      amount: "2000000000", // 2 billion
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

    // Mock useHelpContext hook
    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    });

    // Mock useOptionBuyerStateRPC hook
    (useOptionBuyerStateRPC as jest.Mock).mockReturnValue({
      historyItems: mockHistoryItems,
    });

    // Mock useOptionRoundActions hook
    (useOptionRoundActions as jest.Mock).mockReturnValue({
      editBid: jest.fn(),
      cancelBid: jest.fn(),
    });

    // Mock useNewContext hook
    (useNewContext as jest.Mock).mockReturnValue({
      conn: "mock",
      selectedRound: 0,
      vaultAddress: "0x123",
      setSelectedRound: jest.fn(),
      wsData: {
        wsOptionRoundStates: [{
          address: "0x456",
          state: "Auctioning"
        }]
      },
      mockData: {
        vaultState: {},
        optionRoundStates: [{
          address: "0x456",
          state: "Auctioning"
        }]
      }
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
    renderWithProviders(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    // Check if both history items are rendered
    expect(
      screen.getByText(/1.0b options at 0.5 GWEI each/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2.0b options at 1 GWEI each/)).toBeInTheDocument();

    // Check if total ETH values are displayed
    const ethValues = screen.getAllByText(/Total: .* ETH/);
    expect(ethValues).toHaveLength(2);
    expect(ethValues[0]).toHaveTextContent("Total: 0.5 ETH");
    expect(ethValues[1]).toHaveTextContent("Total: 2 ETH");
  });

  it("shows edit button only when roundState is Auctioning", () => {
    // Mock useRoundState to return "Auctioning"
    const useRoundState = require("@/hooks/vault_v2/states/useRoundState").default;
    useRoundState.mockReturnValue({
      roundState: "Auctioning"
    });

    const { container } = renderWithProviders(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    // Should find two edit buttons (one for each history item)
    const editButtons = container.getElementsByClassName("edit-button");
    expect(editButtons.length).toBe(2);

    // Change roundState to something else
    useRoundState.mockReturnValue({
      roundState: "Settled"
    });

    const { container: newContainer } = renderWithProviders(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    // Should not find any edit buttons
    expect(newContainer.getElementsByClassName("edit-button").length).toBe(0);
  });

  it("calls setBidToEdit and setIsTabsHidden when edit button is clicked", () => {
    // Mock useRoundState to return "Auctioning"
    const useRoundState = require("@/hooks/vault_v2/states/useRoundState").default;
    useRoundState.mockReturnValue({
      roundState: "Auctioning"
    });

    const { container } = renderWithProviders(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    const editButton = container.querySelector(".edit-button svg");
    fireEvent.click(editButton!);

    expect(mockSetBidToEdit).toHaveBeenCalledWith({
      item: mockHistoryItems[0],
    });
    expect(mockSetIsTabsHidden).toHaveBeenCalledWith(true);
  });

  it("handles empty history items array", () => {
    const { container } = renderWithProviders(
      <History
        items={[]}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    // Should render an empty div
    expect(container.getElementsByClassName("edit-button").length).toBe(0);
    expect(screen.queryByText(/options at/)).not.toBeInTheDocument();
  });

  it("applies correct styling to history items", () => {
    renderWithProviders(
      <History
        items={mockHistoryItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    const historyItems = screen.getAllByText(/options at/);

    // First item should have border
    expect(historyItems[0].parentElement?.parentElement).toHaveClass(
      "border-b",
    );

    // Last item should not have border
    expect(historyItems[1].parentElement?.parentElement).not.toHaveClass(
      "border-b",
    );
  });
});

