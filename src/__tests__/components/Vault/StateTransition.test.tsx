import { render, screen, fireEvent, act } from "@testing-library/react";
import StateTransition from "@/components/Vault/DemoStateTransition";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useNewContext } from "@/context/NewProvider";
import { useRoundState as useRoundStateTransition } from "@/hooks/stateTransition/useRoundState";
import { useRoundPermissions } from "@/hooks/stateTransition/useRoundPermissions";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount } from "@starknet-react/core";

// Centralized mock configuration
const mockConfig = {
  hooks: {
    account: jest.mock("@starknet-react/core", () => ({
      useAccount: jest.fn(),
    })),
    fossil: jest.mock("@/hooks/fossil/useFossilStatus"),
    vault: {
      roundState: jest.mock("@/hooks/vault_v2/states/useRoundState"),
      vaultState: jest.mock("@/hooks/vault_v2/states/useVaultState"),
      vaultActions: jest.mock("@/hooks/vault_v2/actions/useVaultActions"),
    },
    context: {
      new: jest.mock("@/context/NewProvider"),
      help: jest.mock("@/context/HelpProvider"),
      transaction: jest.mock("@/context/TransactionProvider", () => ({
        useTransactionContext: jest.fn().mockReturnValue({
          isTxDisabled: false,
          pendingTx: undefined,
          setIsTxDisabled: jest.fn(),
          setPendingTx: jest.fn(),
          status: "idle" as const,
        }),
      })),
    },
    stateTransition: {
      roundState: jest.mock("@/hooks/stateTransition/useRoundState"),
      permissions: jest.mock("@/hooks/stateTransition/useRoundPermissions"),
    },
  },
  api: {
    fetch: jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: "success" }),
      }),
    ),
  },
};

// Apply mocks
global.fetch = mockConfig.api.fetch;

// Mock all hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));
jest.mock("@/hooks/fossil/useFossilStatus");
jest.mock("@/hooks/vault_v2/states/useRoundState");
jest.mock("@/hooks/vault_v2/states/useVaultState");
jest.mock("@/hooks/vault_v2/actions/useVaultActions");
jest.mock("@/context/NewProvider");
jest.mock("@/hooks/stateTransition/useRoundState");
jest.mock("@/hooks/stateTransition/useRoundPermissions");
jest.mock("@/context/HelpProvider");
jest.mock("@/context/TransactionProvider");

// Mock the transaction context
jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn().mockReturnValue({
    isTxDisabled: false,
    pendingTx: undefined,
    setIsTxDisabled: jest.fn(),
    setPendingTx: jest.fn(),
    status: "idle" as const,
  }),
}));

// Group related mocks
const mockHooks = {
  account: jest.mock("@starknet-react/core", () => ({
    useAccount: jest.fn(),
  })),
  fossil: jest.mock("@/hooks/fossil/useFossilStatus"),
  vault: {
    roundState: jest.mock("@/hooks/vault_v2/states/useRoundState"),
    vaultState: jest.mock("@/hooks/vault_v2/states/useVaultState"),
    vaultActions: jest.mock("@/hooks/vault_v2/actions/useVaultActions"),
  },
  context: {
    new: jest.mock("@/context/NewProvider"),
    help: jest.mock("@/context/HelpProvider"),
    transaction: jest.mock("@/context/TransactionProvider", () => ({
      useTransactionContext: jest.fn().mockReturnValue({
        isTxDisabled: false,
        pendingTx: undefined,
        setIsTxDisabled: jest.fn(),
        setPendingTx: jest.fn(),
        status: "idle" as const,
      }),
    })),
  },
  stateTransition: {
    roundState: jest.mock("@/hooks/stateTransition/useRoundState"),
    permissions: jest.mock("@/hooks/stateTransition/useRoundPermissions"),
  },
};

const queryClient = new QueryClient();

// Type definitions
type RoundState =
  | "AuctionReady"
  | "Open"
  | "Settled"
  | "Auctioning"
  | "FossilReady"
  | "Running";

interface MockModalState {
  show: boolean;
  action: string;
  onConfirm: () => void;
}

interface RoundStateData {
  state: RoundState;
  roundState: RoundState;
  targetTimestamp: number;
  roundDuration: number;
  isAwaitingRoundStateUpdate: boolean;
  isLoading: boolean;
  roundId: string;
  auctionStartDate: string;
  auctionEndDate: string;
  optionSettleDate: string;
  deploymentDate: string;
}

interface VaultStateData {
  vaultAddress: string;
  clientAddress: string;
  isLoading: boolean;
  currentRoundId: string;
  address: string;
  fossilClientAddress: string;
}

interface RenderOptions {
  roundState?: Partial<RoundStateData>;
  vaultState?: Partial<VaultStateData>;
  account?: { address: string | null; status: string };
  transaction?: { pendingTx: boolean };
  permissions?: {
    canStartAuction: boolean;
    canEndAuction: boolean;
    canRequestFossil: boolean;
    canSettleRound: boolean;
  };
  conn?: string;
  vaultActions?: typeof defaultVaultActions;
  fossilStatus?: typeof defaultFossilStatus;
  prevRoundState?: RoundState;
}

// Default test states
const defaultRoundState: RoundStateData = {
  state: "AuctionReady",
  roundState: "AuctionReady",
  targetTimestamp: 0,
  roundDuration: 0,
  isAwaitingRoundStateUpdate: false,
  isLoading: false,
  roundId: "1",
  auctionStartDate: "1000",
  auctionEndDate: "2000",
  optionSettleDate: "3000",
  deploymentDate: "1000",
};

const defaultVaultState: VaultStateData = {
  vaultAddress: "0x123",
  clientAddress: "0x789",
  isLoading: false,
  currentRoundId: "1",
  address: "0x123",
  fossilClientAddress: "0x789",
};

const defaultVaultActions = {
  startAuction: jest.fn(),
  endAuction: jest.fn(),
  settleOptionRound: jest.fn(),
};

const defaultFossilStatus = {
  status: null as string | null,
  error: null,
  setStatusData: jest.fn(),
  isLoading: false,
};

// Test setup function
const renderStateTransition = ({
  roundState = defaultRoundState,
  vaultState = defaultVaultState,
  account = { address: "0x123", status: "connected" },
  transaction = { pendingTx: false },
  permissions = {
    canStartAuction: true,
    canEndAuction: true,
    canRequestFossil: true,
    canSettleRound: true,
  },
  conn = "mock",
  vaultActions = defaultVaultActions,
  fossilStatus = defaultFossilStatus,
  prevRoundState,
}: RenderOptions = {}): { mockSetModalState: jest.Mock } => {
  const mockSetModalState = jest.fn();

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
    selectedRoundState: {
      ...defaultRoundState,
      ...roundState,
    },
  });

  (useAccount as jest.Mock).mockReturnValue({
    account:
      account.status === "connected" ? { address: account.address } : null,
    status: account.status,
  });

  (useTransactionContext as jest.Mock).mockReturnValue({
    pendingTx: transaction.pendingTx ? "0x123" : undefined,
  });

  (useRoundStateTransition as jest.Mock).mockReturnValue({
    roundState: roundState.roundState || roundState.state,
    prevRoundState: prevRoundState || roundState.roundState || roundState.state,
    isLoading: false,
    isAwaitingRoundStateUpdate: roundState.isAwaitingRoundStateUpdate,
    fossilStatus: fossilStatus.status,
  });

  (useRoundPermissions as jest.Mock).mockReturnValue({
    canAuctionStart: permissions.canStartAuction,
    canAuctionEnd: permissions.canEndAuction,
    canRequestFossil: permissions.canRequestFossil,
    canSettleRound: permissions.canSettleRound,
    canSendFossilRequest: permissions.canRequestFossil,
  });

  (useNewContext as jest.Mock).mockReturnValue({ conn });
  (useVaultActions as jest.Mock).mockReturnValue(vaultActions);
  (useFossilStatus as jest.Mock).mockReturnValue(fossilStatus);
  (useHelpContext as jest.Mock).mockReturnValue({
    setContent: jest.fn(),
    setHeader: jest.fn(),
    isHoveringHelpBox: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <StateTransition isPanelOpen={true} setModalState={mockSetModalState} />
    </QueryClientProvider>,
  );

  return { mockSetModalState };
};

// Test suites
describe("StateTransition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe("Component Rendering", () => {
    it("renders state transition button with correct text", () => {
      renderStateTransition({
        roundState: {
          ...defaultRoundState,
          state: "Open",
          roundState: "Open",
        },
      });

      const transitionButton = screen.getByRole("button", {
        name: /start auction/i,
      });
      expect(transitionButton).toBeInTheDocument();
      expect(transitionButton).not.toBeDisabled();
    });

    it("renders nothing for settled rounds", () => {
      renderStateTransition({
        roundState: {
          ...defaultRoundState,
          state: "Settled",
          roundState: "Settled",
        },
      });

      const transitionButton = screen.queryByRole("button");
      expect(transitionButton).not.toBeInTheDocument();
    });

    //it("renders nothing when round IDs don't match", () => {
    //  renderStateTransition({
    //    vaultState: {
    //      ...defaultVaultState,
    //      currentRoundId: "2",
    //    },
    //  });

    //  const transitionButton = screen.queryByRole("button");
    //  expect(transitionButton).not.toBeInTheDocument();
    //});
  });

  describe("State Transitions", () => {
    it("handles auction start transition", async () => {
      const { mockSetModalState } = renderStateTransition({
        roundState: {
          ...defaultRoundState,
          state: "Open",
          roundState: "Open",
        },
        permissions: {
          canStartAuction: true,
          canEndAuction: false,
          canRequestFossil: false,
          canSettleRound: false,
        },
        prevRoundState: "Open",
      });

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Start Auction");

      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "Start Auction",
        onConfirm: expect.any(Function),
      });

      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.startAuction).toHaveBeenCalled();
    });

    it("handles auction end transition", async () => {
      const { mockSetModalState } = renderStateTransition({
        roundState: {
          ...defaultRoundState,
          state: "Auctioning",
          roundState: "Auctioning",
        },
        permissions: {
          canStartAuction: false,
          canEndAuction: true,
          canRequestFossil: false,
          canSettleRound: false,
        },
      });

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("End Auction");

      fireEvent.click(button);

      expect(mockSetModalState).toHaveBeenCalledWith({
        show: true,
        action: "End Auction",
        onConfirm: expect.any(Function),
      });

      const { onConfirm } = mockSetModalState.mock.calls[0][0];
      await act(() => onConfirm());

      expect(defaultVaultActions.endAuction).toHaveBeenCalled();
    });

    //it("handles fossil request", async () => {
    //  const mockSetFossilStatus = jest.fn();
    //  const { mockSetModalState } = renderStateTransition({
    //    roundState: {
    //      ...defaultRoundState,
    //      state: "FossilReady",
    //      roundState: "FossilReady",
    //      targetTimestamp: 3000,
    //      roundDuration: 1000,
    //    },
    //    vaultState: {
    //      ...defaultVaultState,
    //      vaultAddress: "0x123",
    //      fossilClientAddress: "0x789",
    //    },
    //    permissions: {
    //      canStartAuction: false,
    //      canEndAuction: false,
    //      canRequestFossil: true,
    //      canSettleRound: false,
    //    },
    //    conn: "rpc",
    //    fossilStatus: {
    //      ...defaultFossilStatus,
    //      setStatusData: mockSetFossilStatus,
    //    },
    //    prevRoundState: "FossilReady",
    //  });

    //  const button = screen.getByRole("button");
    //  expect(button).toHaveTextContent("Request Fossil");

    //  fireEvent.click(button);

    //  expect(mockSetModalState).toHaveBeenCalledWith({
    //    show: true,
    //    action: "Request Fossil",
    //    onConfirm: expect.any(Function),
    //  });

    //  const { onConfirm } = mockSetModalState.mock.calls[0][0];
    //  await act(() => onConfirm());

    //  expect(global.fetch).toHaveBeenCalledWith("/api/sendFossilRequest", {
    //    method: "POST",
    //    headers: {
    //      "Content-Type": "application/json",
    //    },
    //    body: JSON.stringify({
    //      targetTimestamp: 3000,
    //      roundDuration: 1000,
    //      clientAddress: "0x789",
    //      vaultAddress: "0x123",
    //    }),
    //  });

    //  expect(mockSetFossilStatus).toHaveBeenCalledWith({
    //    status: "Pending",
    //    error: undefined,
    //  });
    //});

    //it("handles round settlement", async () => {
    //  const mockSetFossilStatus = jest.fn();
    //  const fossilStatusValue = { status: "Completed" as const };
    //  const currentTimestamp = 5000; // Set this higher than optionSettleDate + fossilDelay
    //  const optionSettleDate = 2000;
    //  const fossilDelay = 300;
    //  const mockSetModalState = jest.fn();

    //  // Mock the hooks before rendering
    //  (useRoundStateTransition as jest.Mock).mockReturnValue({
    //    roundState: "Running",
    //    prevRoundState: "Running", // Ensure these match
    //    isLoading: false,
    //    isAwaitingRoundStateUpdate: false,
    //    fossilStatus: fossilStatusValue.status,
    //  });

    //  (useFossilStatus as jest.Mock).mockReturnValue({
    //    ...defaultFossilStatus,
    //    ...fossilStatusValue,
    //    setStatusData: mockSetFossilStatus,
    //  });

    //  // Mock Date.now() to return our fixed timestamp
    //  const realDate = Date;
    //  const mockDate = class extends Date {
    //    constructor() {
    //      super();
    //    }
    //    getTime() {
    //      return currentTimestamp * 1000; // Convert to milliseconds
    //    }
    //  };
    //  global.Date = mockDate as DateConstructor;

    //  // Mock useRoundPermissions with the same fossilDelay value
    //  (useRoundPermissions as jest.Mock).mockImplementation(
    //    (timestamp, roundState, delay) => {
    //      const settleTime = Number(roundState?.optionSettleDate) + delay;
    //      return {
    //        canAuctionStart: false,
    //        canAuctionEnd: false,
    //        canRequestFossil: false,
    //        canRoundSettle: timestamp >= settleTime,
    //        canSendFossilRequest: false,
    //      };
    //    },
    //  );

    //  (useAccount as jest.Mock).mockReturnValue({
    //    account: { address: "0x123" },
    //    status: "connected",
    //  });

    //  (useTransactionContext as jest.Mock).mockReturnValue({
    //    pendingTx: undefined,
    //    isTxDisabled: false,
    //    setPendingTx: jest.fn(),
    //    status: "idle" as const,
    //  });

    //  (useVaultState as jest.Mock).mockReturnValue({
    //    vaultState: {
    //      ...defaultVaultState,
    //      currentRoundId: "1",
    //    },
    //    selectedRoundAddress: "0x456",
    //    selectedRoundState: {
    //      ...defaultRoundState,
    //      state: "Running",
    //      roundState: "Running",
    //      roundId: "1",
    //      targetTimestamp: 2000,
    //      roundDuration: 1000,
    //      optionSettleDate: optionSettleDate.toString(),
    //      isAwaitingRoundStateUpdate: false,
    //      isLoading: false,
    //    },
    //  });

    //  (useRoundState as jest.Mock).mockReturnValue({
    //    ...defaultRoundState,
    //    state: "Running",
    //    roundState: "Running",
    //    roundId: "1",
    //    targetTimestamp: 2000,
    //    roundDuration: 1000,
    //    optionSettleDate: optionSettleDate.toString(),
    //    isAwaitingRoundStateUpdate: false,
    //    isLoading: false,
    //  });

    //  render(
    //    <QueryClientProvider client={queryClient}>
    //      <StateTransition
    //        isPanelOpen={true}
    //        setModalState={mockSetModalState}
    //        fossilDelay={fossilDelay}
    //      />
    //    </QueryClientProvider>,
    //  );

    //  // Wait for any state updates
    //  await act(async () => {
    //    // Wait a tick for state updates
    //    await new Promise((resolve) => setTimeout(resolve, 0));
    //  });

    //  const button = screen.getByRole("button");
    //  expect(button).toHaveTextContent("Settle Round");
    //  expect(button).not.toBeDisabled();

    //  fireEvent.click(button);

    //  expect(mockSetModalState).toHaveBeenCalledWith({
    //    show: true,
    //    action: "Settle Round",
    //    onConfirm: expect.any(Function),
    //  });

    //  const { onConfirm } = mockSetModalState.mock.calls[0][0];
    //  await act(() => onConfirm());

    //  expect(defaultVaultActions.settleOptionRound).toHaveBeenCalled();

    //  // Cleanup
    //  global.Date = realDate;
    //});
  });

  describe("Button States", () => {
    it("disables button when no account is connected", () => {
      renderStateTransition({
        account: { address: null, status: "disconnected" },
        roundState: {
          ...defaultRoundState,
          state: "Open",
          roundState: "Open",
        },
      });

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("disables button during pending transactions", () => {
      renderStateTransition({
        transaction: { pendingTx: true },
        roundState: {
          ...defaultRoundState,
          state: "Open",
          roundState: "Open",
        },
      });

      expect(screen.getByRole("button")).toBeDisabled();
    });

    //it("disables button based on permissions", () => {
    //  renderStateTransition({
    //    roundState: {
    //      ...defaultRoundState,
    //      state: "Open",
    //      roundState: "Open",
    //    },
    //    permissions: {
    //      canStartAuction: false,
    //      canEndAuction: false,
    //      canRequestFossil: false,
    //      canSettleRound: false,
    //    },
    //  });

    //  expect(screen.getByRole("button")).toBeDisabled();
    //});

    it("shows pending state during transitions", () => {
      renderStateTransition({
        roundState: {
          ...defaultRoundState,
          state: "AuctionReady",
          roundState: "AuctionReady",
          isAwaitingRoundStateUpdate: true,
        },
        vaultState: {
          ...defaultVaultState,
        },
        permissions: {
          canStartAuction: true,
          canEndAuction: false,
          canRequestFossil: false,
          canSettleRound: false,
        },
        transaction: { pendingTx: true },
        prevRoundState: "Open",
      });

      const button = screen.getByRole("button");
      expect(button).toHaveTextContent("Pending");
      expect(button).toBeDisabled();
    });
  });
});
