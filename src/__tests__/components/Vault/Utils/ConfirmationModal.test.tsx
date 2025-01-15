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

  it("renders with provided content", () => {
    render(
      <ConfirmationModal
        modalHeader={mockModalHeader}
        action={mockAction}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Test Action")).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes('Are you sure you want to') &&
             content.includes('Test Content');
    })).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", () => {
    render(
      <ConfirmationModal
        modalHeader={mockModalHeader}
        action={mockAction}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Confirm"));
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(
      <ConfirmationModal
        modalHeader={mockModalHeader}
        action={mockAction}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 