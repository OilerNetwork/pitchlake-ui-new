import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Withdraw from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/Withdraw";
import { HelpProvider } from "@/context/HelpProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useContractRead } from "@starknet-react/core";

// Mock starknet-react
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useContractRead: jest.fn(),
  useAccount: () => ({ account: { address: "0x123" } }),
  useContract: () => ({ contract: null }),
  useProvider: () => ({ provider: null }),
}));

// Mock the hooks
jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn(),
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelpProvider>
      {children}
    </HelpProvider>
  );
};

describe("Withdraw Component", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useContractRead as jest.Mock).mockReturnValue({
      data: "1000",
      isLoading: false,
      error: null,
    });
  });

  it("renders correct tabs based on round state", () => {
    // Test Auctioning state
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Auctioning",
    });

    const { rerender } = render(
      <TestWrapper>
        <Withdraw showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();

    // Test Settled state
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Settled",
    });
    rerender(
      <TestWrapper>
        <Withdraw showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
    expect(screen.getByText("Collect")).toBeInTheDocument();
    expect(screen.queryByText("Queue")).not.toBeInTheDocument();
  });

  it("shows correct component when switching tabs", () => {
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Auctioning",
    });

    render(
      <TestWrapper>
        <Withdraw showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

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
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Settled",
    });

    render(
      <TestWrapper>
        <Withdraw showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Queue tab and its content should not be visible
    expect(screen.queryByText("Queue")).not.toBeInTheDocument();
    expect(screen.queryByTestId("queue-withdrawal")).not.toBeInTheDocument();

    // Other tabs should be visible
    expect(screen.getByTestId("withdraw-liquidity")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Collect"));
    expect(screen.getByTestId("withdraw-stash")).toBeInTheDocument();
  });
}); 