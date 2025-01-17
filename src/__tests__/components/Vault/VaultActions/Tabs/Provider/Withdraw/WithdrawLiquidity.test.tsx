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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("WithdrawLiquidity", () => {
  const mockShowConfirmation = jest.fn();
  const mockWithdrawLiquidity = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useProtocolContext
    (useProtocolContext as jest.Mock).mockReturnValue({
      lpState: {
        unlockedBalance: parseEther("10.0"),
      },
      vaultActions: {
        withdrawLiquidity: mockWithdrawLiquidity,
      },
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });
  });

  it("renders with initial state", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    expect(screen.getByLabelText("Enter Amount")).toBeInTheDocument();
    expect(screen.getByText("Unlocked Balance")).toBeInTheDocument();
    expect(screen.getByText("10.000 ETH")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Withdraw" })).toBeInTheDocument();
  });

  it("loads amount from localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue("5.0");

    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    expect(screen.getByLabelText("Enter Amount")).toHaveValue(5);
  });

  it("updates amount on input change", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "5.0" } });

    expect(input).toHaveValue(5);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("withdrawAmount", "5.0");
  });

  it("disables withdraw button when amount exceeds balance", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "15.0" } });

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    expect(screen.getByText("Exceeds balance (10 ETH)")).toBeInTheDocument();
  });

  it("disables withdraw button when amount is 0", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "0" } });

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    expect(screen.getByText("Amount must be greater than 0")).toBeInTheDocument();
  });

  it("disables withdraw button when amount is negative", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "-5.0" } });

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
    expect(screen.getByText("Amount must be positive")).toBeInTheDocument();
  });

  it("disables withdraw button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("shows confirmation modal when withdraw button is clicked", () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "5.0" } });

    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });
    fireEvent.click(withdrawButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Liquidity Withdraw",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls withdrawLiquidity when confirmation is confirmed", async () => {
    render(<WithdrawLiquidity showConfirmation={mockShowConfirmation} />);

    const input = screen.getByLabelText("Enter Amount");
    fireEvent.change(input, { target: { value: "5.0" } });

    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });
    fireEvent.click(withdrawButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockWithdrawLiquidity).toHaveBeenCalledWith({
      amount: parseEther("5.0"),
    });
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("withdrawAmount");
  });
}); 