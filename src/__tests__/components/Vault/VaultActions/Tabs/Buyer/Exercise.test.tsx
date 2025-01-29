import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Exercise from "@/components/Vault/VaultActions/Tabs/Buyer/Exercise";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import useERC20 from "@/hooks/erc20/useERC20";
import { TestWrapper } from "../../../../../utils/TestWrapper";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
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

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("Exercise Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockExerciseOptions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders exercise component with correct states and handles interactions", () => {
    // Test with valid state
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        exerciseOptions: mockExerciseOptions.mockImplementation(() => Promise.resolve()),
      },
      selectedRoundBuyerState: {
        mintableOptions: "1000",
        hasMinted: true,
      },
      selectedRoundState: {
        address: "0x456",
        payoutPerOption: "1000000000000000000", // 1 ETH
      },
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    (useAccount as jest.Mock).mockReturnValue({
      address: "0x123",
      account: {
        address: "0x123",
      },
    });

    (useERC20 as jest.Mock).mockReturnValue({
      balance: "1000",
    });

    const { container } = render(
      <TestWrapper>
        <Exercise showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Check initial render
    const exerciseButton = container.querySelector(".action-button");
    expect(exerciseButton).toBeInTheDocument();
    expect(exerciseButton).not.toBeDisabled();

    // Test confirmation modal
    if (exerciseButton) {
      fireEvent.click(exerciseButton);
      expect(mockShowConfirmation).toHaveBeenCalledWith(
        "Exercise",
        expect.anything(),
        expect.any(Function)
      );
    }

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockExerciseOptions).toHaveBeenCalled();

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    const { container: pendingContainer } = render(
      <TestWrapper>
        <Exercise showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const pendingButton = pendingContainer.querySelector(".action-button");
    expect(pendingButton).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    const { container: noAccountContainer } = render(
      <TestWrapper>
        <Exercise showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const noAccountButton = noAccountContainer.querySelector(".action-button");
    expect(noAccountButton).toBeDisabled();

    // Test with zero payout balance
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        exerciseOptions: mockExerciseOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "0",
        hasMinted: false,
      },
      selectedRoundState: {
        address: "0x456",
        payoutPerOption: "0",
      },
    });

    (useERC20 as jest.Mock).mockReturnValue({
      balance: "0",
    });

    const { container: zeroBalanceContainer } = render(
      <TestWrapper>
        <Exercise showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    const zeroBalanceButton = zeroBalanceContainer.querySelector(".action-button");
    expect(zeroBalanceButton).toBeDisabled();
  });
}); 