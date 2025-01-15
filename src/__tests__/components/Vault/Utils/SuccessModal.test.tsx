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

  it("renders with provided content", () => {
    render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText("Test Action")).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes('You have successfully') &&
             content.includes('Test Content');
    })).toBeInTheDocument();
    expect(screen.getByText("Got it")).toBeInTheDocument();
  });

  it("calls onClose when got it button is clicked", () => {
    render(
      <SuccessModal
        activeTab={mockActiveTab}
        action={mockAction}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText("Got it"));
    expect(mockOnClose).toHaveBeenCalled();
  });
}); 