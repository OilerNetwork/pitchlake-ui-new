import { render, screen, fireEvent } from "@testing-library/react";
import QueueWithdrawal from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/QueueWithdrawal";
import { useAccount } from "@starknet-react/core";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useHelpContext } from "@/context/HelpProvider";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
}));

jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn(),
}));

jest.mock("@/context/HelpProvider", () => ({
  useHelpContext: jest.fn(),
}));

describe("QueueWithdrawal", () => {
  const mockShowConfirmation = jest.fn();
  const mockQueueWithdrawal = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock values
    (useAccount as jest.Mock).mockReturnValue({
      account: { address: "0x123" },
    });

    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultActions: { queueWithdrawal: mockQueueWithdrawal },
      lpState: { queuedBps: "0" },
    });

    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: false,
    });

    (useHelpContext as jest.Mock).mockReturnValue({
      setHelpContent: jest.fn(),
      clearHelpContent: jest.fn(),
    });
  });

  it("renders with initial state", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByLabelText("Choose Percentage")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("updates percentage when slider is moved", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(slider).toHaveValue("50");
  });

  it("disables queue button when percentage is unchanged", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("enables queue button when percentage is changed", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    expect(screen.getByRole("button", { name: "Queue" })).toBeEnabled();
  });

  it("disables queue button when transaction is pending", () => {
    (useTransactionContext as jest.Mock).mockReturnValue({
      pendingTx: true,
    });

    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("disables queue button when no account is connected", () => {
    (useAccount as jest.Mock).mockReturnValue({ account: undefined });

    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    expect(screen.getByRole("button", { name: "Queue" })).toBeDisabled();
  });

  it("shows confirmation modal with correct percentage values", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    const queueButton = screen.getByRole("button", { name: "Queue" });
    fireEvent.click(queueButton);

    expect(mockShowConfirmation).toHaveBeenCalled();
  });

  it("calls queueWithdrawal with correct BPS when confirmation is confirmed", () => {
    render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "50" } });

    const queueButton = screen.getByRole("button", { name: "Queue" });
    fireEvent.click(queueButton);

    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    onConfirm();

    // 50% should be converted to 5000 BPS
    expect(mockQueueWithdrawal).toHaveBeenCalledWith({ bps: 5000 });
  });

  it("updates state when lpState.queuedBps changes", () => {
    const { rerender } = render(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    // Update lpState mock with new queuedBps
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultActions: { queueWithdrawal: mockQueueWithdrawal },
      lpState: { queuedBps: "5000" },
    });

    rerender(<QueueWithdrawal showConfirmation={mockShowConfirmation} />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("50"); // 5000 BPS = 50%
  });
}); 