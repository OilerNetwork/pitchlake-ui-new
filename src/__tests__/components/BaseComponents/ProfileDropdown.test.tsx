import { render, screen, fireEvent } from "@testing-library/react";
import ProfileDropdown from "../../../components/BaseComponents/ProfileDropdown";

describe("ProfileDropdown Component", () => {
  const mockProps = {
    account: {
      address: "0x1234567890abcdef1234567890abcdef12345678",
    },
    balance: {
      wallet: "1.5",
      locked: "0.5",
      unlocked: "0.3",
      stashed: "0.2",
    },
    disconnect: jest.fn(),
    copyToClipboard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the truncated wallet address", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    const truncatedAddress = `${mockProps.account.address.slice(0, 6)}...${mockProps.account.address.slice(-4)}`;
    expect(screen.getByText(truncatedAddress)).toBeInTheDocument();
  });

  it("displays all balance information correctly", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    expect(screen.getByText("MY BALANCE")).toBeInTheDocument();
    expect(screen.getByText("1.5 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.5 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.3 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.2 ETH")).toBeInTheDocument();
  });

  it("calls copyToClipboard when clicking the address", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    const addressElement = screen.getByText(`${mockProps.account.address.slice(0, 6)}...${mockProps.account.address.slice(-4)}`);
    fireEvent.click(addressElement.parentElement!);
    
    expect(mockProps.copyToClipboard).toHaveBeenCalledWith(mockProps.account.address);
  });

  it("calls disconnect when clicking the disconnect button", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    const disconnectButton = screen.getByText("Disconnect").parentElement!;
    fireEvent.click(disconnectButton);
    
    expect(mockProps.disconnect).toHaveBeenCalled();
  });

  it("renders all balance labels correctly", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    const labels = ["Wallet", "Locked", "Unlocked", "Stashed"];
    labels.forEach(label => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("renders icons", () => {
    render(<ProfileDropdown {...mockProps} />);
    
    // Find icons by their parent elements
    const copyIconContainer = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'span' && 
             content.includes(mockProps.account.address.slice(0, 6));
    }).parentElement;
    expect(copyIconContainer?.querySelector('svg')).toBeInTheDocument();

    const logoutIconContainer = screen.getByText('Disconnect').parentElement;
    expect(logoutIconContainer?.querySelector('svg')).toBeInTheDocument();
  });
}); 