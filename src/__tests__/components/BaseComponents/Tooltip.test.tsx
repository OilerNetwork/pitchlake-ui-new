import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip, BalanceTooltip } from "../../../components/BaseComponents/Tooltip";

// Mock createPortal since we're using it in BalanceTooltip
jest.mock("react-dom", () => ({
  ...jest.requireActual("react-dom"),
  createPortal: (node: React.ReactNode) => node,
}));

describe("Tooltip Components", () => {
  describe("Basic Tooltip", () => {
    it("renders tooltip with hover behavior", () => {
      const { container } = render(
        <Tooltip text="Tooltip text">
          <button className="relative group">Hover me</button>
        </Tooltip>
      );

      const tooltipGroup = container.querySelector(".relative.group");
      expect(tooltipGroup).toBeInTheDocument();

      // Initially hidden
      const tooltipContent = tooltipGroup?.querySelector(".absolute.bottom-full");
      expect(tooltipContent).toHaveClass("hidden");

      // Show on hover
      fireEvent.mouseEnter(tooltipGroup!);
      expect(tooltipContent).not.toHaveClass("hidden");

      // Hide on leave
      fireEvent.mouseLeave(tooltipGroup!);
      expect(tooltipContent).toHaveClass("hidden");
    });
  });

  describe("Balance Tooltip", () => {
    const mockBalance = {
      locked: "1000000000000000000", // 1 ETH
      unlocked: "500000000000000000", // 0.5 ETH
      stashed: "200000000000000000", // 0.2 ETH
    };

    it("renders balance tooltip with hover behavior and correct values", () => {
      const { container } = render(
        <BalanceTooltip balance={mockBalance}>
          <button className="flex flex-row items-center">Hover for balance</button>
        </BalanceTooltip>
      );

      const tooltipTrigger = container.querySelector(".flex.flex-row.items-center");
      expect(tooltipTrigger).toBeInTheDocument();

      // Initially no tooltip
      expect(screen.queryByText("Balance Distribution")).not.toBeInTheDocument();

      // Show tooltip on hover
      fireEvent.mouseEnter(tooltipTrigger!);
      
      // Check tooltip structure
      const tooltip = screen.getByText("Balance Distribution").closest("div");
      expect(tooltip).toHaveClass("relative", "text-white", "text-[14px]", "font-regular", "rounded-md");

      // Check balance values
      const balances = [
        { label: "Locked", value: "1.000 ETH" },
        { label: "Unlocked", value: "0.500 ETH" },
        { label: "Stashed", value: "0.200 ETH" },
      ];

      balances.forEach(({ label, value }) => {
        const row = screen.getByText(label).closest(".flex.justify-between");
        expect(row).toBeInTheDocument();
        expect(row).toHaveTextContent(value);
      });

      // Hide on leave
      fireEvent.mouseLeave(tooltipTrigger!);
      expect(screen.queryByText("Balance Distribution")).not.toBeInTheDocument();
    });

    it("handles zero balances correctly", () => {
      const zeroBalance = {
        locked: "0",
        unlocked: "0",
        stashed: "0",
      };

      const { container } = render(
        <BalanceTooltip balance={zeroBalance}>
          <button className="flex flex-row items-center">Hover for balance</button>
        </BalanceTooltip>
      );

      const tooltipTrigger = container.querySelector(".flex.flex-row.items-center");
      fireEvent.mouseEnter(tooltipTrigger!);

      const balanceRows = screen.getAllByText("0.000 ETH");
      expect(balanceRows).toHaveLength(3);
    });
  });
}); 