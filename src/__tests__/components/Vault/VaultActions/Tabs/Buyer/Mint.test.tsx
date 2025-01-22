import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Mint from "@/components/Vault/VaultActions/Tabs/Buyer/Mint";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  __esModule: true,
  useProtocolContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useAccount: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
}));

// Mock the Icons component
jest.mock("@/components/Icons", () => ({
  HammerIcon: () => <div className="mint-icon" />,
}));

describe("Mint Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockTokenizeOptions = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set default mock values
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "1000",
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
  });

  it("renders mint component with correct states and handles interactions", () => {
    const { container, rerender } = render(<Mint showConfirmation={mockShowConfirmation} />);

    // Check initial render
    expect(container.querySelector(".mint-icon")).toBeInTheDocument();
    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeEnabled();

    // Test confirmation modal
    fireEvent.click(mintButton);
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Mint",
      expect.anything(),
      expect.any(Function)
    );

    // Test tokenization
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();
    expect(mockTokenizeOptions).toHaveBeenCalled();

    // Test with pending transaction
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    rerender(<Mint showConfirmation={mockShowConfirmation} />);
    expect(screen.getByRole("button", { name: "Mint Now" })).toBeDisabled();

    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    rerender(<Mint showConfirmation={mockShowConfirmation} />);
    expect(screen.getByRole("button", { name: "Mint Now" })).toBeDisabled();

    // Test with zero mintable options
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "0",
      },
    });

    rerender(<Mint showConfirmation={mockShowConfirmation} />);
    expect(screen.getByRole("button", { name: "Mint Now" })).toBeDisabled();

    // Test with undefined mintable options
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: undefined,
      },
    });

    rerender(<Mint showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mint Now" })).toBeDisabled();
  });
}); 