import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputField, { InputFieldExtra } from "@/components/Vault/Utils/InputField";

describe("InputField Components", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("InputField", () => {
    it("renders with correct styling and handles interactions", () => {
      // Test basic rendering
      const { container, rerender } = render(
        <InputField
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      const inputContainer = container.firstChild;
      expect(inputContainer).toHaveClass("flex", "flex-col", "gap-2");

      const label = screen.getByText("Test Label");
      expect(label).toHaveClass("text-sm", "text-[var(--buttongrey)]");

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
      expect(input).toHaveClass(
        "bg-[#121212]",
        "border",
        "border-[#262626]",
        "rounded-lg",
        "p-3",
        "text-white"
      );

      // Test input change
      fireEvent.change(input, { target: { value: "New Value" } });
      expect(mockOnChange).toHaveBeenCalled();

      // Test with all optional props
      rerender(
        <InputField
          label="Test Label"
          label2="Secondary Label"
          value="Test Value"
          onChange={mockOnChange}
          placeholder="Test Placeholder"
          error="Error Message"
          icon={<div className="input-icon" />}
          disabled={true}
          type="number"
          className="custom-class"
        />
      );

      const inputWithOptions = screen.getByRole("spinbutton");
      expect(inputWithOptions).toBeDisabled();
      expect(inputWithOptions).toHaveAttribute("type", "number");
      expect(inputWithOptions).toHaveAttribute("placeholder", "Test Placeholder");
      expect(screen.getByText("Secondary Label")).toHaveClass("text-sm", "text-[var(--buttongrey)]");
      expect(screen.getByText("Error Message")).toHaveClass("text-red-500", "text-sm");
      expect(container.querySelector(".input-icon")).toBeInTheDocument();

      // Test error state
      expect(inputWithOptions).toHaveClass("border-[#CC455E]", "text-[#CC455E]");
    });
  });

  describe("InputFieldExtra", () => {
    it("renders with correct styling and handles interactions", () => {
      // Test basic rendering
      const { container, rerender } = render(
        <InputFieldExtra
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      const inputContainer = container.firstChild;
      expect(inputContainer).toHaveClass("flex", "flex-col", "gap-2");

      const label = screen.getByText("Test Label");
      expect(label).toHaveClass("text-sm", "text-[var(--buttongrey)]");

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
      expect(input).toHaveClass(
        "bg-[#121212]",
        "border",
        "border-[#262626]",
        "rounded-lg",
        "p-3",
        "text-white"
      );

      // Test input change
      fireEvent.change(input, { target: { value: "New Value" } });
      expect(mockOnChange).toHaveBeenCalled();

      // Test with all optional props
      rerender(
        <InputFieldExtra
          label="Test Label"
          label2="Secondary Label"
          value="Test Value"
          onChange={mockOnChange}
          placeholder="Test Placeholder"
          error="Error Message"
          icon={<div className="input-icon" />}
          type="number"
          className="custom-class"
        />
      );

      const inputWithOptions = screen.getByRole("spinbutton");
      expect(inputWithOptions).toHaveAttribute("type", "number");
      expect(inputWithOptions).toHaveAttribute("placeholder", "Test Placeholder");
      expect(screen.getByText("Secondary Label")).toHaveClass("text-sm", "text-[var(--buttongrey)]");
      expect(screen.getByText("Error Message")).toHaveClass("text-red-500", "text-sm");
      expect(container.querySelector(".input-icon")).toBeInTheDocument();

      // Test error state
      expect(inputWithOptions).toHaveClass("border-[#CC455E]", "text-[#CC455E]");
    });
  });
}); 