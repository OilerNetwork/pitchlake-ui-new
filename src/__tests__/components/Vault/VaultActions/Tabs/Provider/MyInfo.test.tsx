import { render } from "@testing-library/react";
import MyInfo from "../../../../../../components/Vault/VaultActions/Tabs/Provider/MyInfo";

// Mock Lucide icons
jest.mock("lucide-react", () => ({
  Clock: () => <span data-testid="clock-icon">⏰</span>,
  ArrowUp: () => <span data-testid="arrow-up-icon">↑</span>,
  ArrowDown: () => <span data-testid="arrow-down-icon">↓</span>,
}));

describe("MyInfo", () => {
  it("renders all info items with correct values", () => {
    const { container } = render(<MyInfo />);
    
    const items = container.querySelectorAll(".vault-info-item");
    expect(items).toHaveLength(5); // P&L, Starting Balance, Ending Balance, Premiums, Payouts
    
    // Check P&L
    const pnlItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "My P&L"
    );
    expect(pnlItem).toBeTruthy();
    expect(pnlItem?.querySelector(".vault-info-value")).toHaveTextContent("+2.2 ETH");
    expect(pnlItem?.querySelector(".vault-info-percentage")).toHaveTextContent("20.95%");
    
    // Check Starting Balance
    const startingBalanceItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "Starting Balance"
    );
    expect(startingBalanceItem).toBeTruthy();
    expect(startingBalanceItem?.querySelector(".vault-info-value")).toHaveTextContent("10.5 ETH");
    
    // Check Ending Balance
    const endingBalanceItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "Ending Balance"
    );
    expect(endingBalanceItem).toBeTruthy();
    expect(endingBalanceItem?.querySelector(".vault-info-value")).toHaveTextContent("12.7 ETH");
    
    // Check Premiums Received
    const premiumsItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "Premiums Received"
    );
    expect(premiumsItem).toBeTruthy();
    expect(premiumsItem?.querySelector(".vault-info-value")).toHaveTextContent("4.3 ETH");
    
    // Check Payouts Lost
    const payoutsItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "Payouts Lost"
    );
    expect(payoutsItem).toBeTruthy();
    expect(payoutsItem?.querySelector(".vault-info-value")).toHaveTextContent("2.1 ETH");
    expect(payoutsItem?.querySelector("[data-testid='clock-icon']")).toBeInTheDocument();
  });

  it("shows positive performance indicators when P&L is positive", () => {
    const { container } = render(<MyInfo />);
    
    const pnlItem = container.querySelector(".vault-info-item");
    const percentage = pnlItem?.querySelector(".vault-info-percentage");
    
    expect(percentage).toHaveClass("bg-[#214C0B80]", "text-[#6AB942]");
    expect(percentage?.querySelector("[data-testid='arrow-up-icon']")).toBeInTheDocument();
    expect(percentage?.querySelector("[data-testid='arrow-down-icon']")).not.toBeInTheDocument();
  });

  it("shows pending indicator only for payouts", () => {
    const { container } = render(<MyInfo />);
    
    const items = container.querySelectorAll(".vault-info-item");
    const clockIcons = container.querySelectorAll("[data-testid='clock-icon']");
    
    expect(clockIcons).toHaveLength(1); // Only Payouts Lost should show clock
    
    const payoutsItem = Array.from(items).find(
      item => item.querySelector(".vault-info-label")?.textContent === "Payouts Lost"
    );
    expect(payoutsItem?.querySelector("[data-testid='clock-icon']")).toBeInTheDocument();
  });

  it("renders with correct layout structure", () => {
    const { container } = render(<MyInfo />);
    
    // Check main container
    const mainContainer = container.querySelector(".vault-provider-info");
    expect(mainContainer).toHaveClass("text-white", "rounded-lg");
    
    // Check content container
    const contentContainer = container.querySelector(".vault-provider-info-content");
    expect(contentContainer).toHaveClass("space-y-4", "p-6");
    
    // Check info items structure
    const items = container.querySelectorAll(".vault-info-item");
    items.forEach(item => {
      expect(item.querySelector(".vault-info-label")).toHaveClass(
        "text-regular",
        "text-[var(--buttongrey)]",
        "text-[14px]"
      );
      expect(item.querySelector(".vault-info-value")).toHaveClass(
        "flex",
        "flex-row",
        "items-center",
        "text-medium",
        "text-[14px]",
        "mt-2",
        "text-base",
        "font-medium"
      );
    });
  });
}); 