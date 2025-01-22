import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SuccessModal from "../../../../components/Vault/Utils/SuccessModal";

describe("SuccessModal Component", () => {
  const mockOnClose = jest.fn();
  const mockActiveTab = "Test Action";
  const mockAction = "Test Content";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("formats success message correctly", () => {
    render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    const message = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes('You have successfully') &&
             content.includes('Test Content');
    });

    expect(message).toHaveClass("text-gray-400", "text-center", "text-[14px]");
  });

  it("renders success-specific elements", () => {
    const { container } = render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    // Check for success icon
    const successIcon = container.querySelector(".success-icon");
    expect(successIcon).toBeInTheDocument();
    expect(successIcon).toHaveClass("bg-[#F5EBB8]", "rounded-lg", "w-12", "h-12");

    // Check for "Got it" button styling
    const gotItButton = screen.getByText("Got it");
    expect(gotItButton).toHaveClass("bg-[#F5EBB8]", "text-[#121212]", "rounded-lg");
  });

  it("handles close interaction correctly", () => {
    render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Got it"));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
}); 