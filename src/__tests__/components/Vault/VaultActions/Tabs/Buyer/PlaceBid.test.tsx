import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceBid from "@/components/Vault/VaultActions/Tabs/Buyer/PlaceBid";
// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder }: any) {
    return (
      <input
        data-testid={`input-${label}`}
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
      return "1"; // Reserve price in GWEI
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
        place_bid: jest.fn(),
        populateTransaction: {
          approve: jest.fn(),
          place_bid: jest.fn(),
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

describe("PlaceBid Component", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders with initial state", () => {
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Check if inputs are rendered
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");
    expect(amountInput).toBeInTheDocument();
    expect(priceInput).toBeInTheDocument();

    // Check if bid button is rendered and disabled initially
    const bidButton = screen.getByText("Place Bid");
    expect(bidButton).toBeInTheDocument();
    expect(bidButton).toBeDisabled();
  });

  it("enables bid button when valid inputs are provided", () => {
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter valid amount
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    fireEvent.change(amountInput, { target: { value: "100" } });

    // Enter valid price
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Check if bid button is enabled
    const bidButton = screen.getByText("Place Bid");
    expect(bidButton).not.toBeDisabled();
  });

  it("disables bid button when amount exceeds available options", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter amount exceeding available options
    const amountInput = container.querySelector(".amount-input");
    fireEvent.change(amountInput!, { target: { value: "2000000000000000000" } });

    // Check if bid button is disabled
    const bidButton = container.querySelector(".bid-button");
    expect(bidButton).toBeDisabled();
  });

  it("disables bid button when price is below reserve price", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter price below reserve price
    const priceInput = container.querySelector(".price-input");
    fireEvent.change(priceInput!, { target: { value: "0.5" } });

    // Check if bid button is disabled
    const bidButton = container.querySelector(".bid-button");
    expect(bidButton).toBeDisabled();
  });

  it("shows confirmation modal when placing bid", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter valid amount and price
    const amountInput = container.querySelector(".amount-input");
    const priceInput = container.querySelector(".price-input");

    fireEvent.change(amountInput!, { target: { value: "100" } });
    fireEvent.change(priceInput!, { target: { value: "2" } });

    // Click bid button
    const bidButton = container.querySelector(".bid-button");
    fireEvent.click(bidButton!);

    // Check if confirmation modal is shown
    expect(mockShowConfirmation).toHaveBeenCalled();
  });

  it("saves bid values to localStorage", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter values
    const amountInput = container.querySelector(".amount-input");
    const priceInput = container.querySelector(".price-input");

    fireEvent.change(amountInput!, { target: { value: "100" } });
    fireEvent.change(priceInput!, { target: { value: "2" } });

    // Check if values are saved to localStorage
    expect(localStorage.getItem("bidAmount")).toBe("100");
    expect(localStorage.getItem("bidPriceGwei")).toBe("2");
  });

  it("loads values from localStorage on mount", () => {
    // Set values in localStorage
    localStorage.setItem("bidAmount", "100");
    localStorage.setItem("bidPriceGwei", "2");

    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Check if inputs have values from localStorage
    const amountInput = container.querySelector(".amount-input");
    const priceInput = container.querySelector(".price-input");

    expect(amountInput).toHaveValue("100");
    expect(priceInput).toHaveValue("2");
  });

  it("validates bid amount against available options", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter amount exceeding available options
    const amountInput = container.querySelector(".amount-input");
    fireEvent.change(amountInput!, { target: { value: "2000000000000000000" } });

    // Verify error state
    const errorMessage = container.querySelector(".amount-error");
    expect(errorMessage).toHaveTextContent("Amount exceeds available options");
  });

  it("validates bid price against reserve price", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter price below reserve price
    const priceInput = container.querySelector(".price-input");
    fireEvent.change(priceInput!, { target: { value: "0.5" } });

    // Verify error state
    const errorMessage = container.querySelector(".price-error");
    expect(errorMessage).toHaveTextContent("Price must be above reserve price");
  });

  it("calculates total cost correctly", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter valid amount and price
    const amountInput = container.querySelector(".amount-input");
    const priceInput = container.querySelector(".price-input");

    fireEvent.change(amountInput!, { target: { value: "100" } });
    fireEvent.change(priceInput!, { target: { value: "2" } });

    // Verify total cost calculation
    const totalCost = container.querySelector(".total-cost");
    expect(totalCost).toHaveTextContent("Total Cost: 200 ETH");
  });

  it("shows confirmation with correct bid details", () => {
    const { container } = render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter valid bid details
    const amountInput = container.querySelector(".amount-input");
    const priceInput = container.querySelector(".price-input");

    fireEvent.change(amountInput!, { target: { value: "100" } });
    fireEvent.change(priceInput!, { target: { value: "2" } });

    // Submit bid
    const bidButton = container.querySelector(".bid-button");
    fireEvent.click(bidButton!);

    // Verify confirmation details
    expect(mockShowConfirmation).toHaveBeenCalledWith({
      amount: "100",
      price: "2",
      totalCost: "200"
    });
  });

  it("persists bid values in localStorage", () => {
    // Set initial values
    localStorage.setItem("bidAmount", "100");
    localStorage.setItem("bidPriceGwei", "2");

    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Verify values are loaded
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");

    expect(amountInput).toHaveValue("100");
    expect(priceInput).toHaveValue("2");

    // Update values
    fireEvent.change(amountInput, { target: { value: "200" } });
    fireEvent.change(priceInput, { target: { value: "3" } });

    // Verify localStorage is updated
    expect(localStorage.getItem("bidAmount")).toBe("200");
    expect(localStorage.getItem("bidPriceGwei")).toBe("3");
  });
}); 