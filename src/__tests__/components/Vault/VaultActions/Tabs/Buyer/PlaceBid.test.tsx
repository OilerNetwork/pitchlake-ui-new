import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceBid from "@/components/Vault/VaultActions/Tabs/Buyer/PlaceBid";
import { TestWrapper } from "../../../../../utils/TestWrapper";

// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder }: any) {
    return (
      <input
        data-testid="input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
});

jest.mock("@/components/Vault/Utils/ActionButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled }: any) => (
    <button data-testid="place-bid-action-button" onClick={onClick} disabled={disabled}>Place Bid</button>
  ),
}));

// Mock all hooks with minimal required data
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: () => ({
    vaultState: { ethAddress: "0x123" },
    selectedRoundState: {
      address: "0x456",
      availableOptions: "1000",
      reservePrice: "1",
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
  useAccount: () => ({ account: "0x123" }),
  useContractWrite: () => ({
    writeAsync: jest.fn(),
    data: null,
    error: null,
    isPending: false,
  }),
  useProvider: () => ({ provider: {} }),
  useContract: () => ({ 
    contract: {
      typedv2: jest.fn().mockReturnValue({
        connect: jest.fn(),
        populateTransaction: {
          approve: jest.fn(),
          place_bid: jest.fn()
        }
      })
    } 
  }),
}));

jest.mock("@/hooks/chain/useLatestTimestamp", () => ({
  __esModule: true,
  default: () => ({ timestamp: 1000000000 }),
}));

jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: () => ({
    allowance: "1000",
    balance: "2000",
  }),
}));

describe("PlaceBid", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("handles bid submission flow", () => {
    render(
      <TestWrapper>
        <PlaceBid showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Enter valid bid details
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");
    
    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Submit bid
    const bidButton = screen.getByTestId("place-bid-action-button");
    fireEvent.click(bidButton);

    // Verify confirmation dialog is shown
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Bid",
      expect.anything(),
      expect.any(Function)
    );
  });
}); 