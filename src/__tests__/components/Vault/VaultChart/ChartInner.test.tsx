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

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useProvider: jest.fn(() => ({
    provider: {
      getBlock: jest.fn(),
      callContract: jest.fn()
    }
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
      { timestamp: 1, TWAP: 100, BASEFEE: 90 },
      { timestamp: 2, TWAP: 200, BASEFEE: 180 },
      { timestamp: 3, TWAP: 300, BASEFEE: 270 },
    ]
  }))
}));

jest.mock("@/context/ChartProvider", () => ({
  useChartContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock recharts components
jest.mock("recharts", () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Area: ({ dataKey }: { dataKey: string }) => <div className={`chart-area-${dataKey.toLowerCase()}`} />,
  Line: ({ dataKey }: { dataKey: string }) => <div className={`chart-line-${dataKey.toLowerCase()}`} />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  ResponsiveContainer: ({ children, className }: { children: React.ReactNode, className: string }) => (
    <div className={className}>{children}</div>
  ),
  ReferenceLine: () => <div />,
  ReferenceArea: () => <div />,
  Tooltip: () => <div />,
  Defs: ({ children }: { children: React.ReactNode }) => (
    <svg>
      <defs>{children}</defs>
    </svg>
  ),
  LinearGradient: ({ id, children }: { id: string; children: React.ReactNode }) => (
    <defs>
      <linearGradient id={id}>{children}</linearGradient>
    </defs>
  ),
  Stop: ({ offset, stopColor }: { offset: string; stopColor: string }) => (
    <stop offset={offset} stopColor={stopColor} />
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
      deploymentDate: "1000",
      optionSettleDate: "2000",
    });
    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        address: "0x123",
      },
    });
  });

  it("renders chart with correct components and data visualization", () => {
    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();
  });

  it("handles missing data by showing loading state", () => {
    (useChart as jest.Mock).mockReturnValue({ gasData: [] });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-loading")).toBeInTheDocument();
  });

  it("renders only active data lines", () => {
    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: false,
        }}
      />
    );

    expect(container.querySelector(".chart-area-twap")).toBeInTheDocument();
    expect(container.querySelector(".chart-area-basefee")).not.toBeInTheDocument();
  });

  it("handles expanded view with multiple rounds", () => {
    (useChartContext as jest.Mock).mockReturnValue({
      isExpandedView: true,
      setIsExpandedView: mockSetIsExpandedView,
      xMax: 6,
      xMin: 1,
    });
    (useChart as jest.Mock).mockReturnValue({
      gasData: [
        { timestamp: 1, TWAP: 100, BASEFEE: 90 },
        { timestamp: 2, TWAP: 200, BASEFEE: 180 },
        { timestamp: 3, TWAP: 300, BASEFEE: 270 },
        { timestamp: 4, TWAP: 400, BASEFEE: 360 },
        { timestamp: 5, TWAP: 500, BASEFEE: 450 },
        { timestamp: 6, TWAP: 600, BASEFEE: 540 },
      ],
    });

    const { container } = renderWithProviders(
      <GasPriceChart 
        activeLines={{
          TWAP: true,
          BASEFEE: true,
        }}
      />
    );

    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();
  });
}); 