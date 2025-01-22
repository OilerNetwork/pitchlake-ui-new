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

  it("renders vault layout and handles interactions", () => {
    const { container } = render(<Vault />);
    
    // Check initial desktop layout
    const chart = container.querySelector(".vault-chart");
    const leftPanel = container.querySelector(".panel-left-lp");
    const rightPanel = container.querySelector(".panel-right-lp");
    
    expect(chart).toBeInTheDocument();
    expect(leftPanel).toBeInTheDocument();
    expect(rightPanel).toBeInTheDocument();
    
    // Test view switching
    const buyerTab = screen.getByText("Buyer").closest(".view-tab");
    fireEvent.click(buyerTab!);
    
    expect(container.querySelector(".panel-left-ob")).toBeInTheDocument();
    expect(container.querySelector(".panel-right-ob")).toBeInTheDocument();
    expect(buyerTab).toHaveClass("bg-primary-900");
    expect(screen.getByText("Buyer")).toHaveClass("text-primary");
    expect(screen.getByText("Provider")).toHaveClass("text-greyscale");
    
    // Test back navigation
    const backButton = container.querySelector(".back-button");
    fireEvent.click(backButton!);
    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("renders mobile view when on mobile device", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    const { container } = render(<Vault />);
    expect(container.querySelector(".mobile-screen")).toBeInTheDocument();
  });
}); 