import { screen, fireEvent } from "@testing-library/react";
import ButtonTabs from "@/components/Vault/VaultActions/Tabs/ButtonTabs";
import { renderWithProviders } from "@/__tests__/utils/TestWrapper";

describe("ButtonTabs", () => {
  const defaultProps = {
    tabs: ["Tab 1", "Tab 2", "Tab 3"],
    activeTab: "Tab 1",
    setActiveTab: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all tabs and handles tab selection", () => {
    renderWithProviders(<ButtonTabs {...defaultProps} />);
    
    // Check if all tabs are rendered
    defaultProps.tabs.forEach(tab => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });

    // Test clicking each tab
    defaultProps.tabs.forEach(tab => {
      fireEvent.click(screen.getByText(tab));
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith(tab);
    });
  });

  it("indicates active tab", () => {
    renderWithProviders(<ButtonTabs {...defaultProps} />);
    
    // Active tab should be distinguishable from others
    const activeTab = screen.getByText(defaultProps.activeTab);
    const inactiveTabs = defaultProps.tabs
      .filter(tab => tab !== defaultProps.activeTab)
      .map(tab => screen.getByText(tab));

    // Check that active tab has different class than inactive tabs
    expect(activeTab.className).not.toBe(inactiveTabs[0].className);
  });
}); 