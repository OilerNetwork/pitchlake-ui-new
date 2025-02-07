import React from "react";
import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { HelpProvider } from "@/context/HelpProvider";
import { useNewContext } from "@/context/NewProvider";

// Mock the new context
jest.mock("@/context/NewProvider", () => ({
  useNewContext: jest.fn().mockReturnValue({
    conn: "rpc",
    wsData: {
      wsOptionBuyerStates: [],
      wsRoundStates: [{
        roundId: "1",
        startTimestamp: "1000",
        duration: "1000",
        roundState: "Open",
      }],
    },
    mockData: {
      optionBuyerStates: [],
      roundStates: [],
    },
  }),
}));

interface TestWrapperProps {
  children: ReactNode;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return <HelpProvider>{children}</HelpProvider>;
};

export const renderWithProviders = (ui: ReactNode) => {
  return render(<TestWrapper>{ui}</TestWrapper>);
};

// Add tests for the wrapper itself
describe("TestWrapper", () => {
  it("provides help context to children", () => {
    const { container } = render(
      <TestWrapper>
        <div>Test Child</div>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
