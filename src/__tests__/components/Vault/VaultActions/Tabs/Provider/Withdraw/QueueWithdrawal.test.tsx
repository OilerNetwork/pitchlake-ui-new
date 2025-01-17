import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import QueueWithdrawal from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/QueueWithdrawal";
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

describe("QueueWithdrawal", () => {
  const mockShowConfirmation = jest.fn();
  const mockQueueWithdrawal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useProtocolContext
    (useProtocolContext as jest.Mock).mockReturnValue({
      lpState: {
        lockedBalance: parseEther("10.0"),
        queuedBps: 2500, // 25%
      },
      vaultActions: {
        queueWithdrawal: mockQueueWithdrawal,
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
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByLabelText("Choose Percentage")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveValue("25");
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText("Current Locked Balance")).toBeInTheDocument();
    expect(screen.getByText("10.000 ETH")).toBeInTheDocument();
  });

  it("updates percentage when slider is moved", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(slider).toHaveValue("50");
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("disables withdraw button when percentage is unchanged", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("enables withdraw button when percentage is changed", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeEnabled();
  });

  it("disables withdraw button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("disables withdraw button when no account is connected", () => {
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Withdraw" })).toBeDisabled();
  });

  it("shows confirmation modal with correct percentage values", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });
    fireEvent.click(withdrawButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Liquidity Withdraw",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls queueWithdrawal with correct BPS when confirmation is confirmed", async () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    const withdrawButton = screen.getByRole("button", { name: "Withdraw" });
    fireEvent.click(withdrawButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    // 50% should be converted to 5000 BPS
    expect(mockQueueWithdrawal).toHaveBeenCalledWith({
      bps: 5000,
    });
  });

  it("updates state when lpState.queuedBps changes", () => {
    const { rerender } = render(
      <QueueWithdrawal showConfirmation={mockShowConfirmation} />
    );

    // Initial state should be 25%
    expect(screen.getByRole("slider")).toHaveValue("25");

    // Update lpState.queuedBps to 5000 (50%)
    (useProtocolContext as jest.Mock).mockReturnValue({
      lpState: {
        lockedBalance: parseEther("10.0"),
        queuedBps: 5000,
      },
      vaultActions: {
        queueWithdrawal: mockQueueWithdrawal,
      },
    });

    rerender(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    // State should update to 50%
    expect(screen.getByRole("slider")).toHaveValue("50");
  });
}); 