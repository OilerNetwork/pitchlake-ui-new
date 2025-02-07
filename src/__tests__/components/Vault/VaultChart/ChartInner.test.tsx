import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GasPriceChart from "@/components/Vault/VaultChart/ChartInner";
import { useNewContext } from "@/context/NewProvider";
import { useHelpContext } from "@/context/HelpProvider";
import { useChartContext } from "@/context/ChartProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useChart from "@/hooks/chart/useChartData";
import { useProvider } from "@starknet-react/core";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useProvider: jest.fn(() => ({
    provider: {
      getBlock: jest.fn(() => Promise.resolve({
        block_number: 1000,
        timestamp: 1000,
        gas_price: "100000000000"
      })),
      callContract: jest.fn(() => Promise.resolve({
        result: ["0x1", "0x2", "0x3"]
      }))
    },
    isLoading: false,
    error: null
  }))
}));

jest.mock("@/context/NewProvider", () => ({
  useNewContext: jest.fn(() => ({
    selectedRound: 1,
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
          roundState: "Auctioning"
        }
      ]
    }
  }))
}));

jest.mock("@/context/HelpProvider", () => ({
  useHelpContext: jest.fn(),
}));

jest.mock("@/hooks/chart/useChartData", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    gasData: [
      { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
      { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
      { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
    ],
    parsedData: [
      { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
      { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
      { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
    ],
    historicalData: {
      rounds: [
        {
          roundId: 1,
          capLevel: "1000",
          strikePrice: "100000000000",
          deploymentDate: "1000",
          optionSettleDate: "2000"
        }
      ]
    },
    isLoading: false,
    error: null
  }))
}));

jest.mock("@/hooks/chart/useHistoricalRoundParams", () => ({
  useHistoricalRoundParams: jest.fn(() => ({
    fromRound: 1,
    toRound: 3,
    isLoading: false,
    error: null,
    data: {
      rounds: [
        {
          roundId: 1,
          capLevel: "1000",
          strikePrice: "100000000000",
          deploymentDate: "1000",
          optionSettleDate: "2000"
        }
      ]
    }
  }))
}));

jest.mock("@/context/ChartProvider", () => ({
  useChartContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    roundState: {
      roundId: "1",
      capLevel: "1000",
      strikePrice: "100000000000",
      deploymentDate: "1000",
      optionSettleDate: "2000",
      roundState: "Auctioning"
    },
    isLoading: false,
    error: null
  }))
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock recharts components
jest.mock("recharts", () => ({
  ComposedChart: ({ children, onMouseMove, onMouseLeave }: { children: React.ReactNode, onMouseMove?: () => void, onMouseLeave?: () => void }) => (
    <div data-testid="composed-chart" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>{children}</div>
  ),
  Area: ({ dataKey, className }: { dataKey: string, className?: string }) => (
    <div className={className || `chart-area-${dataKey.toLowerCase()}`} data-testid={`area-${dataKey}`} />
  ),
  Line: ({ dataKey, className }: { dataKey: string, className?: string }) => (
    <div className={className || `chart-line-${dataKey.toLowerCase()}`} data-testid={`line-${dataKey}`} />
  ),
  XAxis: ({ tick }: { tick?: React.ReactNode }) => <div data-testid="x-axis">{tick}</div>,
  YAxis: ({ tick }: { tick?: React.ReactNode }) => <div data-testid="y-axis">{tick}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children, className }: { children: React.ReactNode, className: string }) => (
    <div className={className} data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: ({ segment, stroke }: { segment: any, stroke: string }) => (
    <div data-testid="reference-line" style={{ stroke }} />
  ),
  ReferenceArea: ({ x1, x2, y1, y2, fillOpacity, onClick }: { x1: number, x2: number, y1: number, y2: number, fillOpacity: number, onClick?: () => void }) => (
    <div data-testid="reference-area" style={{ fillOpacity }} onClick={onClick} />
  ),
  Tooltip: ({ content }: { content: React.ReactNode }) => (
    <div data-testid="tooltip">{content}</div>
  ),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe("GasPriceChart", () => {
  const mockSetSelectedRound = jest.fn();
  const mockSetIsExpandedView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useProvider as jest.Mock).mockReturnValue({
      provider: {
        getBlock: jest.fn(() => Promise.resolve({
          block_number: 1000,
          timestamp: 1000,
          gas_price: "100000000000"
        })),
        callContract: jest.fn(() => Promise.resolve({
          result: ["0x1", "0x2", "0x3"]
        }))
      },
      isLoading: false,
      error: null
    });
    (useNewContext as jest.Mock).mockReturnValue({
      selectedRound: 1,
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
            roundState: "Auctioning"
          }
        ]
      }
    });
    (useHelpContext as jest.Mock).mockReturnValue({
      setContent: jest.fn(),
      setHeader: jest.fn(),
      isHoveringHelpBox: false,
    });
    (useChartContext as jest.Mock).mockReturnValue({
      isExpandedView: false,
      setIsExpandedView: mockSetIsExpandedView,
      xMax: 3,
      xMin: 1,
    });
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: {
        roundId: "1",
        capLevel: "1000",
        strikePrice: "100000000000",
        deploymentDate: "1000",
        optionSettleDate: "2000",
        roundState: "Auctioning"
      },
      isLoading: false,
      error: null
    });
    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        address: "0x123",
        currentRoundId: "5"
      },
      isLoading: false,
      error: null
    });
  });

  it("renders chart with correct components and data visualization", () => {
    (useHistoricalRoundParams as jest.Mock).mockReturnValueOnce({
      fromRound: 1,
      toRound: 3,
      isLoading: false,
      error: null,
      data: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          }
        ]
      }
    });
    (useChart as jest.Mock).mockReturnValueOnce({
      gasData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
      ],
      parsedData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
      ],
      historicalData: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          }
        ]
      },
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
          STRIKE: true,
          CAP_LEVEL: true,
        }}
      />
    );

    // Check if the chart components are rendered
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.getByTestId("area-confirmedTwap")).toBeInTheDocument();
    expect(screen.getByTestId("line-unconfirmedTwap")).toBeInTheDocument();
  });

  it("handles missing data by showing loading state", () => {
    (useChart as jest.Mock).mockReturnValueOnce({ 
      gasData: [],
      parsedData: [],
      historicalData: null,
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
          STRIKE: true,
          CAP_LEVEL: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders only active data lines", () => {
    (useHistoricalRoundParams as jest.Mock).mockReturnValueOnce({
      fromRound: 1,
      toRound: 3,
      isLoading: false,
      error: null,
      data: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          }
        ]
      }
    });
    (useChart as jest.Mock).mockReturnValueOnce({
      gasData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
      ],
      parsedData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
      ],
      historicalData: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          }
        ]
      },
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: false,
          STRIKE: false,
          CAP_LEVEL: false,
        }}
      />
    );

    expect(screen.getByTestId("area-confirmedTwap")).toBeInTheDocument();
    expect(screen.getByTestId("line-unconfirmedTwap")).toBeInTheDocument();
    expect(screen.queryByTestId("area-BASEFEE")).not.toBeInTheDocument();
  });

  it("handles expanded view with multiple rounds", () => {
    (useHistoricalRoundParams as jest.Mock).mockReturnValueOnce({
      fromRound: 1,
      toRound: 3,
      isLoading: false,
      error: null,
      data: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          },
          {
            roundId: 2,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "2000",
            optionSettleDate: "3000"
          },
          {
            roundId: 3,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "3000",
            optionSettleDate: "4000"
          }
        ]
      }
    });
    (useChartContext as jest.Mock).mockReturnValue({
      isExpandedView: true,
      setIsExpandedView: mockSetIsExpandedView,
      xMax: 6,
      xMin: 1,
    });
    (useChart as jest.Mock).mockReturnValueOnce({
      gasData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
        { timestamp: 4, confirmedTwap: 400, unconfirmedTwap: 360, BASEFEE: 360 },
        { timestamp: 5, confirmedTwap: 500, unconfirmedTwap: 450, BASEFEE: 450 },
        { timestamp: 6, confirmedTwap: 600, unconfirmedTwap: 540, BASEFEE: 540 },
      ],
      parsedData: [
        { timestamp: 1, confirmedTwap: 100, unconfirmedTwap: 90, BASEFEE: 90 },
        { timestamp: 2, confirmedTwap: 200, unconfirmedTwap: 180, BASEFEE: 180 },
        { timestamp: 3, confirmedTwap: 300, unconfirmedTwap: 270, BASEFEE: 270 },
        { timestamp: 4, confirmedTwap: 400, unconfirmedTwap: 360, BASEFEE: 360 },
        { timestamp: 5, confirmedTwap: 500, unconfirmedTwap: 450, BASEFEE: 450 },
        { timestamp: 6, confirmedTwap: 600, unconfirmedTwap: 540, BASEFEE: 540 },
      ],
      historicalData: {
        rounds: [
          {
            roundId: 1,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "1000",
            optionSettleDate: "2000"
          },
          {
            roundId: 2,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "2000",
            optionSettleDate: "3000"
          },
          {
            roundId: 3,
            capLevel: "1000",
            strikePrice: "100000000000",
            deploymentDate: "3000",
            optionSettleDate: "4000"
          }
        ]
      },
      isLoading: false,
      error: null
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
          STRIKE: true,
          CAP_LEVEL: true,
        }}
      />
    );

    // Check if the chart components are rendered in expanded view
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.getByTestId("area-confirmedTwap")).toBeInTheDocument();
    expect(screen.getByTestId("line-unconfirmedTwap")).toBeInTheDocument();
    expect(screen.getByTestId("reference-area")).toBeInTheDocument();
  });

  it("handles loading state when data is being fetched", () => {
    (useChart as jest.Mock).mockReturnValueOnce({ 
      gasData: null,
      parsedData: null,
      historicalData: null,
      isLoading: true,
      error: null
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
          STRIKE: true,
          CAP_LEVEL: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("handles error state when data fetch fails", () => {
    (useChart as jest.Mock).mockReturnValueOnce({ 
      gasData: null,
      parsedData: null,
      historicalData: null,
      isLoading: false,
      error: new Error("Failed to fetch data")
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
          STRIKE: true,
          CAP_LEVEL: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-loading")).toBeInTheDocument();
  });
}); 