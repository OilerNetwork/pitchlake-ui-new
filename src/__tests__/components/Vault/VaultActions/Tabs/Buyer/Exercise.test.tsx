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

    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      address: "0x123",
      account: true,
    });

    // Mock useProtocolContext hook
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        exerciseOptions: mockExerciseOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "1000000000000000000", // 1 ETH worth of options
        hasMinted: false,
      },
      selectedRoundState: {
        address: "0x456",
        payoutPerOption: "2000000000000000000", // 2 ETH payout per option
      },
      vaultAddress: "0x789",
    });

    // Mock useTransactionContext hook
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Mock useERC20 hook
    (useERC20 as jest.Mock).mockReturnValue({
      balance: "500000000000000000", // 0.5 ETH worth of options
    });
  });

  it("renders with initial state", () => {
    const { container } = render(<Exercise showConfirmation={mockShowConfirmation} />);

    // Check if the exercise icon is rendered
    expect(container.querySelector(".exercise-options-icon")).toBeInTheDocument();

    // Check if the exercise button is rendered and enabled
    const exerciseButton = screen.getByText("Exercise Now");
    expect(exerciseButton).toBeInTheDocument();
    expect(exerciseButton).not.toBeDisabled();
  });

  it("disables button when account is not connected", () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    render(<Exercise showConfirmation={mockShowConfirmation} />);

    const exerciseButton = screen.getByText("Exercise Now");
    expect(exerciseButton).toBeDisabled();
  });

  it("disables button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<Exercise showConfirmation={mockShowConfirmation} />);

    const exerciseButton = screen.getByText("Exercise Now");
    expect(exerciseButton).toBeDisabled();
  });

  it("disables button when payout balance is 0", () => {
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

    render(<Exercise showConfirmation={mockShowConfirmation} />);

    const exerciseButton = screen.getByText("Exercise Now");
    expect(exerciseButton).toBeDisabled();
  });

  it("shows confirmation modal when exercise button is clicked", () => {
    render(<Exercise showConfirmation={mockShowConfirmation} />);

    const exerciseButton = screen.getByText("Exercise Now");
    fireEvent.click(exerciseButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Exercise",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls exerciseOptions when confirmation is confirmed", async () => {
    render(<Exercise showConfirmation={mockShowConfirmation} />);

    const exerciseButton = screen.getByText("Exercise Now");
    fireEvent.click(exerciseButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockExerciseOptions).toHaveBeenCalled();
  });
}); 