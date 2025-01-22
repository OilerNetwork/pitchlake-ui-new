import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Exercise from "../../../../../../components/Vault/VaultActions/Tabs/Buyer/Exercise";
import { useProtocolContext } from "../../../../../../context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "../../../../../../context/TransactionProvider";
import useERC20 from "../../../../../../hooks/erc20/useERC20";

// Mock the hooks
jest.mock("../../../../../../context/ProtocolProvider", () => ({
  __esModule: true,
  useProtocolContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useAccount: jest.fn(),
}));

jest.mock("../../../../../../context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
}));

jest.mock("../../../../../../hooks/erc20/useERC20", () => ({
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
        exerciseOptions: mockExerciseOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "1000",
        hasMinted: true,
      },
      selectedRoundState: {
        address: "0x456",
        payoutPerOption: "1000000000000000000", // 1 ETH
      },
      vaultAddress: "0x789",
    });

    (useERC20 as jest.Mock).mockReturnValue({
      balance: "2000000000000000000", // 2 ETH
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

    const { container, rerender } = render(<Exercise showConfirmation={mockShowConfirmation} />);

    // Check initial render
    const exerciseButton = screen.getByText("Exercise Now");
    expect(exerciseButton).toBeEnabled();

    // Test confirmation modal
    fireEvent.click(exerciseButton);
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Exercise Options",
      expect.anything(),
      expect.any(Function)
    );

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockExerciseOptions).toHaveBeenCalledWith({
      account: "0x123",
    });

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    rerender(<Exercise showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("Exercise Now")).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    rerender(<Exercise showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("Exercise Now")).toBeDisabled();

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
      vaultAddress: "0x789",
    });

    (useERC20 as jest.Mock).mockReturnValue({
      balance: "0",
    });

    rerender(<Exercise showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("Exercise Now")).toBeDisabled();
  });
}); 