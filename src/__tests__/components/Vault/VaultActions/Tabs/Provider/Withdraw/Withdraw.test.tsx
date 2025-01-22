import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Withdraw from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/Withdraw";
import { useProtocolContext } from "@/context/ProtocolProvider";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

// Mock the sub-components
jest.mock("@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawLiquidity", () => ({
  __esModule: true,
  default: () => <div data-testid="withdraw-liquidity">WithdrawLiquidity</div>,
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Provider/Withdraw/QueueWithdrawal", () => ({
  __esModule: true,
  default: () => <div data-testid="queue-withdrawal">QueueWithdrawal</div>,
}));

jest.mock("@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawStash", () => ({
  __esModule: true,
  default: () => <div data-testid="withdraw-stash">WithdrawStash</div>,
}));

describe("Withdraw Component", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correct tabs based on round state", () => {
    // Test Auctioning state
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Auctioning" },
    });

    const { rerender } = render(<Withdraw showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();

    // Test Settled state
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Settled" },
    });
    rerender(<Withdraw showConfirmation={mockShowConfirmation} />);
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();
    expect(screen.queryByText("Queue")).not.toBeInTheDocument();
  });

  it("shows correct component when switching tabs", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Auctioning" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Default tab (Liquidity)
    expect(screen.getByTestId("withdraw-liquidity")).toBeInTheDocument();

    // Switch to Queue tab
    fireEvent.click(screen.getByText("Queue"));
    expect(screen.getByTestId("queue-withdrawal")).toBeInTheDocument();

    // Switch to Collect tab
    fireEvent.click(screen.getByText("Collect"));
    expect(screen.getByTestId("withdraw-stash")).toBeInTheDocument();
  });

  it("maintains correct tab visibility based on round state", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Settled" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Queue tab and its content should not be visible
    expect(screen.queryByText("Queue")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-withdrawal")).not.toBeInTheDocument();

    // Other tabs should be visible
    expect(screen.getByTestId("withdraw-liquidity")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Collect"));
    expect(screen.getByTestId("withdraw-stash")).toBeInTheDocument();
  });
}); 