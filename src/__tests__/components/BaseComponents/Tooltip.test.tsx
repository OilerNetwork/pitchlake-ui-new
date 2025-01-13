import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip, BalanceTooltip } from "../../../components/BaseComponents/Tooltip";

// Mock createPortal since we're using it in BalanceTooltip
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

describe("Tooltip Component", () => {
  it("renders children correctly", () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("shows tooltip text on hover", () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    const container = screen.getByText("Hover me").parentElement;
    fireEvent.mouseEnter(container!);
    
    expect(screen.getByText("Tooltip text")).toBeInTheDocument();
  });

  it("hides tooltip text by default", () => {
    render(
      <Tooltip text="Tooltip text">
        <button>Hover me</button>
      </Tooltip>
    );

    expect(screen.queryByText("Tooltip text")).toHaveClass("hidden");
  });
});

describe("BalanceTooltip Component", () => {
  const mockBalance = {
    locked: "1000000000000000000", // 1 ETH
    unlocked: "500000000000000000", // 0.5 ETH
    stashed: "200000000000000000", // 0.2 ETH
  };

  it("renders children correctly", () => {
    render(
      <BalanceTooltip balance={mockBalance}>
        <button>Hover for balance</button>
      </BalanceTooltip>
    );

    expect(screen.getByText("Hover for balance")).toBeInTheDocument();
  });

  it("shows balance distribution on hover", () => {
    render(
      <BalanceTooltip balance={mockBalance}>
        <button>Hover for balance</button>
      </BalanceTooltip>
    );

    const container = screen.getByText("Hover for balance").parentElement;
    fireEvent.mouseEnter(container!);

    expect(screen.getByText("Balance Distribution")).toBeInTheDocument();
    expect(screen.getByText("1.000 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.500 ETH")).toBeInTheDocument();
    expect(screen.getByText("0.200 ETH")).toBeInTheDocument();
  });

  it("handles zero balances correctly", () => {
    const zeroBalance = {
      locked: "0",
      unlocked: "0",
      stashed: "0",
    };

    render(
      <BalanceTooltip balance={zeroBalance}>
        <button>Hover for balance</button>
      </BalanceTooltip>
    );

    const container = screen.getByText("Hover for balance").parentElement;
    fireEvent.mouseEnter(container!);

    const zeroValues = screen.getAllByText("0.000 ETH");
    expect(zeroValues).toHaveLength(3);
  });

  it("updates tooltip position on hover", () => {
    const { container } = render(
      <BalanceTooltip balance={mockBalance}>
        <button>Hover for balance</button>
      </BalanceTooltip>
    );

    const tooltipTrigger = screen.getByText("Hover for balance").parentElement;
    fireEvent.mouseEnter(tooltipTrigger!);

    // Check if tooltip is positioned relative to the trigger
    const tooltip = container.querySelector('[style*="position: absolute"]');
    expect(tooltip).toBeInTheDocument();
  });

  it("hides tooltip when mouse leaves", () => {
    render(
      <BalanceTooltip balance={mockBalance}>
        <button>Hover for balance</button>
      </BalanceTooltip>
    );

    const container = screen.getByText("Hover for balance").parentElement;
    
    // Show tooltip
    fireEvent.mouseEnter(container!);
    expect(screen.getByText("Balance Distribution")).toBeInTheDocument();
    
    // Hide tooltip
    fireEvent.mouseLeave(container!);
    expect(screen.queryByText("Balance Distribution")).not.toBeInTheDocument();
  });
}); 