import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Mint from "@/components/Vault/VaultActions/Tabs/Buyer/Mint";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { TestWrapper } from "../../../../../utils/TestWrapper";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn().mockReturnValue({
    pendingTx: false,
  }),
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn().mockReturnValue({
    account: "0x123",
    address: "0x123"
  }),
}));

// Mock the Icons component
jest.mock("@/components/Icons", () => ({
  HammerIcon: () => <div data-testid="mint-icon" />,
}));

describe("Mint Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockTokenizeOptions = jest.fn().mockImplementation(() => Promise.resolve());

  beforeEach(() => {
    jest.clearAllMocks();
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundBuyerState: {
        mintableOptions: "1000",
      },
      roundActions: {
        tokenizeOptions: mockTokenizeOptions,
      },
    });
  });

  it("renders mint component and handles minting flow", async () => {
    render(
      <TestWrapper>
        <Mint showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Check initial render
    expect(screen.getByTestId("mint-icon")).toBeInTheDocument();
    expect(screen.getByText("1,000")).toBeInTheDocument();
    
    // Initiate mint
    fireEvent.click(screen.getByRole("button", { name: "Mint Now" }));
    
    // Verify confirmation modal was shown
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Mint",
      expect.anything(),
      expect.any(Function)
    );

    // Complete mint flow
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await act(async () => {
      await onConfirm();
    });
    
    expect(mockTokenizeOptions).toHaveBeenCalled();
  });
}); 