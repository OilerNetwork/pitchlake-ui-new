import React from "react";
import { render, screen } from "@testing-library/react";
import GasPriceChart from "@/components/Vault/VaultChart/ChartInner";
import { useProtocolContext } from "@/context/ProtocolProvider";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

// Mock recharts components
jest.mock("recharts", () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="composed-chart">{children}</div>
  ),
  Area: () => <div data-testid="area" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: () => <div data-testid="reference-line" />,
  ReferenceArea: () => <div data-testid="reference-area" />,
  Tooltip: () => <div data-testid="tooltip" />,
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

  it("renders chart components", () => {
    render(<GasPriceChart {...defaultProps} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
  });

  it("renders with no data", () => {
    render(
      <GasPriceChart
        {...defaultProps}
        data={[]}
        historicalData={[]}
      />
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
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

    render(<GasPriceChart {...defaultProps} data={dataWithMissing} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("renders in expanded view", () => {
    render(<GasPriceChart {...defaultProps} isExpandedView={true} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });

  it("renders with inactive lines", () => {
    render(
      <GasPriceChart
        {...defaultProps}
        activeLines={{
          TWAP: false,
          BASEFEE: false,
          STRIKE: false,
          CAP_LEVEL: false,
        }}
      />
    );

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
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

    render(<GasPriceChart {...multiRoundData} />);

    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(screen.getByTestId("composed-chart")).toBeInTheDocument();
  });
}); 