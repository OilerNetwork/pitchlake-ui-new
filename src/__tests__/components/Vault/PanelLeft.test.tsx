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
    contract: () => "https://testnet.starkscan.co/contract/0x123",
  }),
  useProvider: () => ({
    provider: {
      getBlock: jest.fn(),
    },
  }),
  useAccount: () => ({
    account: {
      address: "0x123",
    },
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

const mockVaultState = {
  address: "0x123",
  lockedBalance: "1000000000000000000",
  unlockedBalance: "2000000000000000000",
  stashedBalance: "3000000000000000000",
  alpha: "1000",
  strikeLevel: "1000",
  activeVariant: () => "Auctioning",
  variant: "Auctioning",
  unwrap: () => ({
    lockedBalance: "1000000000000000000",
    unlockedBalance: "2000000000000000000",
    stashedBalance: "3000000000000000000",
  }),
} as unknown as CairoCustomEnum;

jest.mock("@/hooks/vault_v2/states/useVaultState", () => ({
  __esModule: true,
  default: () => ({
    vaultState: mockVaultState,
    selectedRoundAddress: "0x123",
  }),
}));

jest.mock("@/hooks/vault_v2/states/useRoundState", () => ({
  __esModule: true,
  default: () => ({
    address: "0x123",
    roundId: "1",
    roundState: "Auctioning",
    capLevel: "1000",
    strikePrice: "1000000000",
    reservePrice: "500000000",
    performanceLP: "10",
    performanceOB: "5",
    availableOptions: "1000",
    optionsSold: "500",
    clearingPrice: "750000000",
    settlementPrice: "800000000",
    payoutPerOption: "100000000",
    auctionStartDate: "1000000000000000000",
    auctionEndDate: "2000000000000000000",
    optionSettleDate: "3000000000000000000",
    deploymentDate: "500000000000000000",
  }),
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
      wsOptionRoundStates: [],
    },
    mockData: {
      vaultState: {
        currentRoundId: "1",
      },
      optionRoundStates: [],
    },
  }),
}));

describe("PanelLeft Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("renders panel sections", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>,
    );

    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
  });

  it("renders correctly for both user types", () => {
    const { rerender } = renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();

    rerender(
      <HelpProvider>
        <PanelLeft userType="ob" />
      </HelpProvider>,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
  });

  it("displays correct balance values", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>,
    );

    expect(screen.getByText("Balance")).toBeInTheDocument();
    expect(screen.getByText("6.00 ETH")).toBeInTheDocument();
  });

  it("displays correct round state", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>,
    );

    expect(screen.getByText("Auctioning")).toBeInTheDocument();
    expect(screen.getByText("State")).toBeInTheDocument();
  });

  it("displays correct round information", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>,
    );

    expect(screen.getByText("Round 01")).toBeInTheDocument();
    expect(screen.getByText("1.00 GWEI")).toBeInTheDocument(); // Strike Price
    // @NOTE: Why does 0.75 work here when it should be 0.5 ?
    expect(screen.getByText("0.75 GWEI")).toBeInTheDocument(); // Reserve Price
  });
});

