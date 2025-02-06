import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WithdrawLiquidity from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawLiquidity";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { parseEther } from "ethers";
import { TestWrapper } from "../../../../../../utils/TestWrapper";
import { useNewContext } from "@/context/NewProvider";
import useLPState from "@/hooks/vault_v2/states/useLPState";

// Mock the hooks
jest.mock("@/context/NewProvider", () => ({
  useNewContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useLPState", () => ({
  __esModule: true,
  default: jest.fn(),
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
    (useNewContext as jest.Mock).mockReturnValue({
      conn: "mock",
      vaultAddress: "0x123",
      mockData: {
        lpState: {
          unlockedBalance: parseEther("10.0"),
        },
      },
    });

    (useLPState as jest.Mock).mockReturnValue({
      unlockedBalance: parseEther("10.0"),
      withdrawLiquidity: mockWithdrawLiquidity,
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });

    // Set initial localStorage value
    localStorage.setItem("withdrawAmount", "5.0");

    const { container } = render(
      <TestWrapper>
        <WithdrawLiquidity showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Check initial render with balance
    const amountInput = container.querySelector("input[type='number']");
    const balanceText = container.querySelector(".balance-label");
    const balanceAmount = container.querySelector(".balance-amount");
    const withdrawButton = container.querySelector(".action-button");

    expect(amountInput).toBeInTheDocument();
    expect(balanceText).toBeInTheDocument();
    expect(balanceAmount).toBeInTheDocument();
    expect(withdrawButton).toBeInTheDocument();

    // Check localStorage value loaded
    expect(amountInput).toHaveValue(5);

    // Test input change
    if (amountInput) {
      fireEvent.change(amountInput, { target: { value: "7.0" } });
      expect(localStorage.getItem("withdrawAmount")).toBe("7.0");

      // Test with invalid amount (exceeds balance)
      fireEvent.change(amountInput, { target: { value: "15.0" } });
      expect(container.querySelector(".error-message")).toBeInTheDocument();

      // Test with valid amount
      fireEvent.change(amountInput, { target: { value: "5.0" } });
      expect(withdrawButton).not.toBeDisabled();

      // Test with no amount
      fireEvent.change(amountInput, { target: { value: "" } });
      expect(withdrawButton).toBeDisabled();

      // Test with zero amount
      fireEvent.change(amountInput, { target: { value: "0" } });
      expect(withdrawButton).toBeDisabled();

      // Test with negative amount
      fireEvent.change(amountInput, { target: { value: "-1" } });
      expect(withdrawButton).toBeDisabled();

      // Test confirmation modal
      fireEvent.change(amountInput, { target: { value: "5.0" } });
      if (withdrawButton) {
        fireEvent.click(withdrawButton);
        expect(mockShowConfirmation).toHaveBeenCalledWith(
          "Liquidity Withdraw",
          expect.anything(),
          expect.any(Function)
        );
      }
    }

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockWithdrawLiquidity).toHaveBeenCalledWith({
      amount: parseEther("5.0"),
    });

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    const { container: pendingContainer } = render(
      <TestWrapper>
        <WithdrawLiquidity showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const pendingButton = pendingContainer.querySelector(".action-button");
    expect(pendingButton).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    const { container: noAccountContainer } = render(
      <TestWrapper>
        <WithdrawLiquidity showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const noAccountButton = noAccountContainer.querySelector(".action-button");
    expect(noAccountButton).toBeDisabled();
  });

  it("disables form when transaction is pending", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      conn: "mock",
      vaultAddress: "0x123",
      mockData: {
        lpState: {
          unlockedBalance: parseEther("10.0"),
        },
      },
    });

    (useLPState as jest.Mock).mockReturnValue({
      unlockedBalance: parseEther("10.0"),
      withdrawLiquidity: mockWithdrawLiquidity,
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });

    render(
      <TestWrapper>
        <WithdrawLiquidity showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    const withdrawButton = screen.getByRole("button");
    expect(withdrawButton).toBeDisabled();
  });
}); 