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

  it("renders correct confirmation message for each action", () => {
    const actions = [
      ["Start Auction", "Are you sure you want to start this round's auction?"],
      ["End Auction", "Are you sure you want to end this round's auction?"],
      ["Request Fossil", "Are you sure you want to request pricing data from Fossil?"],
      ["Settle Round", "Are you sure you want to settle this round?"],
    ];

    actions.forEach(([action, expectedMessage]) => {
      const { unmount } = render(
        <StateTransitionConfirmationModal
          {...defaultProps}
          action={action}
        />
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      unmount();
    });
  });

  it("renders correct button text for each action", () => {
    const actions = [
      ["Start Auction", "Start"],
      ["End Auction", "End"],
      ["Request Fossil", "Request Fossil"],
      ["Settle Round", "Settle"],
    ];

    actions.forEach(([action, expectedButtonText]) => {
      const { unmount } = render(
        <StateTransitionConfirmationModal
          {...defaultProps}
          action={action}
        />
      );
      expect(screen.getByRole("button", { name: expectedButtonText })).toBeInTheDocument();
      unmount();
    });
  });

  it("calls onClose when clicking outside modal", () => {
    const { container } = render(<StateTransitionConfirmationModal {...defaultProps} />);
    
    const backdrop = container.querySelector(".state-transition-modal-backdrop");
    fireEvent.click(backdrop!);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when clicking confirm button", () => {
    render(<StateTransitionConfirmationModal {...defaultProps} />);
    
    const confirmButton = screen.getByRole("button", { name: "Start" });
    fireEvent.click(confirmButton);
    
    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when clicking cancel button", () => {
    render(<StateTransitionConfirmationModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("prevents event propagation when clicking modal content", () => {
    const { container } = render(<StateTransitionConfirmationModal {...defaultProps} />);
    
    const modalContent = container.querySelector(".state-transition-modal-content");
    fireEvent.click(modalContent!);
    
    // If stopPropagation works, onClose should not be called
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it("disables body scroll when mounted", () => {
    render(<StateTransitionConfirmationModal {...defaultProps} />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("re-enables body scroll when unmounted", () => {
    const { unmount } = render(<StateTransitionConfirmationModal {...defaultProps} />);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
}); 