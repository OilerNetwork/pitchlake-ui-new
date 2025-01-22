import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionButton from "@/components/Vault/Utils/ActionButton";

describe("ActionButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders button with correct states and handles interactions", () => {
    // Test enabled state
    const { rerender } = render(
      <ActionButton
        onClick={mockOnClick}
        disabled={false}
        text="Click Me"
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass(
      "bg-[#F5EBB8]",
      "text-[#121212]",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );

    // Test click handler
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    // Test disabled state
    rerender(
      <ActionButton
        onClick={mockOnClick}
        disabled={true}
        text="Click Me"
      />
    );

    expect(button).toBeDisabled();
    expect(button).toHaveClass(
      "bg-[#373632]",
      "text-[#8C8C8C]",
      "cursor-not-allowed",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );
  });
}); 