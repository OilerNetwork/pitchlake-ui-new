import React from "react";
import { render, screen } from "@testing-library/react";
import GasPriceChart from "@/components/Vault/VaultChart/ChartInner";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useHelpContext } from "@/context/HelpProvider";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/context/HelpProvider", () => ({
  useHelpContext: jest.fn(),
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

describe("GasPriceChart", () => {
  const mockSetSelectedRound = jest.fn();
  const mockSetIsExpandedView = jest.fn();

  const defaultProps = {
    data: [
      { timestamp: 1, TWAP: 100, BASEFEE: 90 },
      { timestamp: 2, TWAP: 200, BASEFEE: 180 },
      { timestamp: 3, TWAP: 300, BASEFEE: 270 },
    ],
    activeLines: {
      TWAP: true,
      BASEFEE: true,
    },
    historicalData: {
      rounds: [
        {
          roundId: 1,
          deploymentDate: "1000",
          optionSettleDate: "2000",
        },
      ],
    },
    fromRound: 1,
    toRound: 1,
    isExpandedView: false,
    selectedRound: 1,
    setIsExpandedView: mockSetIsExpandedView,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useProtocolContext as jest.Mock).mockReturnValue({
      setSelectedRound: mockSetSelectedRound,
      selectedRoundState: {
        deploymentDate: "1000",
        optionSettleDate: "2000",
      },
    });
    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    });
  });

  it("renders chart with correct components and data visualization", () => {
    const { container } = render(<GasPriceChart {...defaultProps} />);

    // Verify chart components are rendered
    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();
  });

  it("handles missing data by showing loading state", () => {
    const { container } = render(
      <GasPriceChart 
        {...defaultProps}
        data={[]}
        historicalData={{ rounds: [] }}
      />
    );

    expect(container.querySelector(".gas-price-chart-loading")).toBeInTheDocument();
  });

  it("renders only active data lines", () => {
    const { container } = render(
      <GasPriceChart 
        {...defaultProps}
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
    const expandedProps = {
      ...defaultProps,
      isExpandedView: true,
      fromRound: 1,
      toRound: 2,
      historicalData: {
        rounds: [
          {
            roundId: 1,
            deploymentDate: "1000",
            optionSettleDate: "2000",
          },
          {
            roundId: 2,
            deploymentDate: "2000",
            optionSettleDate: "3000",
          },
        ],
      },
      data: [
        { timestamp: 1, TWAP: 100, BASEFEE: 90 },
        { timestamp: 2, TWAP: 200, BASEFEE: 180 },
        { timestamp: 3, TWAP: 300, BASEFEE: 270 },
        { timestamp: 4, TWAP: 400, BASEFEE: 360 },
        { timestamp: 5, TWAP: 500, BASEFEE: 450 },
        { timestamp: 6, TWAP: 600, BASEFEE: 540 },
      ],
    };

    const { container } = render(<GasPriceChart {...expandedProps} />);

    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();
  });
}); 