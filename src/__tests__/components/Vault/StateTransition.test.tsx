import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import StateTransition from "@/components/Vault/StateTransition";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { useHelpContext } from "@/context/HelpProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useNewContext } from "@/context/NewProvider";
import { useRoundState as useRoundStateTransition } from "@/hooks/stateTransition/useRoundState";
import { useRoundPermissions } from "@/hooks/stateTransition/useRoundPermissions";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock all hooks
jest.mock("../../../context/TransactionProvider", () => ({
  useTransactionContext: jest.fn()
}));

jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn()
}));

jest.mock("@/hooks/fossil/useFossilStatus");
jest.mock("@/hooks/vault_v2/states/useRoundState");
jest.mock("@/hooks/vault_v2/states/useVaultState");
jest.mock("@/hooks/vault_v2/actions/useVaultActions");
jest.mock("@/context/NewProvider");
jest.mock("@/hooks/stateTransition/useRoundState");
jest.mock("@/hooks/stateTransition/useRoundPermissions");
jest.mock("@/context/HelpProvider");

// Mock fetch for fossil requests
global.fetch = jest.fn();

const queryClient = new QueryClient();

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <div data-testid="help-provider">
        <div data-testid="transaction-provider">
          {ui}
        </div>
      </div>
    </QueryClientProvider>
  );
};

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
    queryClient.clear();

    // Mock useHelpContext
    (useHelpContext as jest.Mock).mockReturnValue({
      setContent: mockSetContent,
      setHeader: mockSetHeader,
      isHoveringHelpBox: false
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      setModalState: jest.fn()
    });

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x789" },
      status: "connected"
    });

    // Mock useFossilStatus
    (useFossilStatus as jest.Mock).mockReturnValue({
      status: null,
      error: null,
      setStatusData: mockSetFossilStatus,
      isLoading: false
    });

    // Mock useNewContext
    (useNewContext as jest.Mock).mockReturnValue({
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "5",
          address: "0x123",
          roundState: "Open"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "5",
          address: "0x123",
          roundState: "Open"
        }
      }
    });

    // Mock useVaultState
    (useVaultState as jest.Mock).mockReturnValue({
      vaultState: {
        address: "0x123",
        roundState: "Open"
      },
      selectedRoundAddress: "0x456",
      isLoading: false
    });

    // Mock useRoundState
    (useRoundState as jest.Mock).mockReturnValue({
      roundState: "Open",
      isLoading: false
    });

    // Mock useVaultActions
    (useVaultActions as jest.Mock).mockReturnValue({
      startAuction: mockStartAuction,
      endAuction: mockEndAuction,
      settleOptionRound: mockSettleOptionRound,
      isLoading: false
    });

    // Mock useRoundStateTransition
    (useRoundStateTransition as jest.Mock).mockReturnValue({
      roundState: "Open",
      prevRoundState: "Open",
      isLoading: false
    });

    // Mock useRoundPermissions
    (useRoundPermissions as jest.Mock).mockReturnValue({
      canAuctionStart: true,
      canAuctionEnd: true,
      canRoundSettle: true,
      canSendFossilRequest: true,
      isLoading: false
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: "success" })
    });
  });

  it("renders state transition button with correct text", () => {
    renderWithProviders(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    const button = screen.getByRole("button", { name: /Start Auction/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("handles state transitions correctly", async () => {
    renderWithProviders(
      <StateTransition
        isPanelOpen={true}
        setModalState={mockSetModalState}
        fossilDelay={300}
      />
    );

    const button = screen.getByRole("button", { name: /Start Auction/i });
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
      roundState: "Settled"
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