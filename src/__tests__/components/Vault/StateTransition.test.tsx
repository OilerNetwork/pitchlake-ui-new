import { render, screen, fireEvent, act } from "@testing-library/react";
import DemoStateTransition from "@/components/Vault/DemoStateTransition";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useNewContext } from "@/context/NewProvider";
import { useAccount } from "@starknet-react/core";
import { useTimeContext } from "@/context/TimeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock all hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState");
jest.mock("@/hooks/vault_v2/states/useVaultState");
jest.mock("@/hooks/vault_v2/actions/useVaultActions");
jest.mock("@/context/NewProvider");
jest.mock("@/context/HelpProvider");
jest.mock("@/context/TransactionProvider");
jest.mock("@/context/TimeProvider");

// Default test states
interface RoundStateData {
  roundState: string;
  auctionStartDate: string;
  auctionEndDate: string;
  optionSettleDate: string;
  roundId: string;
}

const defaultRoundState: RoundStateData = {
  roundState: "Open",
  auctionStartDate: "1000",
  auctionEndDate: "2000",
  optionSettleDate: "3000",
  roundId: "1",
};

const defaultVaultState = {
  address: "0x123",
  fossilClientAddress: "0x789",
};

const defaultVaultActions = {
  startAuction: jest.fn(),
  endAuction: jest.fn(),
  demoFossilCallback: jest.fn(),
  sendFossilRequest: jest.fn(),
};

// Test setup function
const renderDemoStateTransition = ({
  roundState = defaultRoundState,
  vaultState = defaultVaultState,
  account = { address: "0x123", status: "connected" },
  timestamp = 1500,
  pendingTx = undefined,
  conn = "demo",
  vaultActions = defaultVaultActions,
  isPanelOpen = true,
}: {
  roundState?: Partial<RoundStateData>;
  vaultState?: Partial<typeof defaultVaultState>;
  account?: { address: string | null; status: string };
  timestamp?: number;
  pendingTx?: string;
  conn?: string;
  vaultActions?: typeof defaultVaultActions;
  isPanelOpen?: boolean;
} = {}) => {
  const mockSetModalState = jest.fn();
  const queryClient = new QueryClient();

  // Setup hook mocks
  (useRoundState as jest.Mock).mockReturnValue({
    ...defaultRoundState,
    ...roundState,
  });

  (useVaultState as jest.Mock).mockReturnValue({
    vaultState: {
      ...defaultVaultState,
      ...vaultState,
    },
    selectedRoundAddress: "0x456",
  });

  (useAccount as jest.Mock).mockReturnValue({
    account: account.status === "connected" ? { address: account.address } : null,
    status: account.status,
  });

  (useTransactionContext as jest.Mock).mockReturnValue({
    pendingTx,
  });

  (useTimeContext as jest.Mock).mockReturnValue({
    timestamp,
  });

  (useNewContext as jest.Mock).mockReturnValue({ conn });
  (useVaultActions as jest.Mock).mockReturnValue(vaultActions);
  (useHelpContext as jest.Mock).mockReturnValue({
    setContent: jest.fn(),
    setHeader: jest.fn(),
    isHoveringHelpBox: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <DemoStateTransition isPanelOpen={isPanelOpen} setModalState={mockSetModalState} />
    </QueryClientProvider>
  );

  return { mockSetModalState };
};

describe("DemoStateTransition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders state transition button with correct text when panel is open", () => {
      renderDemoStateTransition({
        roundState: {
          roundState: "Open",
          auctionStartDate: "1000",
        },
        timestamp: 1500,
      });

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe("Start Auction");
    });

    it("renders only icon when panel is closed", () => {
      renderDemoStateTransition({
        roundState: {
          roundState: "Open",
          auctionStartDate: "1000",
        },
        timestamp: 1500,
        isPanelOpen: false,
      });

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      const text = button.querySelector("p");
      expect(text).toHaveClass("hidden");
    });

    it("renders nothing for settled rounds", () => {
      renderDemoStateTransition({
        roundState: {
          roundState: "Settled",
        },
      });

      const button = screen.queryByRole("button");
      expect(button).not.toBeInTheDocument();
    });
  });

  describe("Button States", () => {
    it("disables button when no account is connected", () => {
      renderDemoStateTransition({
        account: { address: null, status: "disconnected" },
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("disables button during pending transactions", () => {
      renderDemoStateTransition({
        pendingTx: "0xtx",
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("disables button when timestamp is before target time", () => {
      renderDemoStateTransition({
        roundState: {
          roundState: "Open",
          auctionStartDate: "2000", // Future timestamp
        },
        timestamp: 1000,
      });

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("shows pending state during transitions", () => {
      renderDemoStateTransition({
        roundState: {
          roundState: "Open",
        },
        pendingTx: "0xtx",
      });

      const button = screen.getByRole("button");
      expect(button.textContent).toBe("Pending");
      expect(button).toBeDisabled();
    });
  });

  describe("State Transitions", () => {
    it("handles auction start transition", async () => {
      const { mockSetModalState } = renderDemoStateTransition({
        roundState: {
          roundState: "Open",
          auctionStartDate: "1000",
        },
        timestamp: 1500,
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "Start Auction",
        onConfirm: expect.any(Function),
      });

      // Execute the onConfirm callback
      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.startAuction).toHaveBeenCalled();
    });

    it("handles auction end transition", async () => {
      const { mockSetModalState } = renderDemoStateTransition({
        roundState: {
          roundState: "Auctioning",
          auctionEndDate: "1000",
        },
        timestamp: 1500,
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "End Auction",
        onConfirm: expect.any(Function),
      });

      // Execute the onConfirm callback
      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.endAuction).toHaveBeenCalled();
    });

    it("handles demo fossil callback for round settlement", async () => {
      const { mockSetModalState } = renderDemoStateTransition({
        roundState: {
          roundState: "Running",
          optionSettleDate: "1000",
          roundId: "1",
        },
        timestamp: 1500,
        conn: "demo",
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "Settle Round",
        onConfirm: expect.any(Function),
      });

      // Execute the onConfirm callback
      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.demoFossilCallback).toHaveBeenCalledWith({
        vaultAddress: "0x123",
        roundId: "1",
        toTimestamp: "1000",
      });
    });

    it("handles standard fossil request for round settlement", async () => {
      const { mockSetModalState } = renderDemoStateTransition({
        roundState: {
          roundState: "Running",
          optionSettleDate: "2000",
          auctionEndDate: "1000",
        },
        timestamp: 2500,
        conn: "mock",
      });

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "Settle Round",
        onConfirm: expect.any(Function),
      });

      // Execute the onConfirm callback
      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.sendFossilRequest).toHaveBeenCalledWith({
        targetTimestamp: 2000,
        vaultAddress: "0x123",
        clientAddress: "0x789",
        roundDuration: 1000,
      });
    });
  });
});
