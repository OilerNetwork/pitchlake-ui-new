import { render, screen, fireEvent, act } from "@testing-library/react";
import Deposit from "@/components/Vault/VaultActions/Tabs/Provider/Deposit";
import { HelpProvider } from "@/context/HelpProvider";

// Mock all external dependencies
const mockwriteAsync = jest.fn().mockResolvedValue({ transaction_hash: "0x123" });

jest.mock("@starknet-react/core", () => ({
  useContract: () => ({
    contract: {
      typedv2: () => ({
        connect: jest.fn().mockReturnThis(),
        populateTransaction: {
          approve: jest.fn().mockResolvedValue({ calldata: [] }),
          deposit: jest.fn().mockResolvedValue({ calldata: [] })
        }
      })
    }
  }),
  useAccount: () => ({
    account: {
      address: "0x123"
    }
  }),
  useContractWrite: () => ({
    writeAsync: mockwriteAsync
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

  it("handles deposit flow correctly", async () => {
    render(
      <HelpProvider>
        <Deposit showConfirmation={mockShowConfirmation} />
      </HelpProvider>
    );

    // Enter valid deposit amount
    const amountInput = screen.getByPlaceholderText("e.g. 5.0");
    fireEvent.change(amountInput, { target: { value: "1.0" } });

    // Initiate deposit
    const depositButton = screen.getByRole("button", { name: "Deposit" });
    fireEvent.click(depositButton);

    // Verify confirmation modal was shown
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Deposit",
      expect.anything(),
      expect.any(Function)
    );

    // Complete deposit flow
    const onConfirm = mockShowConfirmation.mock.calls[0][2];
    await act(async () => {
      await onConfirm();
    });

    expect(mockwriteAsync).toHaveBeenCalled();
  });
}); 