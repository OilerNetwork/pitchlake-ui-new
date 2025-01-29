import { render, screen, fireEvent } from "@testing-library/react";
import VaultCard from "../../../components/VaultCard/VaultCard";
import useVaultState from "../../../hooks/vault/useVaultState";
import useVaultBalances from "../../../hooks/vault/state/useVaultBalances";
import useRoundState from "../../../hooks/optionRound/state/useRoundState";
import useCapLevel from "../../../hooks/optionRound/state/useCapLevel";
import useStrikePrice from "../../../hooks/optionRound/state/useStrikePrice";
import useTimestamps from "../../../hooks/optionRound/state/useTimestamps";
import useLatestTimestamp from "../../../hooks/chain/useLatestTimestamp";
import { useRouter } from "next/navigation";
import { useProtocolContext } from "../../../context/ProtocolProvider";

jest.mock("@starknet-react/core", () => ({
  useProvider: () => ({
    provider: {}
  }),
  useAccount: () => ({
    account: {}
  }),
  useReadContract: () => ({
    data: {}
  })
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn()
}));

jest.mock("../../../hooks/vault/useVaultState");
jest.mock("../../../hooks/vault/state/useVaultBalances");
jest.mock("../../../hooks/optionRound/state/useRoundState");
jest.mock("../../../hooks/optionRound/state/useCapLevel");
jest.mock("../../../hooks/optionRound/state/useStrikePrice");
jest.mock("../../../hooks/optionRound/state/useTimestamps");
jest.mock("../../../hooks/chain/useLatestTimestamp");
jest.mock("../../../context/ProtocolProvider");

describe("VaultCard", () => {
  const mockRouter = {
    push: jest.fn()
  };

  const mockSetSelectedRound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useProtocolContext as jest.Mock).mockReturnValue({
      setSelectedRound: mockSetSelectedRound
    });
    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        vaultType: "Call",
        currentRoundId: "1"
      },
      currentRoundAddress: "0x456"
    });
    (useVaultBalances as jest.Mock).mockReturnValue({
      lockedBalance: "100000000000000000",
      unlockedBalance: "200000000000000000",
      stashedBalance: "300000000000000000"
    });
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open"
    });
    (useCapLevel as jest.Mock).mockReturnValue({
      capLevel: "1000"
    });
    (useStrikePrice as jest.Mock).mockReturnValue({
      strikePrice: "2000000000"
    });
    (useTimestamps as jest.Mock).mockReturnValue({
      auctionStartDate: "1234567890",
      auctionEndDate: "1234567899",
      optionSettleDate: "1234567999"
    });
    (useLatestTimestamp as jest.Mock).mockReturnValue({
      timestamp: "1234567800"
    });
  });

  it("navigates to vault details on click", () => {
    render(<VaultCard vaultAddress="0x123" />);
    const card = screen.getByTestId("vault-card");
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith("/vaults/0x123");
    expect(mockSetSelectedRound).toHaveBeenCalledWith(1);
  });

  it("displays loading state when data is not available", () => {
    (useCapLevel as jest.Mock).mockReturnValue({
      capLevel: "0"
    });
    (useStrikePrice as jest.Mock).mockReturnValue({
      strikePrice: "0"
    });
    
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByTestId("vault-cap")).toHaveTextContent("Loading...");
    expect(screen.getByTestId("vault-strike")).toHaveTextContent("Loading...");
  });

  it("displays formatted values when data is available", () => {
    render(<VaultCard vaultAddress="0x123" />);
    
    expect(screen.getByTestId("vault-cap")).toHaveTextContent("10%");
    expect(screen.getByTestId("vault-strike")).toHaveTextContent("2.00 GWEI");
    expect(screen.getByTestId("vault-tvl")).toHaveTextContent("0.6 ETH");
  });
});
