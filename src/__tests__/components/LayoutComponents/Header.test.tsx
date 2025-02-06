import { render, screen, fireEvent } from "@testing-library/react";
import Header from "../../../components/LayoutComponents/Header";
import useIsMobile from "../../../hooks/window/useIsMobile";
import { useRouter } from "next/navigation";
import useERC20 from "@/hooks/erc20/useERC20";
import useAccountBalances from "@/hooks/vault/state/useAccountBalances";
import { useAccount, useConnect, useDisconnect, useNetwork } from "@starknet-react/core";
import { useHelpContext } from "@/context/HelpProvider";
import { useUiContext } from "@/context/UiProvider";

// Mock SVG imports first
jest.mock("@/../public/logo_full.svg", () => "logo_full");
jest.mock("@/../public/login.svg", () => "login");
jest.mock("@/../public/braavos.svg", () => "braavos");
jest.mock("@/../public/argent.svg", () => "argent");
jest.mock("@/../public/keplr.svg", () => "keplr");
jest.mock("@/../public/avatar.svg", () => "avatar");

// Mock next/image with a function that returns the component
jest.mock("next/image", () => {
  const MockImage = ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  );
  MockImage.displayName = 'Image';
  return MockImage;
});

// Mock hooks
jest.mock("@starknet-react/core", () => ({
  useAccount: jest.fn(),
  useConnect: jest.fn(),
  useDisconnect: jest.fn(),
  useNetwork: jest.fn()
}));

jest.mock("../../../hooks/window/useIsMobile");
jest.mock("../../../context/TransactionProvider");
jest.mock("next/navigation");
jest.mock("@/hooks/erc20/useERC20");
jest.mock("@/hooks/vault/state/useAccountBalances");
jest.mock("@/context/HelpProvider");
jest.mock("@/context/UiProvider");

interface MockOverrides {
  mockTime?: boolean;
  conn?: string;
  timestamp?: number;
  isConnected?: boolean;
}

const mockHooks = (overrides: MockOverrides = {}) => {
  const { 
    conn = "rpc", 
    timestamp = 1234567890, 
    mockTime = false,
    isConnected = false 
  } = overrides;

  (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
  
  (useAccount as jest.Mock).mockReturnValue({ 
    account: isConnected ? { address: "0x123" } : null,
    address: isConnected ? "0x123" : undefined,
    isConnected
  });

  const mockConnect = jest.fn();
  (useConnect as jest.Mock).mockReturnValue({ 
    connect: mockConnect, 
    connectors: [
      { id: "braavos", name: "Braavos" },
      { id: "argent", name: "Argent" },
      { id: "keplr", name: "Keplr" }
    ] 
  });

  (useDisconnect as jest.Mock).mockReturnValue({ disconnect: jest.fn() });
  (useNetwork as jest.Mock).mockReturnValue({ 
    chain: { network: "testnet" },
    chains: [
      { network: "testnet" },
      { network: "mainnet" },
      { network: "sepolia" }
    ]
  });


  (useERC20 as jest.Mock).mockReturnValue({
    balance: "1000000000000000000" // 1 ETH
  });

  (useAccountBalances as jest.Mock).mockReturnValue({
    lockedBalance: "500000000000000000", // 0.5 ETH
    unlockedBalance: "300000000000000000", // 0.3 ETH
    stashedBalance: "200000000000000000" // 0.2 ETH
  });

  (useRouter as jest.Mock).mockReturnValue({
    push: jest.fn(),
  });

  (useHelpContext as jest.Mock).mockReturnValue({
    isHelpBoxOpen: false,
    toggleHelpBoxOpen: jest.fn(),
    setHelpContent: jest.fn(),
    clearHelpContent: jest.fn()
  });

  (useUiContext as jest.Mock).mockReturnValue({
    isBlurOpen: false,
    setBlurOpen: jest.fn()
  });
};

describe("Header Component", () => {
  beforeEach(() => {
    mockHooks();
  });

  it("renders header with navigation and interaction elements", () => {
    const { container } = render(<Header />);
    
    // Check header container
    const header = container.querySelector("nav");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("absolute", "top-0", "z-50", "w-full", "h-[84px]", "bg-[#121212]");

    // Check logo
    const logo = container.querySelector("img");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "logo_full");
    expect(logo).toHaveAttribute("alt", "Pitchlake logo");

    // Check network selector
    const networkSelector = screen.getByText("Testnet");
    expect(networkSelector).toBeInTheDocument();
  });

  it("handles connect wallet flow", () => {
    render(<Header />);
    
    // Check initial connect button
    const connectButton = screen.getByText("Connect");
    expect(connectButton).toBeInTheDocument();
    
    // Open wallet selection dropdown
    fireEvent.click(connectButton);
    
    // Check wallet options
    const walletOptions = ["BRAAVOS", "ARGENT", "KEPLR"];
    walletOptions.forEach(wallet => {
      expect(screen.getByText(wallet)).toBeInTheDocument();
    });
    
    // Check wallet selection
    const braavosOption = screen.getByText("BRAAVOS");
    fireEvent.click(braavosOption);
    const mockConnect = useConnect().connect;
    expect(mockConnect).toHaveBeenCalledWith({ connector: { id: "braavos", name: "Braavos" } });
  });

  it("displays profile dropdown when connected", () => {
    mockHooks({ isConnected: true });
    render(<Header />);
    
    // Check profile button
    const profileButton = screen.getByText("0x123...x123");
    expect(profileButton).toBeInTheDocument();
    
    // Check dropdown is initially closed
    expect(screen.queryByText("MY BALANCE")).not.toBeInTheDocument();
    
    // Open profile dropdown
    fireEvent.click(profileButton);
    
    // Verify dropdown is rendered with correct props
    expect(screen.getByText("MY BALANCE")).toBeInTheDocument();
  });

  it("handles mock time controls when in mock connection", () => {
    mockHooks({ conn: "mock", mockTime: true });
    render(<Header />);

    const mockTimeButton = screen.getByText("Forward Mock Time");
    expect(mockTimeButton).toBeInTheDocument();
    
    fireEvent.click(mockTimeButton);
  });

  it("does not render on mobile", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    const { container } = render(<Header />);

    expect(container.querySelector("nav")).toBeNull();
  });

  it("handles network display", () => {
    render(<Header />);
    
    // Check network selector button
    const networkButton = screen.getByRole("button", { name: /testnet/i });
    expect(networkButton).toBeInTheDocument();
    
    // Check network options
    fireEvent.click(networkButton);
    expect(screen.getByText("Mainnet (Disabled)")).toBeInTheDocument();
    expect(screen.getByText("Sepolia")).toBeInTheDocument();
  });

  it("displays connect button when not connected", () => {
    render(<Header />);
    
    const connectButton = screen.getByRole("button", { name: /connect/i });
    expect(connectButton).toBeInTheDocument();
  });
}); 