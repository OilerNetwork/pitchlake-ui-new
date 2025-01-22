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
  default: () => <div className="state-transition">State Transition</div>,
}));

jest.mock("../../../components/BaseComponents/Tooltip", () => ({
  BalanceTooltip: ({ children }: { children: React.ReactNode }) => (
    <div className="balance-tooltip">{children}</div>
  ),
}));

jest.mock("../../../components/Vault/Utils/StateTransitionConfirmationModal", () => ({
  __esModule: true,
  default: () => <div className="confirmation-modal">Confirmation Modal</div>,
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

  it("renders panel sections and handles interactions", () => {
    const { container } = render(<PanelLeft userType="lp" />);
    
    // Check sections
    const sections = container.querySelectorAll(".panel-section");
    expect(sections).toHaveLength(3);
    
    // Check section headers
    const headers = ["Statistics", "Vault", "State Transition"];
    headers.forEach(header => {
      expect(screen.getByText(header).closest(".panel-section-header")).toBeInTheDocument();
    });

    // Test vault section expansion
    const vaultButton = screen.getByText("Vault").closest(".panel-section-header");
    fireEvent.click(vaultButton!);
    
    // Check expanded content
    expect(screen.getByText("Run Time")).toBeInTheDocument();
    expect(screen.getByText("Address")).toBeInTheDocument();
    
    // Check external link
    const externalLink = screen.getByRole("link");
    expect(externalLink).toHaveAttribute(
      "href",
      "https://testnet.starkscan.co/contract/0x123"
    );
    
    // Check time display
    const timeContainer = screen.getByText("Auction Starts In").closest(".time-container");
    expect(timeContainer).toBeInTheDocument();
    expect(timeContainer?.querySelector(".time-value")?.textContent).toBe("8h 20m");
  });

  it("renders correctly for both user types", () => {
    // Test LP view
    const { container: lpContainer } = render(<PanelLeft userType="lp" />);
    expect(lpContainer.querySelector(".panel-left-lp")).toBeInTheDocument();
    
    // Test OB view
    const { container: obContainer } = render(<PanelLeft userType="ob" />);
    expect(obContainer.querySelector(".panel-left-ob")).toBeInTheDocument();
  });
}); 