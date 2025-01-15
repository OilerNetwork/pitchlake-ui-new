import { render, screen, fireEvent, act } from "@testing-library/react";
import Header from "../../../components/LayoutComponents/Header";
import { useNetwork, useAccount, useConnect, useSwitchChain, useDisconnect } from "@starknet-react/core";
import useIsMobile from "../../../hooks/window/useIsMobile";
import useERC20 from "../../../hooks/erc20/useERC20";
import useAccountBalances from "../../../hooks/vault/state/useAccountBalances";
import { useProtocolContext } from "../../../context/ProtocolProvider";
import { useRouter } from "next/navigation";

// Mock all the hooks
jest.mock("@starknet-react/core", () => ({
  useNetwork: jest.fn(),
  useAccount: jest.fn(),
  useConnect: jest.fn(),
  useSwitchChain: jest.fn(),
  useDisconnect: jest.fn(),
}));

jest.mock("../../../hooks/window/useIsMobile", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../hooks/erc20/useERC20", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../hooks/vault/state/useAccountBalances", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function Image({ src, alt, onClick }: any) {
    // Return a div instead of img for easier testing
    return <div data-testid={`image-${alt.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClick}>{alt}</div>;
  },
}));

describe("Header Component", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockProtocolContext = {
    conn: "ws",
    timestamp: 0,
    mockTimeForward: jest.fn(),
    vaultState: { address: "0x123" },
  };

  const mockConnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock values
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useProtocolContext as jest.Mock).mockReturnValue(mockProtocolContext);
    (useNetwork as jest.Mock).mockReturnValue({
      chains: [{ network: "testnet" }, { network: "mainnet" }],
      chain: { network: "testnet" },
    });
    (useAccount as jest.Mock).mockReturnValue({ account: null });
    (useConnect as jest.Mock).mockReturnValue({ 
      connect: mockConnect,
      connectors: [
        { id: "braavos", name: "Braavos" },
        { id: "argentX", name: "Argent X" }
      ] 
    });
    (useSwitchChain as jest.Mock).mockReturnValue({ switchChainAsync: jest.fn() });
    (useDisconnect as jest.Mock).mockReturnValue({ disconnect: jest.fn() });
    (useERC20 as jest.Mock).mockReturnValue({ balance: "0" });
    (useAccountBalances as jest.Mock).mockReturnValue({
      lockedBalance: "0",
      unlockedBalance: "0",
      stashedBalance: "0",
    });
  });

  it("renders logo that navigates to home", () => {
    render(<Header />);
    const logo = screen.getByTestId("image-pitchlake-logo");
    fireEvent.click(logo);
    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  describe("Network Selection", () => {
    it("renders network selector with current network", () => {
      render(<Header />);
      expect(document.querySelector('.network-selector')).toBeInTheDocument();
      expect(screen.getByText("testnet")).toBeInTheDocument();
    });

    it("shows network dropdown on click", () => {
      render(<Header />);
      const networkButton = document.querySelector('.network-selector');
      fireEvent.click(networkButton!);
      expect(document.querySelector('.network-dropdown')).toBeInTheDocument();
    });

    it("handles network switching", async () => {
      const mockSwitchChain = jest.fn();
      (useSwitchChain as jest.Mock).mockReturnValue({ switchChainAsync: mockSwitchChain });
      
      render(<Header />);
      const networkButton = screen.getByText("testnet");
      fireEvent.click(networkButton);
      
      const mainnetOption = screen.getByText("MAINNET");
      await act(async () => {
        fireEvent.click(mainnetOption);
      });
      
      expect(mockSwitchChain).toHaveBeenCalled();
    });

    it("closes dropdown when clicking outside", () => {
      render(<Header />);
      
      const networkButton = screen.getByText("testnet");
      fireEvent.click(networkButton);
      expect(screen.getByText("TESTNET")).toBeInTheDocument();
      
      fireEvent.mouseDown(document.body);
      expect(screen.queryByText("TESTNET")).not.toBeInTheDocument();
    });

    it("closes dropdown on escape key", () => {
      render(<Header />);
      
      const networkButton = screen.getByText("testnet");
      fireEvent.click(networkButton);
      expect(screen.getByText("TESTNET")).toBeInTheDocument();
      
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("TESTNET")).not.toBeInTheDocument();
    });
  });

  describe("Wallet Connection", () => {
    it("shows connect button with login icon when not connected", () => {
      render(<Header />);
      expect(document.querySelector('.wallet-connect-button')).toBeInTheDocument();
    });

    it("shows wallet selection dropdown when clicking connect", () => {
      render(<Header />);
      const connectButton = document.querySelector('.wallet-connect-button')!;
      fireEvent.click(connectButton);
      expect(document.querySelector('.wallet-dropdown')).toBeInTheDocument();
    });

    it("handles wallet connection", async () => {
      render(<Header />);
      
      // Open wallet selection
      const connectButton = screen.getByText("Connect").closest('button')!;
      fireEvent.click(connectButton);
      
      // Click Braavos option
      const braavosOption = screen.getByText("BRAAVOS").closest('div')!;
      await act(async () => {
        fireEvent.click(braavosOption);
      });
      
      expect(mockConnect).toHaveBeenCalledWith({ 
        connector: expect.objectContaining({ id: "braavos" }) 
      });
    });

    it("shows connected wallet info", () => {
      const mockAddress = "0x1234567890abcdef";
      (useAccount as jest.Mock).mockReturnValue({
        account: { address: mockAddress },
      });
      
      render(<Header />);
      
      // Should show avatar and truncated address
      expect(screen.getByTestId("image-user-avatar")).toBeInTheDocument();
      expect(screen.getByText(`${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`)).toBeInTheDocument();
    });

    it("handles wallet disconnection", () => {
      const mockDisconnect = jest.fn();
      (useDisconnect as jest.Mock).mockReturnValue({ disconnect: mockDisconnect });
      (useAccount as jest.Mock).mockReturnValue({
        account: { address: "0x1234567890abcdef" },
      });
      
      render(<Header />);
      
      // Open profile dropdown
      const profileButton = screen.getByTestId("image-user-avatar").parentElement!;
      fireEvent.click(profileButton);
      
      // Click disconnect
      const disconnectButton = screen.getByText("Disconnect");
      fireEvent.click(disconnectButton);
      
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  it("renders on mobile with responsive styling", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    render(<Header />);
    expect(document.querySelector('.header-component')).toBeInTheDocument();
  });

  it("shows mock time controls when conn is mock", () => {
    (useProtocolContext as jest.Mock).mockReturnValue({
      ...mockProtocolContext,
      conn: "mock",
    });
    
    render(<Header />);
    expect(screen.getByText("Forward Mock Time")).toBeInTheDocument();
    
    const forwardButton = screen.getByText("Forward Mock Time");
    fireEvent.click(forwardButton);
    expect(mockProtocolContext.mockTimeForward).toHaveBeenCalled();
  });
}); 