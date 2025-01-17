import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import InputField, { InputFieldExtra } from "@/components/Vault/Utils/InputField";

describe("InputField Components", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("InputField", () => {
    it("renders with basic props", () => {
      render(
        <InputField
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
    });

    it("renders with all optional props", () => {
      render(
        <InputField
          label="Test Label"
          label2="Secondary Label"
          value="Test Value"
          onChange={mockOnChange}
          placeholder="Test Placeholder"
          error="Error Message"
          icon={<div className="test-icon" />}
          disabled={true}
          type="number"
          className="custom-class"
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("placeholder", "Test Placeholder");
      expect(screen.getByText("Secondary Label")).toBeInTheDocument();
      expect(screen.getByText("Error Message")).toBeInTheDocument();
      expect(document.querySelector(".test-icon")).toBeInTheDocument();
    });

    it("calls onChange when input value changes", () => {
      render(
        <InputField
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Value" } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("shows error state correctly", () => {
      render(
        <InputField
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
          error="Error Message"
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-[#CC455E]");
      expect(input).toHaveClass("text-[#CC455E]");
      expect(screen.getByText("Error Message")).toHaveClass("text-red-500");
    });
  });

  describe("InputFieldExtra", () => {
    it("renders with basic props", () => {
      render(
        <InputFieldExtra
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("Test Value");
    });

    it("renders with all optional props", () => {
      render(
        <InputFieldExtra
          label="Test Label"
          label2="Secondary Label"
          value="Test Value"
          onChange={mockOnChange}
          placeholder="Test Placeholder"
          error="Error Message"
          icon={<div className="test-icon" />}
          type="number"
          className="custom-class"
        />
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      const input = screen.getByRole("spinbutton");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveAttribute("placeholder", "Test Placeholder");
      expect(screen.getByText("Secondary Label")).toBeInTheDocument();
      expect(screen.getByText("Error Message")).toBeInTheDocument();
      expect(document.querySelector(".test-icon")).toBeInTheDocument();
    });

    it("calls onChange when input value changes", () => {
      render(
        <InputFieldExtra
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "New Value" } });
      expect(mockOnChange).toHaveBeenCalled();
    });

    it("shows error state correctly", () => {
      render(
        <InputFieldExtra
          label="Test Label"
          value="Test Value"
          onChange={mockOnChange}
          error="Error Message"
        />
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-[#CC455E]");
      expect(input).toHaveClass("text-[#CC455E]");
      expect(screen.getByText("Error Message")).toHaveClass("text-red-500");
    });
  });
}); 