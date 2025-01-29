import { render, screen, fireEvent } from "@testing-library/react";
import { Vault } from "../../../components/Vault/Vault";
import useIsMobile from "../../../hooks/window/useIsMobile";
import { useRouter } from "next/navigation";
import { TestWrapper } from "../../utils/TestWrapper";

// Mock the hooks
jest.mock("../../../hooks/window/useIsMobile", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the child components
jest.mock("../../../components/Vault/VaultChart/Chart", () => ({
  __esModule: true,
  default: () => <div className="vault-chart">Chart</div>,
}));

jest.mock("../../../components/Vault/PanelLeft", () => ({
  __esModule: true,
  default: ({ userType }: { userType: string }) => (
    <div className={`panel-left-${userType}`}>Panel Left</div>
  ),
}));

jest.mock("../../../components/Vault/PanelRight", () => ({
  __esModule: true,
  default: ({ userType, isEditOpen, setIsEditOpen }: { userType: string; isEditOpen: boolean; setIsEditOpen: (value: boolean) => void }) => (
    <div className={`panel-right-${userType}`}>Panel Right</div>
  ),
}));

jest.mock("../../../components/BaseComponents/MobileScreen", () => ({
  __esModule: true,
  default: () => <div className="mobile-screen">Mobile Screen</div>,
}));

describe("Vault Component", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("renders desktop layout when not mobile", () => {
    render(
      <TestWrapper>
        <Vault />
      </TestWrapper>
    );
    
    // Check initial desktop layout
    const chart = screen.getByText("Chart");
    const leftPanel = screen.getByText("Panel Left");
    const rightPanel = screen.getByText("Panel Right");
    
    expect(chart).toBeInTheDocument();
    expect(leftPanel).toBeInTheDocument();
    expect(rightPanel).toBeInTheDocument();
    
    // Test view switching
    const buyerTab = document.querySelector('.buyer-tab');
    if (!buyerTab) throw new Error('Buyer tab not found');
    fireEvent.click(buyerTab);
    
    expect(screen.getByText("Panel Left")).toBeInTheDocument();
    expect(screen.getByText("Panel Right")).toBeInTheDocument();
    
    // Test back navigation
    const backButton = document.querySelector('.back-button-container');
    if (!backButton) throw new Error('Back button not found');
    fireEvent.click(backButton.querySelector('.back-button')!);
    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("renders mobile layout when mobile", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    render(
      <TestWrapper>
        <Vault />
      </TestWrapper>
    );
    expect(screen.getByText("Mobile Screen")).toBeInTheDocument();
  });
}); 