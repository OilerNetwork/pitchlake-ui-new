import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "@/components/Vault/Utils/Modal";

// Mock the ArrowLeftIcon component from lucide-react
jest.mock("lucide-react", () => ({
  ArrowLeftIcon: ({ onClick }: { onClick: () => void }) => (
    <div data-testid="arrow-left-icon" onClick={onClick} />
  ),
}));

describe("Modal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with title and content", () => {
    render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div>Test Content</div>
      </Modal>
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
    expect(screen.getByTestId("arrow-left-icon")).toBeInTheDocument();
  });

  it("calls onClose when back arrow is clicked", () => {
    render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div>Test Content</div>
      </Modal>
    );

    const backArrow = screen.getByTestId("arrow-left-icon");
    fireEvent.click(backArrow);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders with custom content", () => {
    render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div>
          <h3>Custom Header</h3>
          <p>Custom Paragraph</p>
          <button>Custom Button</button>
        </div>
      </Modal>
    );

    expect(screen.getByText("Custom Header")).toBeInTheDocument();
    expect(screen.getByText("Custom Paragraph")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has correct styling classes", () => {
    const { container } = render(
      <Modal title="Test Modal" onClose={mockOnClose}>
        <div>Test Content</div>
      </Modal>
    );

    // Check overlay styling
    const overlay = container.firstChild as HTMLElement;
    expect(overlay).toHaveClass("fixed", "bg-black", "bg-opacity-50");

    // Check modal content styling
    const modalContent = container.querySelector(".bg-\\[\\#121212\\]");
    expect(modalContent).toHaveClass("p-6", "rounded-lg", "max-w-sm", "w-full");

    // Check header styling
    const header = screen.getByText("Test Modal").parentElement;
    expect(header).toHaveClass("flex", "items-center", "mb-4");
  });
}); 