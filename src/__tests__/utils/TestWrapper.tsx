import React from "react";
import { render } from "@testing-library/react";
import { ReactNode } from "react";
import { HelpProvider } from "@/context/HelpProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UiProvider } from "@/context/UiProvider";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <UiProvider>
        <HelpProvider>{children}</HelpProvider>
      </UiProvider>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (ui: ReactNode) => {
  return render(<TestWrapper>{ui}</TestWrapper>);
};

// Add tests for the wrapper itself
describe("TestWrapper", () => {
  it("provides required contexts to children", () => {
    const { container } = render(
      <TestWrapper>
        <div>Test Child</div>
      </TestWrapper>,
    );
    expect(container).toBeInTheDocument();
  });
});
