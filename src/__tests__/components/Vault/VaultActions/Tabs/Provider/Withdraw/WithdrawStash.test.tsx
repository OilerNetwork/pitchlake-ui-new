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

    // Mock useProtocolContext
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

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });
  });

  it("renders with initial state", () => {
    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByTestId("collect-eth-icon")).toBeInTheDocument();
    expect(screen.getByText("Your current stashed balance is")).toBeInTheDocument();
    expect(screen.getByText("5.000 ETH")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collect" })).toBeInTheDocument();
  });

  it("enables collect button when stashed balance is greater than 0", () => {
    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Collect" })).toBeEnabled();
  });

  it("disables collect button when stashed balance is 0", () => {
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

    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  });

  it("disables collect button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  });

  it("disables collect button when no account is connected", () => {
    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  });

  it("shows confirmation modal with correct stashed balance", () => {
    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    const collectButton = screen.getByRole("button", { name: "Collect" });
    fireEvent.click(collectButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Withdraw Stashed",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls withdrawStash with correct account when confirmation is confirmed", async () => {
    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    const collectButton = screen.getByRole("button", { name: "Collect" });
    fireEvent.click(collectButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockWithdrawStash).toHaveBeenCalledWith({
      account: mockAccount,
    });
  });

  it("displays 0 ETH when no stashed balance", () => {
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

    render(<WithdrawStash showConfirmation={mockShowConfirmation} />);

    expect(screen.getByText("0 ETH")).toBeInTheDocument();
  });
}); 