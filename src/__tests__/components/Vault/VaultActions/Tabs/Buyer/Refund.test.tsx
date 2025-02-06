import { render, screen, fireEvent } from "@testing-library/react";
import Refund from "@/components/Vault/VaultActions/Tabs/Buyer/Refund";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useOBState from "@/hooks/vault_v2/states/useOBState";
import useOptionRoundActions from "@/hooks/vault_v2/actions/useOptionRoundActions";
import { useNewContext } from "@/context/NewProvider";
import { useHelpContext } from "@/context/HelpProvider";

// Mock all hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  ...jest.requireActual("@/__tests__/mocks/starknet-react"),
}));

jest.mock("@/context/TransactionProvider", () => ({
  __esModule: true,
  useTransactionContext: jest.fn(),
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="transaction-provider">{children}</div>,
}));

jest.mock("@/context/HelpProvider", () => ({
  __esModule: true,
  useHelpContext: jest.fn(),
  HelpProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="help-provider">{children}</div>,
}));

jest.mock("@/context/NewProvider", () => ({
  __esModule: true,
  useNewContext: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/states/useOBState", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/vault_v2/actions/useOptionRoundActions", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <div data-testid="help-provider">
      <div data-testid="transaction-provider">
        {ui}
      </div>
    </div>
  );
};

describe("Refund Component", () => {
  const mockShowConfirmation = jest.fn();
  const mockRefundUnusedBids = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAccount
    (useAccount as jest.Mock).mockReturnValue({
      address: "0x123",
      account: { address: "0x123" },
      status: "connected"
    });

    // Mock useVaultState
    (useVaultState as jest.Mock).mockReturnValue({
      selectedRoundAddress: "0x456",
      roundState: "Auctioning",
      isLoading: false
    });

    // Mock useOBState
    (useOBState as jest.Mock).mockReturnValue({
      refundableOptions: "1000000000000000000", // 1 ETH
      hasMinted: false,
      isLoading: false
    });

    // Mock useOptionRoundActions
    (useOptionRoundActions as jest.Mock).mockReturnValue({
      refundUnusedBids: mockRefundUnusedBids,
      isLoading: false
    });

    // Mock useTransactionContext
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
      setModalState: jest.fn()
    });

    // Mock useHelpContext
    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn()
    });

    // Mock useNewContext
    (useNewContext as jest.Mock).mockReturnValue({
      conn: "mock",
      wsData: {
        wsVaultState: {
          currentRoundId: "5",
          address: "0x123",
          roundState: "Auctioning"
        }
      },
      mockData: {
        vaultState: {
          currentRoundId: "5",
          address: "0x123",
          roundState: "Auctioning"
        }
      }
    });
  });

  it("renders with initial state", () => {
    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    expect(screen.getByText(/1 ETH/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Refund/i })).toBeEnabled();
  });

  it("disables button when account is not connected", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: null });

    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: /Refund/i })).toBeDisabled();
  });

  it("disables button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: /Refund/i })).toBeDisabled();
  });

  it("disables button when refundable balance is 0", () => {
    (useOBState as jest.Mock).mockReturnValue({
      refundableOptions: "0",
      hasMinted: false,
    });

    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: /Refund/i })).toBeDisabled();
  });

  it("disables button when options have been minted", () => {
    (useOBState as jest.Mock).mockReturnValue({
      refundableOptions: "1000000000000000000",
      hasMinted: true,
      isLoading: false
    });

    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    const button = screen.getByRole("button", { name: /Refund/i });
    expect(button).toBeDisabled();
  });

  it("shows confirmation modal when refund button is clicked", () => {
    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    fireEvent.click(screen.getByRole("button", { name: /Refund/i }));

    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Refund",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls refundUnusedBids when confirmation is confirmed", async () => {
    renderWithProviders(<Refund showConfirmation={mockShowConfirmation} />);

    fireEvent.click(screen.getByRole("button", { name: /Refund/i }));

    // Get and call the onConfirm function
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await onConfirm();

    expect(mockRefundUnusedBids).toHaveBeenCalledWith({
      optionBuyer: "0x123",
    });
  });
});
