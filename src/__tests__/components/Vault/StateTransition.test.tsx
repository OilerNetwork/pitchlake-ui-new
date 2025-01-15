import { render, screen, fireEvent, act } from "@testing-library/react";
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

    // Mock Round State with matching prevRoundState
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open",
      prevRoundState: "Open", // Set to match roundState
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

  describe("Round State Transitions", () => {
    it.each([
      ["Open", "Start Auction"],
      ["Auctioning", "End Auction"],
      ["FossilReady", "Request Fossil"],
      ["Running", "Settle Round"],
    ])("shows correct button text for %s state", (state, expectedText) => {
      (useRoundState as jest.Mock).mockReturnValue({
        roundState: state,
        prevRoundState: state,
      });

      render(<StateTransition {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toHaveTextContent(expectedText);
    });

    it.each([
      ["Open", "canAuctionStart"],
      ["Auctioning", "canAuctionEnd"],
      ["Running", "canRoundSettle"],
      ["FossilReady", "canSendFossilRequest"],
    ])("disables button when %s state permission is false", (state, permission) => {
      (useRoundState as jest.Mock).mockReturnValue({
        roundState: state,
        prevRoundState: state,
      });

      (useRoundPermissions as jest.Mock).mockReturnValue({
        canAuctionStart: false,
        canAuctionEnd: false,
        canRoundSettle: false,
        canSendFossilRequest: false,
        [permission]: false,
      });

      render(<StateTransition {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("Panel States", () => {
    it("renders correctly when panel is closed", () => {
      render(<StateTransition {...defaultProps} isPanelOpen={false} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-[44px]", "h-[44px]");
      expect(button.querySelector("p")).toHaveClass("hidden");
    });

    it("renders correctly when panel is open", () => {
      render(<StateTransition {...defaultProps} isPanelOpen={true} />);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("p-2");
      expect(button.querySelector("p")).not.toHaveClass("hidden");
    });
  });

  describe("Account and Transaction States", () => {
    it("disables button when account is not connected", () => {
      (useAccount as jest.Mock).mockReturnValue({ account: null });
      render(<StateTransition {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("disables button when transaction is pending", () => {
      (useTransactionContext as jest.Mock).mockReturnValue({
        pendingTx: "0xtx",
        lastBlock: "100",
      });
      render(<StateTransition {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("disables button when awaiting round state update", () => {
      (useRoundState as jest.Mock).mockReturnValue({
        roundState: "FossilReady",
        prevRoundState: "Auctioning", // Previous state is correct in the flow
      });
      render(<StateTransition {...defaultProps} />);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });

  describe("State Transition Actions", () => {
    type ActionType = "startAuction" | "endAuction" | "settleOptionRound";
    
    it.each<[string, ActionType, string]>([
      ["Open", "startAuction", "Auctioning"],
      ["Auctioning", "endAuction", "FossilReady"],
      ["Running", "settleOptionRound", "Open"],
    ])("calls correct action for %s state", async (state, action, nextState) => {
      const mockActions = {
        startAuction: jest.fn().mockResolvedValue(undefined),
        endAuction: jest.fn().mockResolvedValue(undefined),
        settleOptionRound: jest.fn().mockResolvedValue(undefined),
      };

      // Mock the full protocol context
      (useProtocolContext as jest.Mock).mockReturnValue({
        selectedRoundState: { ...mockRoundState, roundState: state },
        timestamp: "500",
        vaultState: mockVaultState,
        vaultActions: mockActions,
        conn: "testnet",
      });

      // Mock permissions to allow the action
      (useRoundPermissions as jest.Mock).mockReturnValue({
        canAuctionStart: state === "Open",
        canAuctionEnd: state === "Auctioning",
        canRoundSettle: state === "Running",
        canSendFossilRequest: state === "FossilReady",
      });

      // Mock round state
      (useRoundState as jest.Mock).mockReturnValue({
        roundState: state,
        prevRoundState: state,
      });

      const { setModalState } = defaultProps;
      render(<StateTransition {...defaultProps} />);
      
      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
      
      await act(async () => {
        fireEvent.click(button);
      });

      // Verify modal state was set
      expect(setModalState).toHaveBeenCalledWith(expect.objectContaining({
        show: true,
        onConfirm: expect.any(Function),
      }));

      // Get and call the onConfirm function
      const { onConfirm } = setModalState.mock.calls[0][0];
      await act(async () => {
        await onConfirm();
      });

      // Verify the correct action was called
      expect(mockActions[action]).toHaveBeenCalled();
    });
  });
}); 