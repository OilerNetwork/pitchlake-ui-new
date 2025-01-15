import { render, screen, fireEvent } from "@testing-library/react";
import ButtonTabs from "../../../../../components/Vault/VaultActions/Tabs/ButtonTabs";

describe("ButtonTabs", () => {
  const defaultProps = {
    tabs: ["Tab 1", "Tab 2", "Tab 3"],
    activeTab: "Tab 1",
    setActiveTab: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs", () => {
    const { container } = render(<ButtonTabs {...defaultProps} />);
    
    // Check container
    expect(container.querySelector(".vault-button-tabs")).toBeInTheDocument();
    
    // Check tabs
    const tabs = container.querySelectorAll(".vault-button-tab");
    expect(tabs).toHaveLength(defaultProps.tabs.length);
    tabs.forEach((tab, index) => {
      expect(tab).toHaveTextContent(defaultProps.tabs[index]);
    });
  });

  it("applies active styles to the active tab", () => {
    const { container } = render(<ButtonTabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-button-tab");
    const activeTab = Array.from(tabs).find(tab => tab.textContent === defaultProps.activeTab);
    const inactiveTabs = Array.from(tabs).filter(tab => tab.textContent !== defaultProps.activeTab);
    
    expect(activeTab).toHaveClass("bg-[#373632]", "text-[#F5EBB8]");
    
    inactiveTabs.forEach(tab => {
      expect(tab).toHaveClass("text-[#BFBFBF]");
      expect(tab).not.toHaveClass("bg-[#373632]", "text-[#F5EBB8]");
    });
  });

  it("calls setActiveTab when a tab is clicked", () => {
    const { container } = render(<ButtonTabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-button-tab");
    tabs.forEach(tab => {
      fireEvent.click(tab);
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith(tab.textContent);
    });
    
    expect(defaultProps.setActiveTab).toHaveBeenCalledTimes(defaultProps.tabs.length);
  });

  it("maintains tab order", () => {
    const { container } = render(<ButtonTabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-button-tab");
    expect(tabs).toHaveLength(defaultProps.tabs.length);
    tabs.forEach((tab, index) => {
      expect(tab).toHaveTextContent(defaultProps.tabs[index]);
    });
  });
}); 