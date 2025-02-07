import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceBid from "@/components/Vault/VaultActions/Tabs/Buyer/PlaceBid";
import { TestWrapper } from "../../../../../utils/TestWrapper";
import { useNewContext } from "@/context/NewProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useAccount, useContractRead, useContractWrite } from "@starknet-react/core";

// Mock child components
jest.mock("@/components/Vault/Utils/InputField", () => {
  return function MockInputField({ label, value, onChange, placeholder }: any) {
    return (
      <input
        data-testid="input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };
});
// Mock the hooks
jest.mock("@/context/NewProvider", () => ({
  useNewContext: jest.fn().mockReturnValue({
    conn: "mock",
    selectedRound: "5",
    vaultAddress: "0x123",
    setSelectedRound: jest.fn(),
    wsData: {
      wsVaultState: {
        currentRoundId: "5",
        address: "0x123",
        ethAddress: "0x456",
        roundState: "Auctioning"
      },
      wsOptionBuyerStates: [{
        address: "0x789",
        roundAddress: "0x456",
        mintableOptions: "1000",
        refundableOptions: "0",
        bids: [],
        totalOptions: "0",
        payoutBalance: "0"
      }]
    },
    mockData: {
      vaultState: {
        currentRoundId: "5",
        address: "0x123",
        ethAddress: "0x456",
        roundState: "Auctioning"
      },
      optionRoundStates: {
        "5": {
          address: "0x456",
          roundId: "5",
          roundState: "Auctioning",
          availableOptions: "1000",
          reservePrice: "1",
          auctionEndDate: "9999999999"
        }
      },
      optionBuyerStates: [{
        address: "0x789",
        roundAddress: "0x456",
        mintableOptions: "1000",
        refundableOptions: "0",
        bids: [],
        totalOptions: "0",
        payoutBalance: "0"
      }]
    }
  })
}));

// Mock useRoundState hook
jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    address: "0x456",
    roundId: "5",
    roundState: "Auctioning",
    availableOptions: "1000",
    reservePrice: "1",
    auctionEndDate: "9999999999"
  })
}));

// Mock useERC20 hook
jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    allowance: "1000000000000000000",
    balance: "1000000000000000000"
  })
}));

// Mock useTimeContext
jest.mock("@/context/TimeProvider", () => ({
  useTimeContext: jest.fn().mockReturnValue({
    timestamp: 1000 // Set this to a time before auctionEndDate
  })
}));

// Mock useTransactionContext
jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: jest.fn().mockReturnValue({
    pendingTx: false,
    setPendingTx: jest.fn()
  })
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    vaultState: {
      address: "0x123",
      ethAddress: "0x456"
    },
    selectedRoundAddress: "0x456"
  })
}));

// Mock useAccount and other starknet hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn().mockReturnValue({
    account: { address: "0x789" },
    address: "0x789"
  }),
  useContractWrite: jest.fn().mockReturnValue({
    writeAsync: jest.fn()
  }),
  useContract: jest.fn().mockReturnValue({
    contract: null
  }),
  useContractRead: jest.fn().mockImplementation(({ functionName }: { functionName: string }) => {
    const mockData: Record<string, string> = {
      get_alpha: "1000000000000000000",
      get_strike_level: "1000000000000000000",
      get_eth_address: "0x456",
      get_fossil_client_address: "0x789",
      get_current_round_id: "5",
      get_locked_balance: "1000000000000000000",
      get_unlocked_balance: "1000000000000000000",
      get_stashed_balance: "1000000000000000000",
      get_queued_bps: "1000000000000000000",
      get_round_1_address: "0x456",
      get_deployment_date: "1000000000",
      get_selected_round_address: "0x456",
      get_current_round_address: "0x456",
      default: "0x123"
    };
    return { data: mockData[functionName] || mockData.default };
  }),
}));

jest.mock("@/components/Vault/Utils/ActionButton", () => ({
  __esModule: true,
  default: ({ onClick, disabled, text }: any) => (
    <button 
      className="action-button w-full font-semibold text-[14px] py-3 rounded-md bg-[#F5EBB8] text-[#121212]"
      onClick={onClick} 
      disabled={disabled}
    >
      {text}
    </button>
  ),
}));

describe("PlaceBid", () => {
  const mockShowConfirmation = jest.fn();
  const mockWriteAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    // Mock useContractWrite
    (useContractWrite as jest.Mock).mockReturnValue({
      writeAsync: mockWriteAsync
    });
  });

  it("handles bid submission flow", () => {
    const { container } = render(
      <TestWrapper>
        <PlaceBid showConfirmation={mockShowConfirmation} />
      </TestWrapper>
    );

    // Enter valid bid details
    const amountInput = screen.getByPlaceholderText("e.g. 5000");
    const priceInput = screen.getByPlaceholderText("e.g. 0.3");
    
    fireEvent.change(amountInput, { target: { value: "100" } });
    fireEvent.change(priceInput, { target: { value: "2" } });

    // Submit bid
    const bidButton = container.querySelector('.action-button');
    expect(bidButton).toBeInTheDocument();
    expect(bidButton).not.toBeDisabled();
    fireEvent.click(bidButton!);

    // Verify confirmation dialog is shown
    expect(mockShowConfirmation).toHaveBeenCalledWith(
      "Bid",
      expect.anything(),
      expect.any(Function)
    );
  });
}); 