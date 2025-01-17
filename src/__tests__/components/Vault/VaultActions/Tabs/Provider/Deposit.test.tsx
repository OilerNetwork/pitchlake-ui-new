import { render, screen, fireEvent, act } from "@testing-library/react";
import Deposit from "@/components/Vault/VaultActions/Tabs/Provider/Deposit";

// Mock all external dependencies
jest.mock("@starknet-react/core", () => ({
  useContract: () => ({
    contract: {
      typedv2: () => ({
        connect: jest.fn().mockReturnThis(),
        populateTransaction: {
          approve: jest.fn(),
          deposit: jest.fn()
        }
      })
    }
  }),
  useAccount: () => ({
    account: {
      address: "0x123"
    }
  }),
  useSendTransaction: () => ({
    sendAsync: jest.fn().mockResolvedValue({ transaction_hash: "0x123" })
  })
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: () => ({
    pendingTx: false,
    setPendingTx: jest.fn()
  })
}));

jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: () => ({
    vaultState: {
      address: "0x123",
      ethAddress: "0x456"
    },
    lpState: {
      unlockedBalance: BigInt("1000000000000000000") // 1 ETH
    }
  })
}));

jest.mock("starknet", () => ({
  num: {
    toBigInt: jest.fn(value => BigInt(value))
  }
}));

jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    allowance: BigInt("1000000000000000000"), // 1 ETH
    balance: BigInt("2000000000000000000"), // 2 ETH
  })
}));

describe("Deposit Component", () => {
  const mockShowConfirmation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders with initial state", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);

    // Check if input fields are rendered
    expect(screen.getByLabelText("Enter Amount")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. 5.0")).toBeInTheDocument();

    // Check if deposit button is rendered and disabled initially
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    expect(depositButton).toBeInTheDocument();
    expect(depositButton).toBeDisabled();

    // Check if unlocked balance is displayed
    expect(screen.getByText("1.000 ETH")).toBeInTheDocument();
  });

  it("switches between 'For Me' and 'For Someone Else' tabs", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);

    // Click "For Someone Else" tab
    fireEvent.click(screen.getByText("For Someone Else"));

    // Check if beneficiary address input appears
    expect(screen.getByLabelText("Enter Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Depositor's Address")).toBeInTheDocument();

    // Click "For Me" tab
    fireEvent.click(screen.getByText("For Me"));

    // Check if beneficiary address input disappears
    expect(screen.queryByLabelText("Enter Address")).not.toBeInTheDocument();
  });

  it("enables deposit button when valid amount is entered", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "1.0" } });

    const depositButton = screen.getByRole("button", { name: "Deposit" });
    expect(depositButton).not.toBeDisabled();
  });

  it("disables deposit button when amount exceeds balance", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "3.0" } }); // Balance is 2 ETH

    const depositButton = screen.getByRole("button", { name: "Deposit" });
    expect(depositButton).toBeDisabled();
    expect(screen.getByText(/Exceeds balance/)).toBeInTheDocument();
  });

  it("validates beneficiary address when depositing for someone else", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);
    
    // Switch to "For Someone Else" tab
    fireEvent.click(screen.getByText("For Someone Else"));
    
    // Enter valid amount
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "1.0" } });
    
    // Enter valid address
    const addressInput = screen.getByPlaceholderText("Depositor's Address");
    fireEvent.change(addressInput, { target: { value: "0x" + "1".repeat(64) } });
    
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    expect(depositButton).not.toBeDisabled();
  });

  it("shows confirmation modal when deposit button is clicked", () => {
    render(<Deposit showConfirmation={mockShowConfirmation} />);
    
    // Enter valid amount
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "1.0" } });
    
    // Click deposit button
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    fireEvent.click(depositButton);
    
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Deposit",
      expect.anything(),
      expect.any(Function)
    );
  });

  it("calls approve and deposit when confirmation is confirmed", async () => {
    const mockSendAsync = jest.fn().mockResolvedValue({ transaction_hash: "0x123" });
    jest.spyOn(require("@starknet-react/core"), "useSendTransaction").mockReturnValue({
      sendAsync: mockSendAsync
    });

    render(<Deposit showConfirmation={mockShowConfirmation} />);
    
    // Enter valid amount
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "1.0" } });
    
    // Click deposit button
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    fireEvent.click(depositButton);
    
    // Get the onConfirm callback that was passed to showConfirmation
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    
    // Call the onConfirm callback wrapped in act
    await act(async () => {
      await onConfirm();
    });
    
    // Verify that sendAsync was called
    expect(mockSendAsync).toHaveBeenCalled();
  });

  it("saves and loads amount from localStorage", async () => {
    // Set initial value in localStorage
    localStorage.setItem("depositAmountWei", "1.5");

    render(<Deposit showConfirmation={mockShowConfirmation} />);

    // Check if amount is loaded from localStorage
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    expect(amountInput).toHaveValue(1.5);

    // Change amount and check if it's saved to localStorage
    await act(async () => {
      fireEvent.change(amountInput, { target: { value: "2.0" } });
    });
    
    expect(localStorage.getItem("depositAmountWei")).toBe("2.0");
  });
}); 