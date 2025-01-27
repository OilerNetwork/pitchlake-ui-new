import React from "react";
import { render } from "@testing-library/react";
import GasPriceChart from "@/components/Vault/VaultChart/ChartInner";
import { useProtocolContext } from "@/context/ProtocolProvider";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
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
}));

describe("GasPriceChart", () => {
  const mockSetSelectedRound = jest.fn();
  const mockSetIsExpandedView = jest.fn();
  const mockSelectedRoundState = {
    deploymentDate: "1000",
    optionSettleDate: "2000",
  };

  const defaultProps = {
    data: [
      {
        timestamp: 1000,
        TWAP: 50,
        BASEFEE: 40,
        STRIKE: 45,
        CAP_LEVEL: 55,
      },
      {
        timestamp: 1500,
        TWAP: 60,
        BASEFEE: 45,
        STRIKE: 50,
        CAP_LEVEL: 65,
      },
    ],
    activeLines: {
      TWAP: true,
      BASEFEE: true,
      STRIKE: true,
      CAP_LEVEL: true,
    },
    historicalData: {
      rounds: [
        {
          roundId: 1,
          deploymentDate: "1000",
          optionSettleDate: "2000",
          capLevel: "1000", // 10%
          strikePrice: "45000000000", // 45 gwei
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
      selectedRoundState: mockSelectedRoundState,
    });
  });

  it("renders chart with correct components and data visualization", () => {
    const { container } = render(<GasPriceChart {...defaultProps} />);

    // Verify chart container and structure
    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();

    // Verify data visualization components
    expect(container.querySelector(".chart-area-twap")).toBeInTheDocument();
    expect(container.querySelector(".chart-area-basefee")).toBeInTheDocument();
    expect(container.querySelector(".chart-line-strike")).toBeInTheDocument();
    expect(container.querySelector(".chart-area-cap_level")).toBeInTheDocument();
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
    expect(container.textContent).toContain("Loading...");
  });

  it("renders only active data lines", () => {
    const { container } = render(
      <GasPriceChart
        {...defaultProps}
        activeLines={{
          TWAP: false,
          BASEFEE: true,
          STRIKE: false,
          CAP_LEVEL: true,
        }}
      />
    );

    // Check that only active lines are rendered
    expect(container.querySelector(".chart-area-twap")).not.toBeInTheDocument();
    expect(container.querySelector(".chart-area-basefee")).toBeInTheDocument();
    expect(container.querySelector(".chart-line-strike")).not.toBeInTheDocument();
    expect(container.querySelector(".chart-area-cap_level")).toBeInTheDocument();
  });

  it("handles expanded view with multiple rounds", () => {
    const multiRoundProps = {
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
            capLevel: "1000",
            strikePrice: "45000000000",
          },
          {
            roundId: 2,
            deploymentDate: "2000",
            optionSettleDate: "3000",
            capLevel: "1000",
            strikePrice: "50000000000",
          },
        ],
      },
    };

    const { container } = render(<GasPriceChart {...multiRoundProps} />);

    // Verify expanded view components are rendered
    expect(container.querySelector(".gas-price-chart-container")).toBeInTheDocument();
  });
}); 