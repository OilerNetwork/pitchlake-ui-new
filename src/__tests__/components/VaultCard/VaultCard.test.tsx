import { render, screen, fireEvent } from "@testing-library/react";
import VaultCard from "../../../components/VaultCard/VaultCard";
import { useRouter } from "next/navigation";
import { useProvider } from "@starknet-react/core";
import useVaultBalances from "../../../hooks/vault/state/useVaultBalances";
import useVaultState from "../../../hooks/vault/useVaultState";
import useRoundState from "../../../hooks/optionRound/state/useRoundState";
import useCapLevel from "../../../hooks/optionRound/state/useCapLevel";
import useStrikePrice from "../../../hooks/optionRound/state/useStrikePrice";
import useTimestamps from "../../../hooks/optionRound/state/useTimestamps";
import useLatestTimestamp from "../../../hooks/chain/useLatestTimestamp";
import { useProtocolContext } from "../../../context/ProtocolProvider";

// Mock hooks and context
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  useProvider: jest.fn(),
}));

jest.mock("../../../hooks/vault/state/useVaultBalances", () => jest.fn());
jest.mock("../../../hooks/vault/useVaultState", () => jest.fn());
jest.mock("../../../hooks/optionRound/state/useRoundState", () => jest.fn());
jest.mock("../../../hooks/optionRound/state/useCapLevel", () => jest.fn());
jest.mock("../../../hooks/optionRound/state/useStrikePrice", () => jest.fn());
jest.mock("../../../hooks/optionRound/state/useTimestamps", () => jest.fn());
jest.mock("../../../hooks/chain/useLatestTimestamp", () => jest.fn());
jest.mock("../../../context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

type MockHookParams = {
  lockedBalance?: string;
  unlockedBalance?: string;
  stashedBalance?: string;
  currentRoundId?: string;
  vaultType?: string;
  currentRoundAddress?: string;
  roundState?: string;
  capLevel?: string;
  strikePrice?: string;
  auctionStartDate?: string;
  auctionEndDate?: string;
  optionSettleDate?: string;
  timestamp?: string;
  routerPush?: jest.Mock;
};

const mockHooks = ({
  lockedBalance = "1000000000000000000",
  unlockedBalance = "500000000000000000",
  stashedBalance = "200000000000000000",
  currentRoundId = "1",
  vaultType,
  currentRoundAddress = "0x123",
  roundState = "Open",
  capLevel = "1000",
  strikePrice = "1000000000",
  auctionStartDate = "2000",
  auctionEndDate = "3000",
  optionSettleDate = "4000",
  timestamp = "1000",
  routerPush = jest.fn(),
}: MockHookParams = {}) => {
  (useRouter as jest.Mock).mockReturnValue({ push: routerPush });
  (useProvider as jest.Mock).mockReturnValue({});
  (useVaultBalances as jest.Mock).mockReturnValue({
    lockedBalance,
    unlockedBalance,
    stashedBalance,
  });
  (useVaultState as jest.Mock).mockReturnValue({
    vaultState: { 
      currentRoundId, 
      vaultType 
    },
    currentRoundAddress,
  });
  (useRoundState as jest.Mock).mockReturnValue({ roundState });
  (useCapLevel as jest.Mock).mockReturnValue({ capLevel });
  (useStrikePrice as jest.Mock).mockReturnValue({ strikePrice });
  (useTimestamps as jest.Mock).mockReturnValue({
    auctionStartDate,
    auctionEndDate,
    optionSettleDate,
  });
  (useLatestTimestamp as jest.Mock).mockReturnValue({ timestamp });
  (useProtocolContext as jest.Mock).mockReturnValue({
    setSelectedRound: jest.fn(),
  });
};

describe("VaultCard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the VaultCard with correct data", () => {
    mockHooks({
      vaultType: "Test Vault",
      capLevel: "1000",
      strikePrice: "1000000000",
      lockedBalance: "1000000000000000000",
      unlockedBalance: "500000000000000000",
      stashedBalance: "200000000000000000",
      roundState: "Open",
      currentRoundAddress: "0x123",
      timestamp: "1000",
      auctionStartDate: "2000",
      auctionEndDate: "3000",
      optionSettleDate: "4000"
    });
    render(<VaultCard vaultAddress="0x123" />);

    expect(screen.getByText(/Test Vault/i)).toBeInTheDocument();
    expect(screen.getByText(/0x123/i)).toBeInTheDocument();
    expect(screen.getByText(/10%/i)).toBeInTheDocument();
    expect(screen.getByText(/1.00 GWEI/i)).toBeInTheDocument();
    expect(screen.getByText(/1.7 ETH/i)).toBeInTheDocument();
  });

  it("navigates to the vault page on click", () => {
    const mockPush = jest.fn();
    mockHooks({ routerPush: mockPush, vaultType: "Test Vault"   });
    render(<VaultCard vaultAddress="0x123" />);

    fireEvent.click(screen.getByText(/Test Vault/i));
    expect(mockPush).toHaveBeenCalledWith("/vaults/0x123");
  });

  it("displays correct time text based on round state - Open", () => {
    mockHooks({
      roundState: "Open",
      timestamp: "1000",
      auctionStartDate: "2000",
      auctionEndDate: "3000",
      optionSettleDate: "4000"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/AUCTION STARTS/i)).toBeInTheDocument();
  });

  it("displays correct time text based on round state - Auctioning", () => {
    mockHooks({
      roundState: "Auctioning",
      timestamp: "2000",
      auctionStartDate: "1000",
      auctionEndDate: "3000",
      optionSettleDate: "4000"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/AUCTION ENDS/i)).toBeInTheDocument();
  });

  it("displays correct time text based on round state - Running", () => {
    mockHooks({
      roundState: "Running",
      timestamp: "3000",
      auctionStartDate: "1000",
      auctionEndDate: "2000",
      optionSettleDate: "4000"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/ROUND SETTLES/i)).toBeInTheDocument();
  });

  it("handles missing timestamp data gracefully", () => {
    mockHooks({
      roundState: "Loading",
      timestamp: undefined,
      auctionStartDate: undefined,
      auctionEndDate: undefined,
      optionSettleDate: undefined,
      vaultType: "Test Vault"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it("correctly formats and displays zero balances", () => {
    mockHooks({
      lockedBalance: "0",
      unlockedBalance: "0",
      stashedBalance: "0",
      vaultType: "Test Vault",
      roundState: "Open",
      timestamp: "1000",
      auctionStartDate: "2000",
      auctionEndDate: "3000",
      optionSettleDate: "4000"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/0.0 ETH/i)).toBeInTheDocument();
  });

  it("correctly sets selected round on navigation", () => {
    const mockSetSelectedRound = jest.fn();
    const mockPush = jest.fn();
    mockHooks({
      routerPush: mockPush,
      currentRoundId: "42",
      vaultType: "Test Vault"
    });
    (useProtocolContext as jest.Mock).mockReturnValue({
      setSelectedRound: mockSetSelectedRound
    });

    render(<VaultCard vaultAddress="0x123" />);
    fireEvent.click(screen.getByText(/Test Vault/i));

    expect(mockSetSelectedRound).toHaveBeenCalledWith(42);
    expect(mockPush).toHaveBeenCalledWith("/vaults/0x123");
  });

  it("handles undefined vault type gracefully", () => {
    mockHooks({
      vaultType: undefined,
      currentRoundAddress: "0x123",
      strikePrice: "1000000000",
      capLevel: "1000"
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    const container = document.querySelector('.vault-type')?.nextElementSibling;
    expect(container).toHaveTextContent("--");
  });

  it("displays correct strike price formatting", () => {
    mockHooks({
      strikePrice: "2500000000" // 2.5 GWEI
    });
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByText(/2.50 GWEI/i)).toBeInTheDocument();
  });
});
