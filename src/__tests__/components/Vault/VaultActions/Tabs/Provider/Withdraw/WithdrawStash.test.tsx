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
    });

    (useAccount as jest.Mock).mockReturnValue({
      account: {
        address: mockAccount,
      },
    });

    const { container } = render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Check initial render with balance
    expect(container.querySelector(".collect-eth-icon")).toBeInTheDocument();
    expect(container.querySelector(".stash-balance-text")).toBeInTheDocument();
    expect(container.querySelector(".stash-balance-amount")).toBeInTheDocument();
    
    const collectButton = container.querySelector(".action-button");
    expect(collectButton).toBeInTheDocument();
    
    // Test confirmation modal
    if (collectButton) {
      fireEvent.click(collectButton);
      expect(mockShowConfirmation).toHaveBeenCalledWith(
        "Withdraw Stashed",
        expect.anything(),
        expect.any(Function)
      );
    }

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockWithdrawStash).toHaveBeenCalledWith({
      account: mockAccount,
    });

    // Test with zero balance
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

    const { container: zeroBalanceContainer } = render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const zeroBalanceButton = zeroBalanceContainer.querySelector(".action-button");
    const zeroBalanceAmount = zeroBalanceContainer.querySelector(".stash-balance-amount");
    expect(zeroBalanceAmount?.textContent).toBe("0 ETH");
    expect(zeroBalanceButton).toBeDisabled();

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    const { container: pendingContainer } = render(
      <TestWrapper>
        <WithdrawStash showConfirmation={mockShowConfirmation} />
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
        <WithdrawStash showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const noAccountButton = noAccountContainer.querySelector(".action-button");
    expect(noAccountButton).toBeDisabled();
  });
}); 