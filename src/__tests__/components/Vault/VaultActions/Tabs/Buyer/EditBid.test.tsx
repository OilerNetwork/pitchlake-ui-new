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

  it("validates new price against current bid price", () => {
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

    // Verify error state
    expect(screen.getByText("New price must be higher than current price")).toBeInTheDocument();
  });

  it("calculates additional cost correctly", () => {
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

    // Verify additional cost calculation
    expect(screen.getByText("Additional Cost: 100 ETH")).toBeInTheDocument();
  });

  it("shows confirmation with correct bid update details", () => {
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

    // Submit edit
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    fireEvent.click(editButton);

    // Verify confirmation details
    expect(mockShowConfirmation).toHaveBeenCalledWith({
      bidId: "1",
      currentPrice: "1",
      newPrice: "2",
      additionalCost: "100"
    });
  });

  it("persists edit price in localStorage", () => {
    // Set initial value
    localStorage.setItem("editBidPriceGwei", "2");

    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Verify value is loaded
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    expect(priceInput).toHaveValue("2");

    // Update value
    fireEvent.change(priceInput, { target: { value: "3" } });

    // Verify localStorage is updated
    expect(localStorage.getItem("editBidPriceGwei")).toBe("3");
  });

  it("handles bid update confirmation", () => {
    render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter higher price and submit
    const priceInput = screen.getByPlaceholderText("e.g. 1");
    fireEvent.change(priceInput, { target: { value: "2" } });
    
    const editButton = screen.getByRole("button", { name: "Edit Bid" });
    fireEvent.click(editButton);

    // Verify onConfirm is called with correct params
    expect(mockOnConfirm).toHaveBeenCalledWith({
      bidId: "1",
      newPrice: "2000000000" // 2 GWEI in WEI
    });
  });
}); 