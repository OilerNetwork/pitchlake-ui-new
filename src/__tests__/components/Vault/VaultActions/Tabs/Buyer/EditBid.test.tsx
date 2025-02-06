import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import EditBid from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";
import { renderWithProviders } from "@/__tests__/utils/TestWrapper";

// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder, error, "data-item": dataItem }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          data-item={dataItem}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {error && <span data-testid="error-message">{error}</span>}
      </div>
    );
  };
});

jest.mock("@/components/Vault/Utils/ActionButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled, text }: { onClick: () => void, disabled: boolean, text: string }) => (
    <button onClick={onClick} disabled={disabled} data-testid="action-button">{text}</button>
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
      return BigInt(Math.floor(Number(value) * 1e9)); // Convert to WEI
    }
    return BigInt(value);
  }),
}));

// Mock hooks

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
  useContractWrite: () => ({
    writeAsync: jest.fn().mockResolvedValue({ transaction_hash: "0x123" }),
  }),
  useProvider: () => ({
    provider: {},
  }),
  useContract: () => ({
    contract: {
      typedv2: jest.fn().mockReturnValue({
        connect: jest.fn(),
        populateTransaction: {
          approve: jest.fn(),
          update_bid: jest.fn()
        }
      })
    }
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
  const defaultProps = {
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    balance: "2000000000000000000",
    showConfirmation: jest.fn((header, action, onConfirm) => {
      onConfirm();
    }),
    onConfirm: jest.fn(),
    bidToEdit: {
      item: {
        amount: "100",
        price: "1000000000", // 1 GWEI
        bid_id: "1",
      },
    },
  };

  it("validates new price and updates error state", () => {
    renderWithProviders(
      <EditBid {...defaultProps} />
    );

    const priceInput = screen.getByPlaceholderText("e.g. 1");
    const amountInput = screen.getByPlaceholderText("100");

    // Test lower price
    fireEvent.change(priceInput, { target: { value: "0.5" } });
    fireEvent.change(amountInput, { target: { value: "100" } });

    const editButton = screen.getByTestId("action-button");
    expect(editButton).toBeDisabled();
  });

  it("handles bid update flow correctly", () => {
    renderWithProviders(
      <EditBid {...defaultProps} />
    );

    const priceInput = screen.getByPlaceholderText("e.g. 1");
    const amountInput = screen.getByPlaceholderText("100");

    fireEvent.change(priceInput, { target: { value: "2" } });
    fireEvent.change(amountInput, { target: { value: "100" } });

    const editButton = screen.getByTestId("action-button");
    expect(editButton).not.toBeDisabled();

    fireEvent.click(editButton);
    expect(defaultProps.showConfirmation).toHaveBeenCalledWith(
      "Update Bid",
      expect.anything(),
      expect.any(Function)
    );
  });
}); 