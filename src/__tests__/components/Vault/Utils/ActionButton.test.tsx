import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionButton from "@/components/Vault/Utils/ActionButton";

describe("ActionButton", () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with enabled state", () => {
    render(
      <ActionButton
        onClick={mockOnClick}
        disabled={false}
        text="Click Me"
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass("bg-[#F5EBB8]");
    expect(button).toHaveClass("text-[#121212]");
  });

  it("renders with disabled state", () => {
    render(
      <ActionButton
        onClick={mockOnClick}
        disabled={true}
        text="Click Me"
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveClass("bg-[#373632]");
    expect(button).toHaveClass("text-[#8C8C8C]");
    expect(button).toHaveClass("cursor-not-allowed");
  });

  it("calls onClick when clicked in enabled state", () => {
    render(
      <ActionButton
        onClick={mockOnClick}
        disabled={false}
        text="Click Me"
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when clicked in disabled state", () => {
    render(
      <ActionButton
        onClick={mockOnClick}
        disabled={true}
        text="Click Me"
      />
    );

    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });
}); 