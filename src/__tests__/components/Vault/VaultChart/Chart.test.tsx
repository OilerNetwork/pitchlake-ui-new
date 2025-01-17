import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RoundPerformanceChart from "@/components/Vault/VaultChart/Chart";
import { useProtocolContext } from "@/context/ProtocolProvider";
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
  ArrowDownIcon: () => <div data-testid="arrow-down-icon" />,
  ArrowUpIcon: () => <div data-testid="arrow-up-icon" />,
  ArrowLeftIcon: () => <div data-testid="arrow-left-icon" />,
  ArrowRightIcon: () => <div data-testid="arrow-right-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />,
}));

// Mock the ChartInner component
jest.mock("@/components/Vault/VaultChart/ChartInner", () => ({
  __esModule: true,
  default: () => <div data-testid="chart-inner" />,
}));

describe("RoundPerformanceChart", () => {
  const mockSetSelectedRound = jest.fn();
  const mockVaultState = {
    address: "0x123",
    currentRoundId: "5",
  };
  const mockSelectedRoundState = {
    deploymentDate: "1000",
    optionSettleDate: "2000",
    auctionEndDate: "1500",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useProtocolContext
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 3,
      selectedRoundState: mockSelectedRoundState,
      setSelectedRound: mockSetSelectedRound,
      vaultState: mockVaultState,
    });

    // Mock useGasData
    (useGasData as jest.Mock).mockReturnValue({
      gasData: [],
      isLoading: false,
      isError: false,
      error: null,
    });

    // Mock useHistoricalRoundParams
    (useHistoricalRoundParams as jest.Mock).mockReturnValue({
      vaultData: {
        rounds: [],
      },
    });
  });

  it("renders with initial state", () => {
    render(<RoundPerformanceChart />);

    // Check if round navigation is rendered
    expect(screen.getByText("Round")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByTestId("arrow-down-icon")).toBeInTheDocument();

    // Check if chart is rendered
    expect(screen.getByTestId("chart-inner")).toBeInTheDocument();
  });

  it("toggles round navigation dropdown", () => {
    render(<RoundPerformanceChart />);

    const roundNav = screen.getByText("Round").parentElement;
    fireEvent.click(roundNav!);

    // Arrow should change from down to up
    expect(screen.getByTestId("arrow-up-icon")).toBeInTheDocument();
  });

  it("decrements round when clicking left arrow", () => {
    render(<RoundPerformanceChart />);

    const leftArrow = screen.getByTestId("arrow-left-icon");
    fireEvent.click(leftArrow);

    expect(mockSetSelectedRound).toHaveBeenCalledWith(2);
  });

  it("increments round when clicking right arrow", () => {
    render(<RoundPerformanceChart />);

    const rightArrow = screen.getByTestId("arrow-right-icon");
    fireEvent.click(rightArrow);

    expect(mockSetSelectedRound).toHaveBeenCalledWith(4);
  });

  it("does not decrement round when at round 1", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 1,
      selectedRoundState: mockSelectedRoundState,
      setSelectedRound: mockSetSelectedRound,
      vaultState: mockVaultState,
    });

    render(<RoundPerformanceChart />);

    const leftArrow = screen.getByTestId("arrow-left-icon");
    fireEvent.click(leftArrow);

    expect(mockSetSelectedRound).not.toHaveBeenCalled();
  });

  it("does not increment round when at current round", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRound: 5,
      selectedRoundState: mockSelectedRoundState,
      setSelectedRound: mockSetSelectedRound,
      vaultState: mockVaultState,
    });

    render(<RoundPerformanceChart />);

    const rightArrow = screen.getByTestId("arrow-right-icon");
    fireEvent.click(rightArrow);

    expect(mockSetSelectedRound).not.toHaveBeenCalled();
  });

  it("toggles line visibility", () => {
    render(<RoundPerformanceChart />);

    // Find and click the TWAP toggle
    const twapToggle = screen.getByText("TWAP").parentElement;
    fireEvent.click(twapToggle!);

    // Re-render should occur with updated activeLines state
    expect(screen.getByTestId("chart-inner")).toBeInTheDocument();
  });
}); 