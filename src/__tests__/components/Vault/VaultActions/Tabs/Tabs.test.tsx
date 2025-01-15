import { render, screen, fireEvent } from "@testing-library/react";
import Tabs from "../../../../../components/Vault/VaultActions/Tabs/Tabs";

describe("Tabs", () => {
  const defaultProps = {
    tabs: ["Tab 1", "Tab 2", "Tab 3"],
    activeTab: "Tab 1",
    setActiveTab: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs", () => {
    const { container } = render(<Tabs {...defaultProps} />);
    
    // Check container
    expect(container.querySelector(".vault-tabs")).toBeInTheDocument();
    
    // Check tab wrappers
    const tabWrappers = container.querySelectorAll(".vault-tab-wrapper");
    expect(tabWrappers).toHaveLength(defaultProps.tabs.length);
    
    // Check tabs
    const tabs = container.querySelectorAll(".vault-tab");
    expect(tabs).toHaveLength(defaultProps.tabs.length);
    tabs.forEach((tab, index) => {
      expect(tab).toHaveTextContent(defaultProps.tabs[index]);
    });
  });

  it("applies active styles to the active tab", () => {
    const { container } = render(<Tabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-tab");
    const activeTab = Array.from(tabs).find(tab => tab.textContent === defaultProps.activeTab);
    const inactiveTabs = Array.from(tabs).filter(tab => tab.textContent !== defaultProps.activeTab);
    
    expect(activeTab).toHaveClass("text-[#F5EBB8]");
    expect(activeTab?.querySelector(".vault-tab-indicator")).toHaveClass("bg-[#F5EBB8]");
    
    inactiveTabs.forEach(tab => {
      expect(tab).toHaveClass("text-gray-400");
      expect(tab.querySelector(".vault-tab-indicator")).toBeNull();
    });
  });

  it("calls setActiveTab when a tab is clicked", () => {
    const { container } = render(<Tabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-tab");
    tabs.forEach(tab => {
      fireEvent.click(tab);
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith(tab.textContent);
    });
    
    expect(defaultProps.setActiveTab).toHaveBeenCalledTimes(defaultProps.tabs.length);
  });

  it("maintains tab order", () => {
    const { container } = render(<Tabs {...defaultProps} />);
    
    const tabs = container.querySelectorAll(".vault-tab");
    expect(tabs).toHaveLength(defaultProps.tabs.length);
    tabs.forEach((tab, index) => {
      expect(tab).toHaveTextContent(defaultProps.tabs[index]);
    });
  });

  it("renders with correct layout classes", () => {
    const { container } = render(<Tabs {...defaultProps} />);
    
    // Check container classes
    const tabsContainer = container.querySelector(".vault-tabs");
    expect(tabsContainer).toHaveClass(
      "flex",
      "flex-row",
      "items-center",
      "border-b",
      "border-gray-700"
    );
    
    // Check tab wrapper classes
    const tabWrappers = container.querySelectorAll(".vault-tab-wrapper");
    expect(tabWrappers).toHaveLength(defaultProps.tabs.length);
    tabWrappers.forEach(wrapper => {
      expect(wrapper).toHaveClass("flex", "flex-row");
    });
    
    // Check tab classes
    const tabs = container.querySelectorAll(".vault-tab");
    tabs.forEach(tab => {
      expect(tab).toHaveClass("h-[56px]", "px-6", "py-4", "relative", "text-[14px]");
    });
  });
}); 