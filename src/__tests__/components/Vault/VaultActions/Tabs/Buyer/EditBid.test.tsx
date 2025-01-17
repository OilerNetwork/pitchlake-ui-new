import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import EditBid from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";

// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder }: any) {
    return (
      <input
        className="input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
});

jest.mock("@/components/Vault/Utils/ActionButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled, text }: { onClick: () => void, disabled: boolean, text: string }) => (
    <button onClick={onClick} disabled={disabled}>{text}</button>
  ),
}));

// Mock utils
jest.mock("ethers", () => ({
  parseEther: jest.fn((value) => value),
  formatEther: jest.fn((value) => value.toString()),
  formatUnits: jest.fn().mockImplementation((value, unit) => {
    if (unit === "gwei") {
      return "1"; // Current bid price in GWEI
    }
    return "0";
  }),
  parseUnits: jest.fn().mockImplementation((value, unit) => {
    if (unit === "gwei") {
      return value + "000000000"; // Convert to WEI
    }
    return value;
  }),
}));

jest.mock("starknet", () => ({
  num: {
    toBigInt: jest.fn((value) => {
      // Convert decimal numbers to integers by removing decimal points
      const strValue = value.toString();
      const intValue = strValue.includes('.') ? strValue.replace('.', '') : strValue;
      return BigInt(intValue);
    }),
  },
  Call: jest.fn(),
}));

// Mock all hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: () => ({
    vaultState: {
      ethAddress: "0x123",
    },
    selectedRoundState: {
      address: "0x456",
      availableOptions: "1000000",
      reservePrice: "1000000000", // 1 GWEI
      auctionEndDate: "9999999999",
    },
    roundActions: {},
  }),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: () => ({
    pendingTx: null,
    setPendingTx: jest.fn(),
  }),
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: () => ({
    account: "0x789",
  }),
  useSendTransaction: () => ({
    sendAsync: jest.fn().mockResolvedValue({ transaction_hash: "0x123" }),
  }),
  useProvider: () => ({
    provider: {},
  }),
  useContract: () => ({
    contract: {
      typedv2: () => ({
        connect: jest.fn(),
        approve: jest.fn(),
        update_bid: jest.fn(),
        populateTransaction: {
          approve: jest.fn(),
          update_bid: jest.fn(),
        },
      }),
    },
  }),
}));

jest.mock("@/hooks/chain/useLatestTimestamp", () => ({
  __esModule: true,
  default: () => ({
    timestamp: 1000000000,
  }),
}));

jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: () => ({
    allowance: "1000000000000000000",
    balance: "2000000000000000000",
  }),
}));

describe("EditBid Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();
  const mockBidToEdit = {
    item: {
      amount: "100",
      price: "1000000000", // 1 GWEI
      bid_id: "1",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders with initial state", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Check if price input is rendered with current price
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    expect(priceInput).toBeInTheDocument();
    expect(priceInput).toHaveValue("");

    // Check if edit button is rendered and disabled initially
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toBeDisabled();
  });

  it("enables edit button when new price is higher than current price", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter higher price
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Check if edit button is enabled
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    expect(editButton).not.toBeDisabled();
  });

  it("disables edit button when new price is lower than current price", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter lower price
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    fireEvent.change(priceInput, { target: { value: "0.5" } });

    // Check if edit button is disabled
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    expect(editButton).toBeDisabled();
  });

  it("shows confirmation modal when editing bid", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter higher price
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Click edit button
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    fireEvent.click(editButton);

    // Check if confirmation modal is shown
    expect(mockShowConfirmation).toHaveBeenCalled();
  });

  it("saves bid price to localStorage", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter price
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Check if value is saved to localStorage
    expect(localStorage.getItem("editBidPriceGwei")).toBe("2");
  });

  it("loads price from localStorage on mount", () => {
    // Set value in localStorage
    localStorage.setItem("editBidPriceGwei", "2");

    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Check if input has value from localStorage
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    expect(priceInput).toHaveValue("2");
  });

  it("calls onClose when clicking back button", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Click back button
    const backButton = screen.getByRole("button", { name: "" });
    fireEvent.click(backButton);

    // Check if onClose was called
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 