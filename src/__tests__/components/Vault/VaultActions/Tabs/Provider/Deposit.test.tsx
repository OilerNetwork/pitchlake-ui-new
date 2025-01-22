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

  it("renders deposit form with correct states and handles interactions", () => {
    const { container, rerender } = render(<Deposit showConfirmation={mockShowConfirmation} />);

    // Check initial render
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    expect(amountInput).toBeInTheDocument();
    expect(depositButton).toBeInTheDocument();
    expect(depositButton).toBeDisabled(); // Initially disabled with no amount

    // Test valid amount
    fireEvent.change(amountInput, { target: { value: "1.0" } });
    expect(depositButton).toBeEnabled();
    expect(localStorage.getItem("depositAmountWei")).toBe("1.0");

    // Test amount exceeding balance
    fireEvent.change(amountInput, { target: { value: "3.0" } }); // Balance is 2 ETH
    expect(depositButton).toBeDisabled();
    expect(screen.getByText(/Exceeds balance/)).toBeInTheDocument();

    // Test depositing for someone else
    fireEvent.click(screen.getByText("For Someone Else"));
    const addressInput = screen.getByPlaceholderText("Depositor's Address");
    expect(addressInput).toBeInTheDocument();

    // Test with valid amount and address
    fireEvent.change(amountInput, { target: { value: "1.0" } });
    fireEvent.change(addressInput, { target: { value: "0x" + "1".repeat(64) } });
    expect(depositButton).toBeEnabled();

    // Test confirmation modal
    fireEvent.click(depositButton);
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Deposit",
      expect.anything(),
      expect.any(Function)
    );

    // Test transaction execution
    const mockSendAsync = jest.fn().mockResolvedValue({ transaction_hash: "0x123" });
    jest.spyOn(require("@starknet-react/core"), "useSendTransaction").mockReturnValue({
      sendAsync: mockSendAsync
    });

    // Get and call the onConfirm callback
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    act(() => {
      onConfirm();
    });
    expect(mockSendAsync).toHaveBeenCalled();
  });
}); 