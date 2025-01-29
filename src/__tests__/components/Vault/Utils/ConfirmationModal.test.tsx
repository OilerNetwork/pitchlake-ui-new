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
    expect(container.querySelector(".confirmation-modal")).toBeInTheDocument();
    expect(container.querySelector(".confirmation-modal-header")).toBeInTheDocument();
    expect(container.querySelector(".confirmation-modal-content")).toBeInTheDocument();
    expect(container.querySelector(".confirmation-modal-actions")).toBeInTheDocument();

    // Check content
    expect(screen.getByText(mockModalHeader)).toBeInTheDocument();
    const message = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes('Are you sure you want to') &&
             content.includes('Test Content');
    });
    expect(message).toBeInTheDocument();

    // Check buttons
    const confirmButton = screen.getByText("Confirm");
    const cancelButton = screen.getByText("Cancel");
    expect(confirmButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Test button interactions
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnClose).not.toHaveBeenCalled();

    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
}); 