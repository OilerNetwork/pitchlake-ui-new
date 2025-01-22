import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WithdrawLiquidity from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawLiquidity";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { parseEther } from "ethers";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

describe("WithdrawLiquidity", () => {
  const mockShowConfirmation = jest.fn();
  const mockWithdrawLiquidity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders withdrawal form with correct states and handles interactions", () => {
    // Test with balance
    (useProtocolContext as jest.Mock).mockReturnValue({
      lpState: {
        unlockedBalance: parseEther("10.0"),
      },
      vaultActions: {
        withdrawLiquidity: mockWithdrawLiquidity,
      },
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });

    // Set initial localStorage value
    localStorage.setItem("withdrawAmountWei", "5.0");

    const { container, rerender } = render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    // Check initial render with balance
    const amountInput = screen.getByLabelText("Enter Amount");
    const balanceText = screen.getByText("Unlocked Balance");
    const balanceAmount = screen.getByText("10.000 ETH");
    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });

    expect(amountInput).toBeInTheDocument();
    expect(balanceText).toBeInTheDocument();
    expect(balanceAmount).toBeInTheDocument();
    expect(withdrawButton).toBeInTheDocument();

    // Check localStorage value loaded
    expect(amountInput).toHaveValue(5);

    // Test input change
    fireEvent.change(amountInput, { target: { value: "7.0" } });
    expect(localStorage.getItem("withdrawAmountWei")).toBe("7.0");

    // Test with invalid amount (exceeds balance)
    fireEvent.change(amountInput, { target: { value: "15.0" } });
    expect(withdrawButton).toBeDisabled();
    expect(screen.getByText("Amount exceeds unlocked balance")).toBeInTheDocument();

    // Test with valid amount
    fireEvent.change(amountInput, { target: { value: "5.0" } });
    expect(withdrawButton).toBeEnabled();

    // Test confirmation modal
    fireEvent.click(withdrawButton);
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Withdraw",
      expect.anything(),
      expect.any(Function)
    );

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockWithdrawLiquidity).toHaveBeenCalledWith({
      account: "0x123",
      amount: parseEther("5.0"),
    });

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    rerender(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);
    expect(withdrawButton).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    rerender(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);
    expect(withdrawButton).toBeDisabled();
  });
}); 