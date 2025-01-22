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
  ArrowDownIcon: () => <div className="arrow-down" />,
  ArrowUpIcon: () => <div className="arrow-up" />,
  ArrowLeftIcon: () => <div className="arrow-left" />,
  ArrowRightIcon: () => <div className="arrow-right" />,
  CheckIcon: () => <div className="check-icon" />,
}));

// Mock the ChartInner component
jest.mock("@/components/Vault/VaultChart/ChartInner", () => ({
  __esModule: true,
  default: () => <div className="chart-inner" />,
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

  it("renders chart with navigation and handles interactions", () => {
    const { container, rerender } = render(<RoundPerformanceChart />);

    // Check initial render
    const roundNav = container.querySelector(".round-nav");
    expect(roundNav).toBeInTheDocument();
    expect(roundNav?.textContent).toContain("Round3");
    expect(container.querySelector(".arrow-down")).toBeInTheDocument();
    expect(container.querySelector(".chart-inner")).toBeInTheDocument();

    // Test round navigation dropdown
    fireEvent.click(roundNav!);
    expect(container.querySelector(".arrow-up")).toBeInTheDocument();

    // Test round navigation
    const leftArrow = container.querySelector(".arrow-left");
    const rightArrow = container.querySelector(".arrow-right");
    
    fireEvent.click(leftArrow!);
    expect(mockSetSelectedRound).toHaveBeenCalledWith(2);

    fireEvent.click(rightArrow!);
    expect(mockSetSelectedRound).toHaveBeenCalledWith(4);

    // Test with current round
    (useProtocolContext as jest.Mock).mockReturnValue({
      ...mockVaultState,
      selectedRound: 5,
      selectedRoundState: mockSelectedRoundState,
    });
    
    rerender(<RoundPerformanceChart />);
    expect(container.querySelector(".arrow-right")).not.toBeInTheDocument();
  });
}); 