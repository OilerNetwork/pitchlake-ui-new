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
    <div className="composed-chart">{children}</div>
  ),
  Area: () => <div className="chart-area" />,
  Line: () => <div className="chart-line" />,
  XAxis: () => <div className="chart-x-axis" />,
  YAxis: () => <div className="chart-y-axis" />,
  CartesianGrid: () => <div className="chart-grid" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div className="chart-container">{children}</div>
  ),
  ReferenceLine: () => <div className="chart-reference-line" />,
  ReferenceArea: () => <div className="chart-reference-area" />,
  Tooltip: () => <div className="chart-tooltip" />,
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
      {
        timestamp: 2000,
        TWAP: 55,
        BASEFEE: 42,
        STRIKE: 48,
        CAP_LEVEL: 60,
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

    // Mock useProtocolContext
    (useProtocolContext as jest.Mock).mockReturnValue({
      setSelectedRound: mockSetSelectedRound,
      selectedRoundState: mockSelectedRoundState,
    });
  });

  it("renders chart with correct components and handles view changes", () => {
    const { container, rerender } = render(<GasPriceChart {...defaultProps} />);

    // Check initial render with all components
    expect(container.querySelector(".chart-container")).toBeInTheDocument();
    expect(container.querySelector(".composed-chart")).toBeInTheDocument();
    expect(container.querySelector(".chart-grid")).toBeInTheDocument();
    expect(container.querySelector(".chart-x-axis")).toBeInTheDocument();
    expect(container.querySelector(".chart-y-axis")).toBeInTheDocument();
    expect(container.querySelector(".chart-tooltip")).toBeInTheDocument();

    // Check for active lines
    const lines = container.querySelectorAll(".chart-line");
    expect(lines.length).toBe(4); // TWAP, BASEFEE, STRIKE, CAP_LEVEL

    // Check reference elements
    expect(container.querySelector(".chart-reference-line")).toBeInTheDocument();
    expect(container.querySelector(".chart-reference-area")).toBeInTheDocument();

    // Test expanded view
    rerender(<GasPriceChart {...defaultProps} isExpandedView={true} />);
    expect(container.querySelector(".chart-container")).toHaveClass("expanded");

    // Test with inactive lines
    rerender(<GasPriceChart {...defaultProps} activeLines={{ TWAP: false, BASEFEE: false, STRIKE: true, CAP_LEVEL: true }} />);
    const updatedLines = container.querySelectorAll(".chart-line");
    expect(updatedLines.length).toBe(2); // Only STRIKE and CAP_LEVEL
  });

  it("renders with no data", () => {
    const { container } = render(
      <GasPriceChart
        {...defaultProps}
        data={[]}
        historicalData={{ rounds: [] }}
      />
    );

    expect(container.querySelector(".loading-message")).toBeInTheDocument();
  });

  it("renders with missing data points", () => {
    const dataWithMissing = [
      {
        timestamp: 1000,
        TWAP: null,
        BASEFEE: 40,
        STRIKE: undefined,
        CAP_LEVEL: 55,
      },
      {
        timestamp: 2000,
        TWAP: 55,
        BASEFEE: null,
        STRIKE: 48,
        CAP_LEVEL: undefined,
      },
    ];

    const { container } = render(<GasPriceChart {...defaultProps} data={dataWithMissing} />);

    expect(container.querySelector(".chart-container")).toBeInTheDocument();
    expect(container.querySelector(".composed-chart")).toBeInTheDocument();
  });

  it("renders with multiple rounds", () => {
    const multiRoundData = {
      ...defaultProps,
      fromRound: 1,
      toRound: 3,
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
          {
            roundId: 3,
            deploymentDate: "3000",
            optionSettleDate: "4000",
            capLevel: "1000",
            strikePrice: "55000000000",
          },
        ],
      },
    };

    const { container } = render(<GasPriceChart {...multiRoundData} />);

    expect(container.querySelector(".chart-container")).toBeInTheDocument();
    expect(container.querySelector(".composed-chart")).toBeInTheDocument();
  });
}); 