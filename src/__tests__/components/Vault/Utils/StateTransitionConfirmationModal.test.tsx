import { render, screen, fireEvent } from "@testing-library/react";
import StateTransitionConfirmationModal from "../../../../components/Vault/Utils/StateTransitionConfirmationModal";

describe("StateTransitionConfirmationModal", () => {
  const defaultProps = {
    action: "Start Auction",
    onConfirm: jest.fn(),
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal with correct content and handles interactions", () => {
    const { container } = render(<StateTransitionConfirmationModal {...defaultProps} />);

    // Check modal structure
    const modal = container.firstChild;
    expect(modal).toHaveClass("fixed", "inset-0", "bg-black", "bg-opacity-50", "backdrop-blur-sm");

    // Check message container
    const messageContainer = container.querySelector(".flex.flex-col.items-center.gap-6");
    expect(messageContainer).toBeInTheDocument();

    // Check confirmation message
    const message = screen.getByText("Are you sure you want to start this round's auction?");
    expect(message).toHaveClass("text-gray-400", "text-center", "text-[14px]");

    // Check buttons
    const confirmButton = screen.getByRole("button", { name: "Start" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    expect(confirmButton).toHaveClass(
      "bg-[#F5EBB8]",
      "text-[#121212]",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );
    expect(cancelButton).toHaveClass(
      "border",
      "border-[#595959]",
      "text-[#fafafa]",
      "w-full",
      "rounded-lg",
      "py-3",
      "font-medium"
    );

    // Test button interactions
    fireEvent.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalled();

    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("renders correct messages for different actions", () => {
    const actions = [
      ["Start Auction", "Are you sure you want to start this round's auction?", "Start"],
      ["End Auction", "Are you sure you want to end this round's auction?", "End"],
      ["Request Fossil", "Are you sure you want to request pricing data from Fossil?", "Request Fossil"],
      ["Settle Round", "Are you sure you want to settle this round?", "Settle"],
    ];

    actions.forEach(([action, expectedMessage, buttonText]) => {
      const { container, unmount } = render(
        <StateTransitionConfirmationModal
          {...defaultProps}
          action={action}
        />
      );

      const message = screen.getByText(expectedMessage);
      expect(message).toHaveClass("text-gray-400", "text-center", "text-[14px]");

      const confirmButton = screen.getByRole("button", { name: buttonText });
      expect(confirmButton).toHaveClass(
        "bg-[#F5EBB8]",
        "text-[#121212]",
        "w-full",
        "rounded-lg",
        "py-3",
        "font-medium"
      );

      unmount();
    });
  });
}); 