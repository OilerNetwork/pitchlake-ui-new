import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WithdrawStash from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawStash";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { parseEther } from "ethers";
import { num } from "starknet";
import { TestWrapper } from "../../../../../../utils/TestWrapper";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import useLPState from "@/hooks/vault_v2/states/useLPState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";

// Mock the hooks
jest.mock("@/hooks/vault_v2/actions/useVaultActions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useLPState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useContractWrite: jest.fn().mockReturnValue({
    writeAsync: jest.fn(),
    data: null,
    error: null,
    isPending: false,
  }),
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
    (useLPState as jest.Mock).mockReturnValue({
      stashedBalance: parseEther("1000"),
    });

    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        stashedBalance: num.toBigInt(1000),
      },
    });

    (useVaultActions as jest.Mock).mockReturnValue({
      withdrawStash: mockWithdrawStash,
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      setStatusModalProps: jest.fn(),
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });

    render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Check initial render with balance
    expect(screen.getByTestId("collect-eth-icon")).toBeInTheDocument();
    expect(screen.getByText(/Your current stashed balance is/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 ETH/i)).toBeInTheDocument();
    
    const collectButton = screen.getByRole("button", { name: /collect/i });
    expect(collectButton).toBeInTheDocument();
    expect(collectButton).not.toBeDisabled();
    
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
  });

  it("disables button with zero balance", () => {
    (useLPState as jest.Mock).mockReturnValue({
      stashedBalance: parseEther("0"),
    });

    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        stashedBalance: num.toBigInt(0),
      },
    });

    (useVaultActions as jest.Mock).mockReturnValue({
      withdrawStash: mockWithdrawStash,
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      setStatusModalProps: jest.fn(),
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });

    render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    expect(screen.getByText("0 ETH")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /collect/i })).toBeDisabled();
  });

  it("disables button with pending transaction", () => {
    (useLPState as jest.Mock).mockReturnValue({
      stashedBalance: parseEther("1000"),
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
      setStatusModalProps: jest.fn(),
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });

    render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /collect/i })).toBeDisabled();
  });

  it("disables button with no account", () => {
    (useLPState as jest.Mock).mockReturnValue({
      stashedBalance: parseEther("1000"),
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      setStatusModalProps: jest.fn(),
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: null,
    });

    render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    expect(screen.getByRole("button", { name: /collect/i })).toBeDisabled();
  });
}); 