import { render, screen, fireEvent, act } from "@testing-library/react";
import StateTransition from "../../../components/Vault/StateTransition";
import { useProtocolContext } from "../../../context/ProtocolProvider";
import { useTransactionContext } from "../../../context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import useFossilStatus from "../../../hooks/fossil/useFossilStatus";
import { useRoundState } from "../../../hooks/stateTransition/useRoundState";
import { useRoundPermissions } from "../../../hooks/stateTransition/useRoundPermissions";
import { useHelpContext } from "@/context/HelpProvider";

// Mock all hooks
jest.mock("../../../context/ProtocolProvider");
jest.mock("../../../context/TransactionProvider");
jest.mock("@starknet-react/core");
jest.mock("../../../hooks/fossil/useFossilStatus");
jest.mock("../../../hooks/stateTransition/useRoundState");
jest.mock("../../../hooks/stateTransition/useRoundPermissions");
jest.mock("@/context/HelpProvider");

// Mock fetch for fossil requests
global.fetch = jest.fn();

describe("StateTransition", () => {
  const mockSetModalState = jest.fn();
  const mockStartAuction = jest.fn();
  const mockEndAuction = jest.fn();
  const mockSettleOptionRound = jest.fn();
  const mockSetFossilStatus = jest.fn();
  const mockSetContent = jest.fn();
  const mockSetHeader = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useHelpContext
    (useHelpContext as jest.Mock).mockReturnValue({
      setContent: mockSetContent,
      setHeader: mockSetHeader,
      isHoveringHelpBox: false
    });

    // Mock useProtocolContext
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultState: {
        currentRoundId: "1",
        fossilClientAddress: "0x123",
        address: "0x456"
      },
      vaultActions: {
        startAuction: mockStartAuction,
        endAuction: mockEndAuction,
        settleOptionRound: mockSettleOptionRound
      },
      selectedRoundState: {
        roundId: "1"
      },
      timestamp: "1000",
      conn: "testnet"
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false
    });

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x789" }
    });

    // Mock useFossilStatus
    (useFossilStatus as jest.Mock).mockReturnValue({
      status: null,
      error: null,
      setStatusData: mockSetFossilStatus
    });

    // Mock useRoundState
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open",
      prevRoundState: "Open"
    });

    // Mock useRoundPermissions
    (useRoundPermissions as jest.Mock).mockReturnValue({
      canAuctionStart: true,
      canAuctionEnd: true,
      canRoundSettle: true,
      canSendFossilRequest: true
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success" })
    });
  });

  it("renders state transition button with correct text", () => {
    render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(screen.getByText("Start Auction")).toBeInTheDocument();
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("handles state transitions correctly", async () => {
    render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    // Test Open -> Auctioning transition
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open",
      prevRoundState: "Open"
    });

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSetModalState).toHaveBeenCalledWith({
      show: true,
      action: "Start Auction",
      onConfirm: expect.any(Function)
    });

    // Get and call the onConfirm function
    const { onConfirm } = mockSetModalState.mock.calls[0][0];
    await act(() => onConfirm());

    expect(mockStartAuction).toHaveBeenCalled();
  });

  it("handles fossil request correctly", async () => {
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "FossilReady",
      prevRoundState: "FossilReady"
    });

    render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockSetModalState).toHaveBeenCalledWith({
      show: true,
      action: "Request Fossil",
      onConfirm: expect.any(Function)
    });

    // Get and call the onConfirm function
    const { onConfirm } = mockSetModalState.mock.calls[0][0];
    await act(() => onConfirm());

    expect(global.fetch).toHaveBeenCalledWith("/api/sendFossilRequest", expect.any(Object));
    expect(mockSetFossilStatus).toHaveBeenCalledWith({
      status: "Pending",
      error: undefined
    });
  });

  it("disables button when appropriate", () => {
    // Test with no account
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    
    const { rerender } = render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();

    // Test with pending transaction
    (useAccount as jest.Mock).mockReturnValue({ account: { address: "0x789" } });
    (useTransactionContext as jest.Mock).mockReturnValue({ pendingTx: true });

    rerender(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("handles permission-based disabling correctly", () => {
    (useRoundPermissions as jest.Mock).mockReturnValue({
      canAuctionStart: false,
      canAuctionEnd: false,
      canRoundSettle: false,
      canSendFossilRequest: false
    });

    render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders nothing for settled rounds", () => {
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Settled",
      prevRoundState: "Settled"
    });

    const { container } = render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when round IDs don't match", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultState: {
        currentRoundId: "2",
        fossilClientAddress: "0x123",
        address: "0x456"
      },
      selectedRoundState: {
        roundId: "1"
      }
    });

    const { container } = render(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    expect(container.firstChild).toBeNull();
  });
}); 