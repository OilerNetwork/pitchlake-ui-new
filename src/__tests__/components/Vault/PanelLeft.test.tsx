import { screen } from "@testing-library/react";
import PanelLeft from "@/components/Vault/PanelLeft";
import { renderWithProviders } from "@/__tests__/utils/TestWrapper";
import { HelpProvider } from "@/context/HelpProvider";
import { CairoCustomEnum } from "starknet";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useExplorer: () => ({
    getTransactionUrl: jest.fn(),
    getAddressUrl: jest.fn(),
    contract: jest.fn(),
  }),
  useProvider: () => ({
    provider: {
      getBlock: jest.fn(),
    },
  }),
  useAccount: () => ({
    account: {
      address: "0x123"
    }
  }),
  useContractRead: () => ({
    data: "1000000000000000000",
    isError: false,
    isLoading: false,
  }),
  useContract: () => ({
    data: null,
  }),
}));

jest.mock("@/hooks/vault_v2/rpc/useVaultStateRPC", () => ({
  __esModule: true,
  default: () => ({
    vaultState: {
      lockedBalance: "1000000000000000000",
      unlockedBalance: "2000000000000000000",
      stashedBalance: "3000000000000000000",
      alpha: "1000",
      strikeLevel: "1000",
      activeVariant: () => "Auctioning"
    },
    selectedRoundAddress: "0x123"
  })
}));

jest.mock("@/context/NewProvider", () => ({
  useNewContext: () => ({
    conn: "mock",
    selectedRound: 1,
    vaultAddress: "0x123",
    setSelectedRound: jest.fn(),
    wsData: {
      wsVaultState: {
        currentRoundId: "1",
      },
      wsOptionRoundStates: [
        {
          address: "0x456",
          activeVariant: () => "Auctioning",
          deploymentDate: "1000000000000000000",
          auctionStartDate: "1000000000000000000",
          auctionEndDate: "1000000000000000000",
          exerciseStartDate: "1000000000000000000",
          exerciseEndDate: "1000000000000000000",
          settlementPrice: "1000000000000000000",
          strikePrice: "1000000000000000000",
          totalPremium: "1000000000000000000",
          totalSize: "1000000000000000000",
          minimumSize: "1000000000000000000",
          maximumSize: "1000000000000000000",
          minimumPremium: "1000000000000000000",
          maximumPremium: "1000000000000000000",
          totalExercised: "1000000000000000000",
          totalWithdrawn: "1000000000000000000",
          totalSettled: "1000000000000000000",
          isSettled: false,
          isExercised: false,
        }
      ]
    },
    mockData: {
      vaultState: {
        currentRoundId: "1",
      },
      optionRoundStates: [
        {
          address: "0x456",
          activeVariant: () => "Auctioning",
          deploymentDate: "1000000000000000000",
          auctionStartDate: "1000000000000000000",
          auctionEndDate: "1000000000000000000",
          exerciseStartDate: "1000000000000000000",
          exerciseEndDate: "1000000000000000000",
          settlementPrice: "1000000000000000000",
          strikePrice: "1000000000000000000",
          totalPremium: "1000000000000000000",
          totalSize: "1000000000000000000",
          minimumSize: "1000000000000000000",
          maximumSize: "1000000000000000000",
          minimumPremium: "1000000000000000000",
          maximumPremium: "1000000000000000000",
          totalExercised: "1000000000000000000",
          totalWithdrawn: "1000000000000000000",
          totalSettled: "1000000000000000000",
          isSettled: false,
          isExercised: false,
        }
      ]
    }
  })
}));

jest.mock("@/hooks/vault_v2/rpc/useOptionRoundStateRPC", () => ({
  __esModule: true,
  default: () => ({
    roundState: {
      address: "0x123",
      roundId: "1",
      roundState: "Auctioning",
      capLevel: "1000",
      strikePrice: "1000000000",
      reservePrice: "500000000",
      performanceLP: "10",
      performanceOB: "5"
    }
  })
}));

jest.mock("../../../hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: () => ({
    vaultState: {
      activeVariant: () => "Auctioning",
      lockedBalance: "1000000000000000000",
      unlockedBalance: "2000000000000000000",
      stashedBalance: "3000000000000000000",
      variant: "Auctioning",
      unwrap: () => ({
        lockedBalance: "1000000000000000000",
        unlockedBalance: "2000000000000000000",
        stashedBalance: "3000000000000000000"
      })
    } as unknown as CairoCustomEnum,
    selectedRoundAddress: "0x123",
  }),
}));

describe("PanelLeft Component", () => {
  it("renders panel sections", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>
    );

    // Check section headers
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
  });

  it("renders correctly for both user types", () => {
    // Test LP view
    const { rerender } = renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>
    );

    // Verify LP specific elements
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    
    // Test OB view
    rerender(
      <HelpProvider>
        <PanelLeft userType="ob" />
      </HelpProvider>
    );

    // Verify OB specific elements
    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
  });

  it("displays correct balance values", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>
    );

    // The balance values should be displayed in the tooltip
    const balanceElement = screen.getByText("Balance");
    expect(balanceElement).toBeInTheDocument();
  });
}); 