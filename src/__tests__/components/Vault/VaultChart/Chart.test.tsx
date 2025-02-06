import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RoundPerformanceChart from "@/components/Vault/VaultChart/Chart";
import { useNewContext } from "@/context/NewProvider";
import { useFossilGasData } from "@/hooks/chart/useFossilGasData";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { ChartProvider } from "@/context/ChartProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  ...jest.requireActual("@/__tests__/mocks/starknet-react"),
}));

jest.mock("@/context/NewProvider", () => ({
  useNewContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/chart/useFossilGasData", () => ({
  useFossilGasData: jest.fn(),
}));

jest.mock("@/hooks/chart/useHistoricalRoundParams", () => ({
  useHistoricalRoundParams: jest.fn(),
}));

// Mock the Icons
jest.mock("@/components/Icons", () => ({
  ArrowDownIcon: ({ stroke, classname }: { stroke: string; classname: string }) => (
    <div className={classname} style={{ stroke }} />
  ),
  ArrowUpIcon: ({ stroke, classname }: { stroke: string; classname: string }) => (
    <div className={classname} style={{ stroke }} />
  ),
  ArrowLeftIcon: ({ stroke, classname }: { stroke: string; classname: string }) => (
    <div className={classname} style={{ stroke }} />
  ),
  ArrowRightIcon: ({ stroke, classname }: { stroke: string; classname: string }) => (
    <div className={classname} style={{ stroke }} />
  ),
  CheckIcon: ({ stroke, fill }: { stroke: string; fill: string }) => (
    <div className="check-icon" style={{ stroke, fill }} />
  ),
}));

// Mock the ChartInner component
jest.mock("@/components/Vault/VaultChart/ChartInner", () => ({
  __esModule: true,
  default: () => <div className="gas-price-chart" />,
}));

// Mock the Hoverable component
jest.mock("@/components/BaseComponents/Hoverable", () => {
  return function MockHoverable({ children, onClick, className }: any) {
    return (
      <div className={className} onClick={onClick}>
        {children}
      </div>
    );
  };
});

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ChartProvider>
        <div data-testid="help-provider">
          <div data-testid="transaction-provider">
            {ui}
          </div>
        </div>
      </ChartProvider>
    </QueryClientProvider>
  );
};

describe("RoundPerformanceChart", () => {
  const mockSetSelectedRound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it("renders chart with navigation and handles interactions", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 3,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "5",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "5",
          address: "0x123"
        },
        optionRoundStates: {
          "1": {
            address: "0x123",
            roundId: "1",
            startTimestamp: "1000",
            duration: "1000",
            roundState: "Settled"
          },
          "2": {
            address: "0x123",
            roundId: "2",
            startTimestamp: "2000",
            duration: "1000",
            roundState: "Settled"
          },
          "3": {
            address: "0x123",
            roundId: "3",
            startTimestamp: "3000",
            duration: "1000",
            roundState: "Auctioning"
          },
          "4": {
            address: "0x123",
            roundId: "4",
            startTimestamp: "4000",
            duration: "1000",
            roundState: "Auctioning"
          },
          "5": {
            address: "0x123",
            roundId: "5",
            startTimestamp: "5000",
            duration: "1000",
            roundState: "Auctioning"
          }
        }
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "3",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning",
      isLoading: false
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
      error: null
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(
      <RoundPerformanceChart />
    );

    // Check initial render
    expect(container.querySelector(".w-full.h-\\[800px\\].bg-black-alt")).toBeInTheDocument();
    
    // Check round selector
    const roundSelector = screen.getByText(/Round/);
    expect(roundSelector).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles expanded view toggle", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 4,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "4",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "4",
          address: "0x123"
        },
        optionRoundStates: [
          {
            address: "0x123",
            roundId: "1",
            startTimestamp: "1000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "2",
            startTimestamp: "2000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "3",
            startTimestamp: "3000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "4",
            startTimestamp: "4000",
            duration: "1000",
            roundState: "Auctioning"
          }
        ]
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "4",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    renderWithProviders(
      <RoundPerformanceChart />
    );

    // Initial state - not expanded
    expect(useHistoricalRoundParams).toHaveBeenCalledWith(
      expect.objectContaining({
        fromRound: 4,
        toRound: 4,
        vaultAddress: "0x123"
      })
    );

    // Toggle expanded view
    const historyButton = document.querySelector('.chart-history-button');
    expect(historyButton).not.toBeNull();
    if (historyButton) {
      fireEvent.click(historyButton);
    }

    // Verify that useHistoricalRoundParams was called with correct fromRound
    expect(useHistoricalRoundParams).toHaveBeenCalledWith(
      expect.objectContaining({
        fromRound: 1,
        toRound: 4,
      })
    );
  });

  it("disables right navigation at current round", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 5,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "5",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "5",
          address: "0x123"
        },
        optionRoundStates: [
          {
            address: "0x123",
            roundId: "1",
            startTimestamp: "1000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "2",
            startTimestamp: "2000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "3",
            startTimestamp: "3000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "4",
            startTimestamp: "4000",
            duration: "1000",
            roundState: "Settled"
          },
          {
            address: "0x123",
            roundId: "5",
            startTimestamp: "5000",
            duration: "1000",
            roundState: "Auctioning"
          }
        ]
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "5",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <RoundPerformanceChart />
    );

    // Verify right navigation is disabled at current round
    const rightArrow = container.querySelector(".hover\\:cursor-default");
    expect(rightArrow).toBeInTheDocument();
  });

  it("disables left navigation at round 1", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 1,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "4",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "4",
          address: "0x123"
        },
        optionRoundStates: [{
          address: "0x123",
          roundId: "1",
          startTimestamp: "1000",
          duration: "1000",
          roundState: "Auctioning"
        }]
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "1",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <RoundPerformanceChart />
    );

    // Verify left navigation is disabled at round 1
    const leftArrow = container.querySelector(".hover\\:cursor-default");
    expect(leftArrow).toBeInTheDocument();
  });

  it("handles loading and error states", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 3,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "4",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "4",
          address: "0x123"
        },
        optionRoundStates: [{
          address: "0x123",
          roundId: "3",
          startTimestamp: "1000",
          duration: "1000",
          roundState: "Auctioning"
        }]
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "3",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: true,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: true,
    });

    renderWithProviders(
      <RoundPerformanceChart />
    );

    // Verify loading states are handled
    expect(screen.getByText(/Round/)).toBeInTheDocument();
  });

  it("handles navigation between rounds", () => {
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 2,
      setSelectedRound: mockSetSelectedRound,
      vaultAddress: "0x123",
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "4",
          address: "0x123"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "4",
          address: "0x123"
        },
        optionRoundStates: [{
          address: "0x123",
          roundId: "2",
          startTimestamp: "1000",
          duration: "1000",
          roundState: "Auctioning"
        }]
      }
    });

    (useRoundState as jest.Mock).mockReturnValue({
      roundId: "2",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    });

    (useFossilGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = renderWithProviders(
      <RoundPerformanceChart />
    );

    // Find and click the right arrow
    const rightArrow = container.querySelector('.chart-next-round');
    expect(rightArrow).toBeInTheDocument();
    fireEvent.click(rightArrow!);
    expect(mockSetSelectedRound).toHaveBeenCalledWith(3);

    // Find and click the left arrow
    const leftArrow = container.querySelector('.chart-previous-round');
    expect(leftArrow).toBeInTheDocument();
    fireEvent.click(leftArrow!);
    expect(mockSetSelectedRound).toHaveBeenCalledWith(1);
  });
});