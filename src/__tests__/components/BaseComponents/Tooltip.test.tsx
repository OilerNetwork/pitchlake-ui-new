import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip, BalanceTooltip } from "@/components/BaseComponents/Tooltip";
import { HelpProvider } from "@/context/HelpProvider";

// Mock createPortal since we're using it in BalanceTooltip
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HelpProvider>
      {children}
    </HelpProvider>
  );
};

describe("Tooltip", () => {
  it("renders tooltip content", () => {
    render(
      <TestWrapper>
        <Tooltip text="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      </TestWrapper>
    );

    const tooltipContainer = screen.getByText("Hover me").closest(".tooltip-container");
    expect(tooltipContainer).toBeInTheDocument();

    const tooltipContent = tooltipContainer?.querySelector(".tooltip-content");
    expect(tooltipContent).toBeInTheDocument();
    expect(tooltipContent).toHaveTextContent("Test tooltip");
    expect(tooltipContent).toHaveClass("hidden", "group-hover:block");
  });
});

describe("BalanceTooltip", () => {
  it("renders balance tooltip with correct values", () => {
    const balance = {
      locked: "100000000000000000000",
      unlocked: "50000000000000000000",
      stashed: "25000000000000000000"
    };

    render(
      <TestWrapper>
        <BalanceTooltip balance={balance}>
          <div>Balance</div>
        </BalanceTooltip>
      </TestWrapper>
    );

    const tooltipTrigger = screen.getByText("Balance").closest(".flex.flex-row.items-center");
    expect(tooltipTrigger).toBeInTheDocument();

    // Trigger hover
    fireEvent.mouseEnter(tooltipTrigger!);

    // Now we can check the tooltip content
    expect(screen.getByText("Balance Distribution")).toBeInTheDocument();
    expect(screen.getByText("100.000 ETH")).toBeInTheDocument();
    expect(screen.getByText("50.000 ETH")).toBeInTheDocument();
    expect(screen.getByText("25.000 ETH")).toBeInTheDocument();
  });

  it("handles zero balances correctly", () => {
    const balance = {
      locked: "0",
      unlocked: "0",
      stashed: "0"
    };

    render(
      <TestWrapper>
        <BalanceTooltip balance={balance}>
          <div>Balance</div>
        </BalanceTooltip>
      </TestWrapper>
    );

    const tooltipTrigger = screen.getByText("Balance").closest(".flex.flex-row.items-center");
    expect(tooltipTrigger).toBeInTheDocument();

    // Trigger hover
    fireEvent.mouseEnter(tooltipTrigger!);

    // Now we can check the tooltip content
    expect(screen.getByText("Balance Distribution")).toBeInTheDocument();
    expect(screen.getAllByText("0.000 ETH")).toHaveLength(3);
  });
}); 