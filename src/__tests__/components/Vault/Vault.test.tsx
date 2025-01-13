import { render, screen, fireEvent } from "@testing-library/react";
import { Vault } from "../../../components/Vault/Vault";
import useIsMobile from "../../../hooks/window/useIsMobile";
import { useRouter } from "next/navigation";

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
  default: () => <div data-testid="mock-chart">Chart</div>,
}));

jest.mock("../../../components/Vault/PanelLeft", () => ({
  __esModule: true,
  default: ({ userType }: { userType: string }) => (
    <div data-testid={`mock-panel-left-${userType}`}>Panel Left</div>
  ),
}));

jest.mock("../../../components/Vault/PanelRight", () => ({
  __esModule: true,
  default: ({ userType, isEditOpen, setIsEditOpen }: { userType: string; isEditOpen: boolean; setIsEditOpen: (value: boolean) => void }) => (
    <div data-testid={`mock-panel-right-${userType}`}>Panel Right</div>
  ),
}));

jest.mock("../../../components/BaseComponents/MobileScreen", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-mobile-screen">Mobile Screen</div>,
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

  it("renders mobile screen when on mobile device", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    render(<Vault />);
    expect(screen.getByTestId("mock-mobile-screen")).toBeInTheDocument();
  });

  it("renders vault details with provider view by default", () => {
    render(<Vault />);
    
    // Check header
    expect(screen.getByText("Vault Details")).toBeInTheDocument();
    
    // Check provider/buyer toggle
    expect(screen.getByText("Provider")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();
    
    // Check panels
    expect(screen.getByTestId("mock-panel-left-lp")).toBeInTheDocument();
    expect(screen.getByTestId("mock-panel-right-lp")).toBeInTheDocument();
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  it("switches between provider and buyer views", () => {
    render(<Vault />);
    
    // Initially in provider view
    expect(screen.getByTestId("mock-panel-left-lp")).toBeInTheDocument();
    
    // Switch to buyer view
    fireEvent.click(screen.getByText("Buyer"));
    expect(screen.getByTestId("mock-panel-left-ob")).toBeInTheDocument();
    expect(screen.getByTestId("mock-panel-right-ob")).toBeInTheDocument();
    
    // Switch back to provider view
    fireEvent.click(screen.getByText("Provider"));
    expect(screen.getByTestId("mock-panel-left-lp")).toBeInTheDocument();
    expect(screen.getByTestId("mock-panel-right-lp")).toBeInTheDocument();
  });

  it("navigates back when clicking back button", () => {
    const { container } = render(<Vault />);
    
    const backButton = container.querySelector('.back-button');
    fireEvent.click(backButton!);
    
    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("updates styling based on selected view", () => {
    render(<Vault />);
    
    // Initially provider view is selected
    const providerTab = screen.getByText("Provider").closest("div");
    expect(providerTab).toHaveClass("bg-primary-900");
    expect(screen.getByText("Provider")).toHaveClass("text-primary");
    
    // Switch to buyer view
    fireEvent.click(screen.getByText("Buyer"));
    const buyerTab = screen.getByText("Buyer").closest("div");
    expect(buyerTab).toHaveClass("bg-primary-900");
    expect(screen.getByText("Buyer")).toHaveClass("text-primary");
    expect(providerTab).not.toHaveClass("bg-primary-900");
    expect(screen.getByText("Provider")).toHaveClass("text-greyscale");
  });
}); 