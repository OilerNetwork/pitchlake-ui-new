import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import History from "@/components/Vault/VaultActions/Tabs/Buyer/History";
import { useExplorer } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";
import { formatUnits } from "ethers";
import useOptionBuyerStateRPC from "@/hooks/vault_v2/rpc/useOptionBuyerStateRPC";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useNewContext } from "@/context/NewProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";

// Mock all hooks first
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useExplorer: jest.fn(),
  useContractRead: jest.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
  }),
}));
jest.mock("@/context/TransactionProvider");
jest.mock("@/context/HelpProvider");
jest.mock("@/context/NewProvider");
jest.mock("@/hooks/vault_v2/rpc/useOptionBuyerStateRPC");
jest.mock("@/hooks/vault_v2/actions/useVaultActions");
jest.mock("@/hooks/vault_v2/states/useRoundState");
jest.mock("@/hooks/vault_v2/states/useVaultState");
jest.mock("ethers");

// Centralized mock configuration
const mockConfig = {
  hooks: {
    explorer: {
      getTransactionLink: jest.fn(),
    },
    transaction: {
      pendingTx: false,
    },
    help: {
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    },
    optionBuyer: {
      historyItems: [
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
      ],
    },
    optionRound: {
      editBid: jest.fn(),
      cancelBid: jest.fn(),
    },
    newContext: {
      conn: "mock",
      selectedRound: 0,
      vaultAddress: "0x123",
      setSelectedRound: jest.fn(),
      wsData: {
        wsOptionRoundStates: [
          {
            address: "0x456",
            state: "Auctioning",
          },
        ],
      },
      mockData: {
        vaultState: {},
        optionRoundStates: [
          {
            address: "0x456",
            state: "Auctioning",
          },
        ],
      },
    },
    roundState: {
      roundState: "Auctioning",
    },
    vaultState: {
      selectedRoundAddress: "0x456",
    },
  },
  utils: {
    formatUnits: (value: string | number | bigint, unit: string) => {
      if (unit === "gwei") {
        return (Number(value) / 1e9).toString();
      }
      if (unit === "ether") {
        return (Number(value) / 1e18).toString();
      }
      return value.toString();
    },
  },
};

// Configure mocks
(useExplorer as jest.Mock).mockReturnValue(mockConfig.hooks.explorer);
(useTransactionContext as jest.Mock).mockReturnValue(
  mockConfig.hooks.transaction,
);
(useHelpContext as jest.Mock).mockReturnValue(mockConfig.hooks.help);
(useNewContext as jest.Mock).mockReturnValue(mockConfig.hooks.newContext);
(useOptionBuyerStateRPC as jest.Mock).mockReturnValue(
  mockConfig.hooks.optionBuyer,
);
(useVaultActions as jest.Mock).mockReturnValue(mockConfig.hooks.optionRound);
(useRoundState as jest.Mock).mockReturnValue(mockConfig.hooks.roundState);
(useVaultState as jest.Mock).mockReturnValue(mockConfig.hooks.vaultState);
(formatUnits as jest.Mock).mockImplementation(mockConfig.utils.formatUnits);

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <div data-testid="help-provider">
      <div data-testid="transaction-provider">{ui}</div>
    </div>,
  );
};

describe("History Component", () => {
  const mockSetBidToEdit = jest.fn();
  const mockSetIsTabsHidden = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders history items correctly", () => {
    renderWithProviders(
      <History
        items={mockConfig.hooks.optionBuyer.historyItems}
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
    const useRoundState =
      require("@/hooks/vault_v2/states/useRoundState").default;

    // With Auctioning state
    useRoundState.mockReturnValue({ roundState: "Auctioning" });
    renderWithProviders(
      <History
        items={mockConfig.hooks.optionBuyer.historyItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: /edit bid/i });
    expect(editButtons).toHaveLength(2);

    cleanup();

    // With Settled state
    useRoundState.mockReturnValue({ roundState: "Settled" });
    renderWithProviders(
      <History
        items={mockConfig.hooks.optionBuyer.historyItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    const settledButtons = screen.queryAllByRole("button", {
      name: /edit bid/i,
    });
    expect(settledButtons).toHaveLength(0);
  });

  it("calls setBidToEdit and setIsTabsHidden when edit button is clicked", () => {
    const useRoundState =
      require("@/hooks/vault_v2/states/useRoundState").default;
    useRoundState.mockReturnValue({ roundState: "Auctioning" });

    renderWithProviders(
      <History
        items={mockConfig.hooks.optionBuyer.historyItems}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    const editButtons = screen.getAllByRole("button", { name: /edit bid/i });
    fireEvent.click(editButtons[0]);

    expect(mockSetBidToEdit).toHaveBeenCalledWith({
      item: mockConfig.hooks.optionBuyer.historyItems[0],
    });
    expect(mockSetIsTabsHidden).toHaveBeenCalledWith(true);
  });

  it("handles empty history items array", () => {
    renderWithProviders(
      <History
        items={[]}
        bidToEdit={null}
        isTabsHidden={false}
        setBidToEdit={mockSetBidToEdit}
        setIsTabsHidden={mockSetIsTabsHidden}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /edit bid/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/options at/)).not.toBeInTheDocument();
  });

  it("applies correct styling to history items", () => {
    renderWithProviders(
      <History
        items={mockConfig.hooks.optionBuyer.historyItems}
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
