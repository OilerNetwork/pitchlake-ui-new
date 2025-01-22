import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConfirmationModal from "../../../../components/Vault/Utils/ConfirmationModal";

describe("ConfirmationModal Component", () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();
  const mockModalHeader = "Test Action";
  const mockAction = "Test Content";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders confirmation modal with correct content and handles interactions", () => {
    const { container } = render(
      <ConfirmationModal
        modalHeader={mockModalHeader}
        action={mockAction}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    // Check modal structure
    const modal = container.firstChild;
    expect(modal).toHaveClass("fixed", "inset-0", "bg-black", "bg-opacity-50", "backdrop-blur-sm");

    // Check confirmation message
    const message = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes('Are you sure you want to') &&
             content.includes('Test Content');
    });
    expect(message).toHaveClass("text-gray-400", "text-center", "text-[14px]");

    // Check buttons
    const confirmButton = screen.getByText("Confirm");
    const cancelButton = screen.getByText("Cancel");

    expect(confirmButton).toHaveClass(
      "bg-[#F5EBB8]",
      "text-[#121212]",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );
    expect(cancelButton).toHaveClass(
      "border",
      "border-[#595959]",
      "text-[#fafafa]",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );

    // Test button interactions
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
}); 