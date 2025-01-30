import { screen } from "@testing-library/react";
import PanelLeft from "@/components/Vault/PanelLeft";
import { renderWithProviders } from "@/__tests__/utils/TestWrapper";
import { HelpProvider } from "@/context/HelpProvider";

// Mock the hooks
jest.mock("@starknet-react/core", () => ({
  useExplorer: () => ({
    getTransactionUrl: jest.fn(),
    getAddressUrl: jest.fn(),
    contract: jest.fn(),
  }),
  useProvider: () => ({
    provider: {
      getBlock: jest.fn(),
    },
  }),
  useAccount: () => ({
    account: {
      address: "0x123"
    }
  }),
}));

describe("PanelLeft Component", () => {
  it("renders panel sections", () => {
    renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>
    );

    // Check section headers
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Vault")).toBeInTheDocument();
  });

  it("renders correctly for both user types", () => {
    // Test LP view
    const { rerender } = renderWithProviders(
      <HelpProvider>
        <PanelLeft userType="lp" />
      </HelpProvider>
    );
    
    // Test OB view
    rerender(
      <HelpProvider>
        <PanelLeft userType="ob" />
      </HelpProvider>
    );
  });
}); 