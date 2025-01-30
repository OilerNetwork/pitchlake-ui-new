import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RoundPerformanceChart from "@/components/Vault/VaultChart/Chart";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { TestWrapper } from "../../../utils/TestWrapper";
import { useGasData } from "@/hooks/chart/useGasData";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";

// Mock the hooks
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/hooks/chart/useGasData", () => ({
  useGasData: jest.fn(),
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

describe("RoundPerformanceChart", () => {
  const mockSetSelectedRound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders chart with navigation and handles interactions", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 3,
      selectedRoundState: {
        roundId: "3",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Auctioning"
      },
      setSelectedRound: mockSetSelectedRound,
      vaultState: {
        currentRoundId: "5",
        address: "0x123"
      }
    });

    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
    );

    // Check initial render
    expect(container.querySelector(".w-full.h-\\[800px\\].bg-black-alt")).toBeInTheDocument();
    
    // Check round selector
    const roundSelector = screen.getByText(/Round/);
    expect(roundSelector).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("handles expanded view toggle", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 4,
      selectedRoundState: {
        roundId: "4",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Auctioning"
      },
      setSelectedRound: mockSetSelectedRound,
      vaultState: {
        currentRoundId: "4",
        address: "0x123"
      }
    });

    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
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
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 5,
      selectedRoundState: {
        roundId: "5",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Auctioning"
      },
      setSelectedRound: mockSetSelectedRound,
      vaultState: {
        currentRoundId: "5",
        address: "0x123"
      }
    });

    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
    );

    // Verify right navigation is disabled at current round
    const rightArrow = container.querySelector(".hover\\:cursor-default");
    expect(rightArrow).toBeInTheDocument();
  });

  it("disables left navigation at round 1", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 1,
      selectedRoundState: {
        roundId: "1",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Auctioning"
      },
      setSelectedRound: mockSetSelectedRound,
      vaultState: {
        currentRoundId: "4",
        address: "0x123"
      }
    });

    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: false,
    });

    const { container } = render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
    );

    // Find the left arrow container
    const leftArrowContainer = container.querySelector('.chart-previous-round');
    expect(leftArrowContainer).toBeInTheDocument();

    // Find the ArrowLeftIcon div inside the container
    const leftArrow = leftArrowContainer?.querySelector('div[style*="stroke: var(--greyscale)"]');
    expect(leftArrow).toBeInTheDocument();

    // Verify clicking doesn't trigger setSelectedRound
    fireEvent.click(leftArrowContainer!);
    expect(mockSetSelectedRound).not.toHaveBeenCalled();
  });

  it("handles loading and error states", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 3,
      selectedRoundState: {
        roundId: "3",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Auctioning",
        deploymentDate: "1000",
        optionSettleDate: "2000",
        auctionEndDate: "1500"
      },
      setSelectedRound: mockSetSelectedRound,
      vaultState: {
        currentRoundId: "5",
        address: "0x123"
      }
    });

    // Test loading state
    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      error: null
    });

    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: [],
      isLoading: true,
    });

    const { container } = render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
    );

    expect(container.querySelector(".gas-price-chart")).toBeInTheDocument();

    // Test error state
    (useGasData as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch gas data")
    });

    render(
      <TestWrapper>
        <RoundPerformanceChart />
      </TestWrapper>
    );

    expect(container.querySelector(".gas-price-chart")).toBeInTheDocument();
  });
});