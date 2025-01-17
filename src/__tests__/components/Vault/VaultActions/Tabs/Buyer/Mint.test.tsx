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

    // Mock useAccount hook
    (useAccount as jest.Mock).mockReturnValue({
      address: "0x123",
      account: true,
    });

    // Mock useProtocolContext hook
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "1000000", // 1 million mintable options
      },
    });

    // Mock useTransactionContext hook
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });
  });

  it("renders with initial state", () => {
    const { container } = render(<Mint showConfirmation={mockShowConfirmation} />);

    // Check if the mint icon is rendered
    expect(container.querySelector('.mint-icon')).toBeInTheDocument();

    // Check if the mint button is rendered and enabled
    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeInTheDocument();
    expect(mintButton).not.toBeDisabled();

    // Check if the mintable options balance is displayed correctly
    expect(screen.getByText("1.0m")).toBeInTheDocument();
  });

  it("disables button when account is not connected", () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    render(<Mint showConfirmation={mockShowConfirmation} />);

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeDisabled();
  });

  it("disables button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<Mint showConfirmation={mockShowConfirmation} />);

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeDisabled();
  });

  it("disables button when mintable options balance is 0", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: "0",
      },
    });

    render(<Mint showConfirmation={mockShowConfirmation} />);

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeDisabled();
  });

  it("shows confirmation modal when mint button is clicked", () => {
    render(<Mint showConfirmation={mockShowConfirmation} />);

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    fireEvent.click(mintButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Mint",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls tokenizeOptions when confirmation is confirmed", async () => {
    render(<Mint showConfirmation={mockShowConfirmation} />);

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    fireEvent.click(mintButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockTokenizeOptions).toHaveBeenCalled();
  });

  it("handles undefined mintableOptions gracefully", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
      selectedRoundBuyerState: {
        mintableOptions: undefined,
      },
    });

    render(<Mint showConfirmation={mockShowConfirmation} />);

    // Check if the mintable options balance shows 0 when undefined
    expect(screen.getByText("0")).toBeInTheDocument();

    const mintButton = screen.getByRole("button", { name: "Mint Now" });
    expect(mintButton).toBeDisabled();
  });
}); 