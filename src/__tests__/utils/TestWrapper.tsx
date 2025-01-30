import React from 'react';
import { render } from '@testing-library/react';
import { ReactNode } from "react";
import { HelpProvider } from "@/context/HelpProvider";
import { useProtocolContext } from "@/context/ProtocolProvider";

// Mock the protocol context
jest.mock("@/context/ProtocolProvider", () => ({
  useProtocolContext: jest.fn().mockReturnValue({
    selectedRoundState: {
      roundId: "1",
      startTimestamp: "1000",
      duration: "1000",
      roundState: "Auctioning"
    },
    connectionType: "mock",
  }),
}));

interface TestWrapperProps {
  children: ReactNode;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ children }) => {
  return (
    <HelpProvider>
      {children}
    </HelpProvider>
  );
};

export const renderWithProviders = (ui: ReactNode) => {
  return render(<TestWrapper>{ui}</TestWrapper>);
};

// Add tests for the wrapper itself
describe('TestWrapper', () => {
  it('provides help context to children', () => {
    const { container } = render(
      <TestWrapper>
        <div>Test Child</div>
      </TestWrapper>
    );
    expect(container).toBeInTheDocument();
  });
});
