import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Refund from "@/components/Vault/VaultActions/Tabs/Buyer/Refund";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";

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

jest.mock("@/context/HelpProvider", () => ({
  useHelpContext: jest.fn(),
}));

// Mock the Icons component
jest.mock("@/components/Icons", () => ({
  RepeatEthIcon: () => <div className="refund-icon" />,
}));

describe("Refund Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockRefundUnusedBids = jest.fn();

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
        refundUnusedBids: mockRefundUnusedBids,
      },
      selectedRoundBuyerState: {
        refundableOptions: "1000000000000000000", // 1 ETH worth of refundable options
        hasMinted: false,
      },
    });

    // Mock useTransactionContext hook
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    // Mock useHelpContext hook
    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    });

    // Mock environment variable
    process.env.NEXT_PUBLIC_ENVIRONMENT = "ws";
  });

  it("renders with initial state", () => {
    const { container } = render(<Refund showConfirmation={mockShowConfirmation} />);

    // Check if the refund icon is rendered
    expect(container.querySelector('.refund-icon')).toBeInTheDocument();

    // Check if the refund button is rendered and enabled
    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    expect(refundButton).toBeInTheDocument();
    expect(refundButton).not.toBeDisabled();

    // Check if the refund balance is displayed correctly
    expect(screen.getByText("1.0 ETH")).toBeInTheDocument();
  });

  it("disables button when account is not connected", () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: null,
      account: null,
    });

    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    expect(refundButton).toBeDisabled();
  });

  it("disables button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    expect(refundButton).toBeDisabled();
  });

  it("disables button when refundable balance is 0", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        refundUnusedBids: mockRefundUnusedBids,
      },
      selectedRoundBuyerState: {
        refundableOptions: "0",
        hasMinted: false,
      },
    });

    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    expect(refundButton).toBeDisabled();
  });

  it("disables button when options have been minted", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      roundActions: {
        refundUnusedBids: mockRefundUnusedBids,
      },
      selectedRoundBuyerState: {
        refundableOptions: "1000000000000000000",
        hasMinted: true,
      },
    });

    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    expect(refundButton).toBeDisabled();
  });

  it("shows confirmation modal when refund button is clicked", () => {
    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    fireEvent.click(refundButton);

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Refund",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls refundUnusedBids when confirmation is confirmed", async () => {
    render(<Refund showConfirmation={mockShowConfirmation} />);

    const refundButton = screen.getByRole("button", { name: "Refund Now" });
    fireEvent.click(refundButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockRefundUnusedBids).toHaveBeenCalledWith({
      optionBuyer: "0x123"
    });
  });
}); 