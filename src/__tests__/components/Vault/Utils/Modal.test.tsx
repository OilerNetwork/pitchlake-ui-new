import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "../../../../components/Vault/Utils/Modal";

// Mock the ArrowLeftIcon component from lucide-react
jest.mock("lucide-react", () => ({
  ArrowLeftIcon: ({ onClick }: { onClick: () => void }) => (
    <div className="modal-back-button" onClick={onClick} />
  ),
}));

describe("Modal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal structure with correct styling", () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div className="test-content">Test Content</div>
      </Modal>
    );

    // Check overlay
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("fixed", "inset-0", "bg-black", "bg-opacity-50", "backdrop-blur-sm");

    // Check modal container
    const modalContainer = container.querySelector(".modal-container");
    expect(modalContainer).toHaveClass("flex", "items-center", "justify-center", "min-h-screen", "p-4");

    // Check modal content wrapper
    const modalContent = container.querySelector(".modal-content");
    expect(modalContent).toHaveClass("bg-[#121212]", "rounded-lg", "max-w-sm", "w-full");

    // Check header
    const header = screen.getByText("Test Modal").closest(".modal-header");
    expect(header).toHaveClass("flex", "items-center", "mb-4");
    expect(header?.querySelector(".modal-back-button")).toBeInTheDocument();

    // Check content
    const content = screen.getByText("Test Content").closest(".test-content");
    expect(content).toBeInTheDocument();
  });

  it("handles close actions", () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div>Content</div>
      </Modal>
    );

    // Click overlay (should close)
    const overlay = container.firstChild as HTMLElement;
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Click modal content (should not close)
    const modalContent = container.querySelector(".modal-content");
    fireEvent.click(modalContent!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Click back button (should close)
    const backButton = container.querySelector(".modal-back-button");
    fireEvent.click(backButton!);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
}); 