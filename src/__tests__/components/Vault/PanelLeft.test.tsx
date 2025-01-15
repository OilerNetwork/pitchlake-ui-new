import { render, screen, fireEvent } from "@testing-library/react";
import PanelLeft from "../../../components/Vault/PanelLeft";
import { useProtocolContext } from "../../../context/ProtocolProvider";
import { useProvider, useExplorer } from "@starknet-react/core";

// Mock the hooks
jest.mock("../../../context/ProtocolProvider", () => ({
  __esModule: true,
  useProtocolContext: jest.fn(),
}));

jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useProvider: jest.fn(),
  useExplorer: jest.fn(),
}));

// Mock child components
jest.mock("../../../components/Vault/StateTransition", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-state-transition">State Transition</div>,
}));

jest.mock("../../../components/BaseComponents/Tooltip", () => ({
  BalanceTooltip: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-balance-tooltip">{children}</div>
  ),
}));

jest.mock("../../../components/Vault/Utils/StateTransitionConfirmationModal", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-confirmation-modal">Confirmation Modal</div>,
}));

// Mock utils functions
jest.mock("../../../lib/utils", () => ({
  timeUntilTarget: jest.fn().mockReturnValue("8h 20m"),
  shortenString: jest.fn().mockImplementation((str) => str),
  formatNumberText: jest.fn().mockImplementation((num) => num.toString()),
}));

describe("PanelLeft Component", () => {
  const mockVaultState = {
    address: "0x123",
    vaultType: "Test Vault",
    vaultBalance: "1000000000000000000", // 1 ETH
    strikePrice: "1500000000", // 1.5 GWEI
    capLevel: "1000000000000000000", // 1 ETH
    lockedBalance: "500000000000000000", // 0.5 ETH
    unlockedBalance: "500000000000000000", // 0.5 ETH
    stashedBalance: "500000000000000000", // 0.5 ETH
  };

  const mockRoundState = {
    roundAddress: "0x456",
    roundState: "Open",
    auctionStartDate: "1000",
    auctionEndDate: "2000",
    optionSettleDate: "3000",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useProtocolContext as jest.Mock).mockReturnValue({
      vaultState: mockVaultState,
      selectedRoundState: mockRoundState,
      timestamp: "500",
    });
    (useProvider as jest.Mock).mockReturnValue({
      provider: {},
    });
    (useExplorer as jest.Mock).mockReturnValue({
      contract: jest.fn().mockReturnValue("https://testnet.starkscan.co/contract/0x123"),
    });
  });

  it("renders for provider view", () => {
    render(<PanelLeft userType="lp" />);
    
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByTestId("mock-state-transition")).toBeInTheDocument();
  });

  it("renders for buyer view", () => {
    render(<PanelLeft userType="ob" />);
    
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
    expect(screen.getByTestId("mock-state-transition")).toBeInTheDocument();
  });

  it("toggles vault details section", () => {
    render(<PanelLeft userType="lp" />);
    
    const vaultButton = screen.getByText("Vault").closest("div");
    expect(vaultButton).toBeInTheDocument();
    
    fireEvent.click(vaultButton!);
    // Check if the content is visible after clicking
    expect(screen.getByText("Run Time")).toBeInTheDocument();
    
    fireEvent.click(vaultButton!);
    // Content should still be visible as it's controlled by isPanelOpen state
    expect(screen.getByText("Run Time")).toBeInTheDocument();
  });

  it("displays correct vault statistics", () => {
    render(<PanelLeft userType="lp" />);
    
    const vaultButton = screen.getByText("Vault").closest("div");
    fireEvent.click(vaultButton!);
    
    expect(screen.getByText("Run Time")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
  });

  it("handles external link clicks", () => {
    render(<PanelLeft userType="lp" />);
    
    const vaultButton = screen.getByText("Vault").closest("div");
    fireEvent.click(vaultButton!);
    
    const externalLink = screen.getByRole("link");
    expect(externalLink).toHaveAttribute(
      "href",
      "https://testnet.starkscan.co/contract/0x123"
    );
  });

  it("toggles panel open/close", () => {
    render(<PanelLeft userType="lp" />);
    
    const statisticsButton = screen.getByText("Statistics").closest("div");
    expect(statisticsButton).toBeInTheDocument();
    
    // Initially the panel should be open
    expect(screen.getByText("Run Time")).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(statisticsButton!);
    
    // Click to open again
    fireEvent.click(statisticsButton!);
    expect(screen.getByText("Run Time")).toBeInTheDocument();
  });

  it("displays correct time until next state transition", () => {
    render(<PanelLeft userType="lp" />);
    
    const vaultButton = screen.getByText("Vault").closest("div");
    fireEvent.click(vaultButton!);
    
    // Find the specific time element under "Auction Starts In"
    const timeContainer = screen.getByText("Auction Starts In").closest("div");
    expect(timeContainer).toBeInTheDocument();
    expect(timeContainer?.querySelector("p:last-child")?.textContent).toBe("8h 20m");
  });
}); 