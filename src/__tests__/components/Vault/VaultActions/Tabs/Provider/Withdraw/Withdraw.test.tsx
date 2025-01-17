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

describe("Withdraw", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with initial state (Liquidity tab)", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Auctioning" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Check if tabs are rendered
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();

    // Check if WithdrawLiquidity is rendered by default
    expect(screen.getByTestId("withdraw-liquidity")).toBeInTheDocument();
  });

  it("shows only Liquidity and Collect tabs when not in Auctioning or Running state", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Settled" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Check if correct tabs are rendered
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();
    expect(screen.queryByText("Queue")).not.toBeInTheDocument();
  });

  it("switches to Queue tab and renders QueueWithdrawal component", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Auctioning" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Click Queue tab
    fireEvent.click(screen.getByText("Queue"));

    // Check if QueueWithdrawal is rendered
    expect(screen.getByTestId("queue-withdrawal")).toBeInTheDocument();
  });

  it("switches to Collect tab and renders WithdrawStash component", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Auctioning" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Click Collect tab
    fireEvent.click(screen.getByText("Collect"));

    // Check if WithdrawStash is rendered
    expect(screen.getByTestId("withdraw-stash")).toBeInTheDocument();
  });

  it("does not show Queue tab content when not in Auctioning or Running state", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: { roundState: "Settled" },
    });

    render(<Withdraw showConfirmation={mockShowConfirmation} />);

    // Try to find Queue tab content (should not exist)
    expect(screen.queryByTestId("queue-withdrawal")).not.toBeInTheDocument();
  });
}); 