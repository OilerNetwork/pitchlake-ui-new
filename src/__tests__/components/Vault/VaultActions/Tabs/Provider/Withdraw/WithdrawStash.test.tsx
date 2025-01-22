import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WithdrawStash from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawStash";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { parseEther } from "ethers";
import { num } from "starknet";

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

// Mock the Icons
jest.mock("@/components/Icons", () => ({
  CollectEthIcon: ({ classname }: { classname: string }) => (
    <div data-testid="collect-eth-icon" className={classname} />
  ),
}));

describe("WithdrawStash", () => {
  const mockShowConfirmation = jest.fn();
  const mockWithdrawStash = jest.fn();
  const mockAccount = "0x123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders stash withdrawal with correct states and handles interactions", () => {
    // Test with balance
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultState: {
        stashedBalance: num.toBigInt(parseEther("5.0")),
      },
      lpState: {
        stashedBalance: parseEther("5.0"),
      },
      vaultActions: {
        withdrawStash: mockWithdrawStash,
      },
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });

    const { container, rerender } = render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    // Check initial render with balance
    expect(screen.getByTestId("collect-eth-icon")).toBeInTheDocument();
    expect(screen.getByText("Your current stashed balance is")).toBeInTheDocument();
    expect(screen.getByText("5.000 ETH")).toBeInTheDocument();
    
    const collectButton = screen.getByRole("button", { name: "Collect" });
    expect(collectButton).toBeEnabled();

    // Test confirmation modal
    fireEvent.click(collectButton);
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Withdraw Stashed",
      expect.anything(),
      expect.any(Function)
    );

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockWithdrawStash).toHaveBeenCalledWith({
      account: mockAccount,
    });

    // Test with zero balance
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultState: {
        stashedBalance: num.toBigInt(0),
      },
      lpState: {
        stashedBalance: parseEther("0"),
      },
      vaultActions: {
        withdrawStash: mockWithdrawStash,
      },
    });

    rerender(<WithdrawStash showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("0 ETH")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    rerender(<WithdrawStash showConfirmation={mockShowConfirmation} />);
    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    rerender(<WithdrawStash showConfirmation={mockShowConfirmation} />);
    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  });
}); 