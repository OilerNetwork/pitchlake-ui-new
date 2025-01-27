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

  it("renders success message with correct content", () => {
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

    expect(message).toBeInTheDocument();
  });

  it("renders all required elements", () => {
    const { container } = render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    // Check for main modal elements
    expect(container.querySelector(".success-modal")).toBeInTheDocument();
    expect(container.querySelector(".success-modal-icon")).toBeInTheDocument();
    expect(container.querySelector(".success-modal-message")).toBeInTheDocument();
    expect(container.querySelector(".success-modal-button")).toBeInTheDocument();

    // Check for title content
    expect(screen.getByText(mockActiveTab)).toBeInTheDocument();
  });

  it("handles close interaction correctly", () => {
    render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    // Test both close buttons
    const backButton = screen.getByRole("button", { name: "" }); // Back arrow button
    fireEvent.click(backButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    const gotItButton = screen.getByRole("button", { name: "Got it" });
    fireEvent.click(gotItButton);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
}); 