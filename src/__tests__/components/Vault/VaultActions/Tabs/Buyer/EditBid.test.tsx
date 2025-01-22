import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import EditBid from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";

// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder, error }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          className="input-field"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {error && <span className="error-message">{error}</span>}
      </div>
    );
  };
});

jest.mock("@/components/Vault/Utils/ActionButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled, text }: { onClick: () => void, disabled: boolean, text: string }) => (
    <button onClick={onClick} disabled={disabled} className="action-button">{text}</button>
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
      const strValue = value.toString();
      const intValue = strValue.includes('.') ? strValue.replace('.', '') : strValue;
      return BigInt(intValue);
    }),
  },
  Call: jest.fn(),
}));

// Mock hooks
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
  const mockShowConfirmation = jest.fn((header, action, onConfirm) => {
    // Simulate user confirming the action
    onConfirm();
  });
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

  it("renders with initial state and current bid details", () => {
    const { container } = render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Check if modal is rendered
    expect(container.querySelector(".edit-bid-modal")).toBeInTheDocument();

    // Check if current amount is displayed
    const currentAmountSection = container.querySelector(".edit-bid-current-amount");
    const currentAmountInput = currentAmountSection?.querySelector("input");
    expect(currentAmountInput).toHaveAttribute("placeholder", "100");

    // Check if current price is displayed in the new price input placeholder
    const newPriceSection = container.querySelector(".edit-bid-new-price");
    const newPriceInput = newPriceSection?.querySelector("input");
    expect(newPriceInput).toHaveAttribute("placeholder", "e.g. 1");

    // Edit button should be disabled initially
    const editButton = container.querySelector(".action-button");
    expect(editButton).toBeDisabled();
  });

  it("validates new price and updates error state", () => {
    const { container } = render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    const newPriceSection = container.querySelector(".edit-bid-new-price");
    const newPriceInput = newPriceSection?.querySelector("input");

    // Test lower price
    fireEvent.change(newPriceInput!, { target: { value: "0.5" } });
    expect(container.querySelector(".error-message")).toHaveTextContent("Bid price must increase");

    // Test valid price
    fireEvent.change(newPriceInput!, { target: { value: "2" } });
    expect(container.querySelector(".error-message")).toBeNull();
  });

  it("handles bid update flow correctly", async () => {
    const { container } = render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Enter valid price
    const newPriceSection = container.querySelector(".edit-bid-new-price");
    const newPriceInput = newPriceSection?.querySelector("input");
    fireEvent.change(newPriceInput!, { target: { value: "2" } });

    // Submit edit
    const editButton = container.querySelector(".action-button");
    fireEvent.click(editButton!);

    // Verify confirmation was shown with correct parameters
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Update Bid",
      expect.anything(),
      expect.any(Function)
    );

    // Get the confirmation callback
    const confirmCallback = mockShowConfirmation.mock.calls[0][2];
    
    // Call the confirmation callback to simulate user confirming
    await act(async () => {
      await confirmCallback();
    });

    // Now onClose should have been called
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("persists and loads price from localStorage", () => {
    // Set initial value
    localStorage.setItem("editBidPriceGwei", "2");

    const { container } = render(
      <EditBid
        showConfirmation={mockShowConfirmation}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        bidToEdit={mockBidToEdit}
      />
    );

    // Verify value is loaded
    const newPriceSection = container.querySelector(".edit-bid-new-price");
    const newPriceInput = newPriceSection?.querySelector("input");
    expect(newPriceInput).toHaveValue("2");

    // Update value
    fireEvent.change(newPriceInput!, { target: { value: "3" } });

    // Verify localStorage is updated
    expect(localStorage.getItem("editBidPriceGwei")).toBe("3");
  });
}); 