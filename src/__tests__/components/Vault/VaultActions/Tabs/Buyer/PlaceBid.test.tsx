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
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter amount exceeding available options
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    fireEvent.change(amountInput, { target: { value: "2000000000000000000" } });

    // Check if bid button is disabled
    const bidButton = screen.getByText("Place Bid");
    expect(bidButton).toBeDisabled();
  });

  it("disables bid button when price is below reserve price", () => {
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter price below reserve price
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");
    fireEvent.change(priceInput, { target: { value: "0.5" } });

    // Check if bid button is disabled
    const bidButton = screen.getByText("Place Bid");
    expect(bidButton).toBeDisabled();
  });

  it("shows confirmation modal when placing bid", () => {
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter valid amount and price
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");

    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Click bid button
    const bidButton = screen.getByText("Place Bid");
    fireEvent.click(bidButton);

    // Check if confirmation modal is shown
    expect(mockShowConfirmation).toHaveBeenCalled();
  });

  it("saves bid values to localStorage", () => {
    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Enter values
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");

    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Check if values are saved to localStorage
    expect(localStorage.getItem("bidAmount")).toBe("100");
    expect(localStorage.getItem("bidPriceGwei")).toBe("2");
  });

  it("loads values from localStorage on mount", () => {
    // Set values in localStorage
    localStorage.setItem("bidAmount", "100");
    localStorage.setItem("bidPriceGwei", "2");

    render(<PlaceBid showConfirmation={mockShowConfirmation} />);

    // Check if inputs have values from localStorage
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");

    expect(amountInput).toHaveValue("100");
    expect(priceInput).toHaveValue("2");
  });
}); 