import { render, screen, fireEvent } from "@testing-library/react";
import ProfileDropdown from "../../../components/BaseComponents/ProfileDropdown";

// Mock the icons
jest.mock("lucide-react", () => ({
  CopyIcon: () => <div className="copy-icon" />,
  LogOutIcon: () => <div className="logout-icon" />,
}));

describe("ProfileDropdown Component", () => {
  const mockProps = {
    account: {
      address: "0x123456789abcdef",
    },
    balance: {
      wallet: "1.000",
      locked: "0.500",
      unlocked: "0.300",
      stashed: "0.200",
    },
    disconnect: jest.fn(),
    copyToClipboard: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dropdown with account info and handles interactions", () => {
    const { container } = render(<ProfileDropdown {...mockProps} />);
    
    // Check dropdown container
    const dropdown = container.firstChild as HTMLElement;
    expect(dropdown).toHaveClass("absolute", "right-0", "mt-2", "w-64", "bg-black", "rounded-md");
    
    // Check account section
    const accountSection = dropdown.querySelector(".text-sm.text-white.border-b");
    expect(accountSection).toBeInTheDocument();
    expect(accountSection).toHaveTextContent("0x1234...cdef");
    expect(accountSection?.querySelector(".copy-icon")).toBeInTheDocument();
    
    // Test copy address
    fireEvent.click(accountSection!);
    expect(mockProps.copyToClipboard).toHaveBeenCalledWith(mockProps.account.address);

    // Check balance sections
    const balanceSection = dropdown.querySelector(".text-sm.text-\\[var\\(--buttonwhite\\)\\]");
    expect(balanceSection).toBeInTheDocument();
    
    const balances = [
      { label: "Wallet", value: "1.000" },
      { label: "Locked", value: "0.500" },
      { label: "Unlocked", value: "0.300" },
      { label: "Stashed", value: "0.200" },
    ];

    balances.forEach(({ label, value }) => {
      const row = screen.getByText(label).closest(".flex.justify-between");
      expect(row).toBeInTheDocument();
      expect(row).toHaveTextContent(`${value} ETH`);
    });

    // Test disconnect
    const disconnectButton = screen.getByText("Disconnect").closest(".text-sm.text-white");
    expect(disconnectButton?.querySelector(".logout-icon")).toBeInTheDocument();
    
    fireEvent.click(disconnectButton!);
    expect(mockProps.disconnect).toHaveBeenCalled();
  });
}); 