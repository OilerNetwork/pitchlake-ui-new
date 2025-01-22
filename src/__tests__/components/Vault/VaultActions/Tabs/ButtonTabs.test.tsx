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

  it("renders button tabs with correct styling and handles interactions", () => {
    const { container } = render(<ButtonTabs {...defaultProps} />);
    
    // Check container styling
    const tabsContainer = container.querySelector(".vault-button-tabs");
    expect(tabsContainer).toHaveClass("flex", "space-x-3", "mb-4");
    
    // Check button styling and interactions
    const buttons = container.querySelectorAll(".vault-button-tab");
    expect(buttons).toHaveLength(defaultProps.tabs.length);

    buttons.forEach((button, index) => {
      // Check base styling
      expect(button).toHaveClass(
        "px-2",
        "py-2",
        "text-sm",
        "rounded-md",
        "transition-colors",
        "border",
        "border-[#373632]"
      );

      // Check active/inactive state
      if (button.textContent === defaultProps.activeTab) {
        expect(button).toHaveClass("bg-[#373632]", "text-[#F5EBB8]");
      } else {
        expect(button).toHaveClass("text-[#BFBFBF]");
        expect(button).not.toHaveClass("bg-[#373632]", "text-[#F5EBB8]");
      }

      // Check content and order
      expect(button).toHaveTextContent(defaultProps.tabs[index]);

      // Test click interaction
      fireEvent.click(button);
      expect(defaultProps.setActiveTab).toHaveBeenCalledWith(defaultProps.tabs[index]);
    });
  });
}); 