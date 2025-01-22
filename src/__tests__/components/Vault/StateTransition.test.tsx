import { render, screen, fireEvent } from "@testing-library/react";
import StateTransition from "../../../components/Vault/StateTransition";
import { useProtocolContext } from "../../../context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "../../../context/TransactionProvider";
import { useRoundState } from "../../../hooks/stateTransition/useRoundState";
import { useRoundPermissions } from "../../../hooks/stateTransition/useRoundPermissions";
import useFossilStatus from "../../../hooks/fossil/useFossilStatus";

// Mock all hooks
jest.mock("../../../context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("../../../context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

jest.mock("../../../hooks/stateTransition/useRoundState", () => ({
  useRoundState: jest.fn(),
}));

jest.mock("../../../hooks/stateTransition/useRoundPermissions", () => ({
  useRoundPermissions: jest.fn(),
}));

jest.mock("../../../hooks/fossil/useFossilStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("StateTransition Component", () => {
  const mockVaultState = {
    currentRoundId: "1",
    address: "0x123",
    fossilClientAddress: "0x456",
  };

  const mockRoundState = {
    roundId: "1",
    roundState: "Open",
    auctionStartDate: "1000",
    auctionEndDate: "2000",
    optionSettleDate: "3000",
  };

  const defaultProps = {
    isPanelOpen: true,
    setModalState: jest.fn(),
    fossilDelay: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Protocol Context
    (useProtocolContext as jest.Mock).mockReturnValue({
      selectedRoundState: mockRoundState,
      timestamp: "500",
      vaultState: mockVaultState,
      vaultActions: {
        startAuction: jest.fn(),
        endAuction: jest.fn(),
        settleOptionRound: jest.fn(),
      },
      conn: "testnet",
    });

    // Mock Transaction Context
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: null,
      lastBlock: "100",
    });

    // Mock Account
    (useAccount as jest.Mock).mockReturnValue({
      account: "0x123",
    });

    // Mock Round State
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open",
      prevRoundState: "Open",
    });

    // Mock Round Permissions
    (useRoundPermissions as jest.Mock).mockReturnValue({
      canAuctionStart: true,
      canAuctionEnd: false,
      canRoundSettle: false,
      canSendFossilRequest: false,
    });

    // Mock Fossil Status
    (useFossilStatus as jest.Mock).mockReturnValue({
      status: "ready",
      error: null,
      setStatusData: jest.fn(),
    });
  });

  it("renders state transition button with correct states and permissions", () => {
    const statePermissions = [
      { state: "Open", permission: "canAuctionStart", text: "Start Auction" },
      { state: "Auctioning", permission: "canAuctionEnd", text: "End Auction" },
      { state: "FossilReady", permission: "canSendFossilRequest", text: "Request Fossil" },
      { state: "Running", permission: "canRoundSettle", text: "Settle Round" },
    ];

    statePermissions.forEach(({ state, permission, text }) => {
      // Update round state
      (useRoundState as jest.Mock).mockReturnValue({
        roundState: state,
        prevRoundState: state,
      });

      // Test enabled state
      (useRoundPermissions as jest.Mock).mockReturnValue({
        canAuctionStart: false,
        canAuctionEnd: false,
        canRoundSettle: false,
        canSendFossilRequest: false,
        [permission]: true,
      });

      const { container } = render(<StateTransition {...defaultProps} />);
      const button = container.querySelector(".state-transition-button");
      expect(button).toHaveTextContent(text);
      expect(button).not.toBeDisabled();

      // Test disabled state
      (useRoundPermissions as jest.Mock).mockReturnValue({
        canAuctionStart: false,
        canAuctionEnd: false,
        canRoundSettle: false,
        canSendFossilRequest: false,
      });

      const { container: disabledContainer } = render(<StateTransition {...defaultProps} />);
      const disabledButton = disabledContainer.querySelector(".state-transition-button");
      expect(disabledButton).toBeDisabled();
    });
  });

  it("handles panel state changes correctly", () => {
    // Test closed panel
    const { container: closedContainer } = render(<StateTransition {...defaultProps} isPanelOpen={false} />);
    const closedButton = closedContainer.querySelector(".state-transition-button");
    expect(closedButton).toHaveClass("w-[44px]", "h-[44px]");
    expect(closedButton?.querySelector("p")).toHaveClass("hidden");

    // Test open panel
    const { container: openContainer } = render(<StateTransition {...defaultProps} isPanelOpen={true} />);
    const openButton = openContainer.querySelector(".state-transition-button");
    expect(openButton).toHaveClass("p-2");
    expect(openButton?.querySelector("p")).not.toHaveClass("hidden");
  });

  it("handles state transition conditions", () => {
    // Test disconnected account
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    const { container: disconnectedContainer } = render(<StateTransition {...defaultProps} />);
    expect(disconnectedContainer.querySelector(".state-transition-button")).toBeDisabled();

    // Test pending transaction
    (useAccount as jest.Mock).mockReturnValue({ account: "0x123" });
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: "0xtx",
      lastBlock: "100",
    });
    const { container: pendingContainer } = render(<StateTransition {...defaultProps} />);
    expect(pendingContainer.querySelector(".state-transition-button")).toBeDisabled();

    // Test state update in progress
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: null,
      lastBlock: "100",
    });
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "FossilReady",
      prevRoundState: "Auctioning",
    });
    const { container: updatingContainer } = render(<StateTransition {...defaultProps} />);
    expect(updatingContainer.querySelector(".state-transition-button")).toBeDisabled();
  });
}); 