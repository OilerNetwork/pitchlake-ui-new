import React from "react";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import EditBid from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";
import { renderWithProviders } from "@/__tests__/utils/TestWrapper";
import { useContract, useContractWrite } from "@starknet-react/core";
import { num } from "starknet";

// Mock utils
jest.mock("ethers", () => ({
  parseEther: jest.fn((value) => value),
  formatEther: jest.fn((value) => value.toString()),
  formatUnits: jest.fn().mockImplementation((value, unit) => {
    if (unit === "gwei") {
      return "1"; // Current bid price in GWEI
    }
    return "0";
  }),
  parseUnits: jest.fn().mockImplementation((value, unit) => {
    if (unit === "gwei") {
      return BigInt(Math.floor(Number(value) * 1e9)); // Convert to WEI
    }
    return BigInt(value);
  }),
}));

const mockWriteAsync = jest
  .fn()
  .mockResolvedValue({ transaction_hash: "0x123" });

// Mock all required hooks
const mockHooks = {
  useAccount: () => ({
    account: "0x789",
  }),
  useTransactionContext: () => ({
    pendingTx: null,
    setPendingTx: jest.fn(),
  }),
  useTimeContext: () => ({
    timestamp: "1234567890",
  }),
  useERC20: () => ({
    allowance: "1000000000000000000",
    balance: "2000000000000000000",
  }),
  useVaultState: () => ({
    vaultState: {
      ethAddress: "0x123",
    },
    selectedRoundAddress: "0x456",
  }),
  useRoundState: () => ({
    address: "0x456",
    auctionEndDate: "9999999999",
  }),
  useContract: () => ({
    contract: {
      typedv2: jest.fn().mockReturnValue({
        connect: jest.fn(),
        populateTransaction: {
          approve: jest.fn(),
          update_bid: jest.fn(),
        },
      }),
    },
  }),
  useContractWrite: () => ({
    writeAsync: mockWriteAsync,
  }),
};

// Mock all hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: () => mockHooks.useAccount(),
  useContractWrite: () => mockHooks.useContractWrite(),
  useProvider: () => ({ provider: {} }),
  useContract: () => mockHooks.useContract(),
}));

jest.mock("@/context/TransactionProvider", () => ({
  useTransactionContext: () => mockHooks.useTransactionContext(),
}));

jest.mock("@/hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: () => mockHooks.useERC20(),
}));

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: () => mockHooks.useVaultState(),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: () => mockHooks.useRoundState(),
}));

jest.mock("@/context/TimeProvider", () => ({
  useTimeContext: () => mockHooks.useTimeContext(),
}));

// Helper function to setup tests
const setupTest = (overrides = {}) => {
  const defaultProps = {
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    showConfirmation: jest.fn((header, action, onConfirm) => {
      onConfirm();
    }),
    onConfirm: jest.fn(),
    bidToEdit: {
      item: {
        amount: "100",
        price: "1000000000", // 1 GWEI
        bid_id: "1",
      },
    },
  };

  const props = { ...defaultProps, ...overrides };
  const utils = renderWithProviders(<EditBid {...props} />);

  return {
    ...utils,
    props,
    priceInput: screen.getByPlaceholderText("e.g. 1"),
    editButton: screen.getByRole("button", { name: /edit bid/i }),
  };
};

describe("EditBid Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("validates new price and updates error state", () => {
    const { priceInput, editButton } = setupTest();

    // Test lower price
    fireEvent.change(priceInput, { target: { value: "0.5" } });
    expect(screen.getByText("Bid price must increase")).toBeInTheDocument();
    expect(editButton).toBeDisabled();

    // Test valid price
    fireEvent.change(priceInput, { target: { value: "2" } });
    expect(
      screen.queryByText("Bid price must increase"),
    ).not.toBeInTheDocument();
    expect(editButton).not.toBeDisabled();
  });

  it("handles bid update flow correctly", async () => {
    const { priceInput, editButton, props } = setupTest();

    fireEvent.change(priceInput, { target: { value: "2" } });
    await waitFor(() => {
      expect(editButton).not.toBeDisabled();
    });

    fireEvent.click(editButton);

    expect(props.showConfirmation).toHaveBeenCalledWith(
      "Update Bid",
      expect.anything(),
      expect.any(Function),
    );

    await waitFor(() => {
      expect(mockWriteAsync).toHaveBeenCalled();
    });
  });

  it("saves and loads price from localStorage", () => {
    localStorage.setItem("editBidPriceGwei", "2.5");
    const { priceInput } = setupTest();

    expect((priceInput as HTMLInputElement).value).toBe("2.5");

    fireEvent.change(priceInput, { target: { value: "3.0" } });
    expect(localStorage.getItem("editBidPriceGwei")).toBe("3.0");
  });

  it("disables button when auction has ended", () => {
    mockHooks.useRoundState = () => ({
      address: "0x456",
      auctionEndDate: "1000000000", // Past date
    });

    const { priceInput, editButton } = setupTest();
    fireEvent.change(priceInput, { target: { value: "2" } });

    expect(screen.getByText("Auction ended")).toBeInTheDocument();
    expect(editButton).toBeDisabled();
  });

  it("cleans up localStorage on successful bid update", async () => {
    mockHooks.useRoundState = () => ({
      address: "0x456",
      auctionEndDate: "9999999999", // Future date
    });

    localStorage.setItem("editBidPriceGwei", "2.0");
    const { editButton, priceInput } = setupTest();

    // Set a valid price to enable the button
    fireEvent.change(priceInput, { target: { value: "2.0" } });
    await waitFor(() => {
      expect(editButton).not.toBeDisabled();
    });

    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockWriteAsync).toHaveBeenCalled();
    });

    await waitFor(
      () => {
        expect(localStorage.getItem("editBidPriceGwei")).toBeNull();
      },
      { timeout: 4000 },
    );
  });
});

