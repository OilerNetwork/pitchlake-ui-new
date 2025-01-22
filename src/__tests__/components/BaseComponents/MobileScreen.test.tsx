import { render, screen } from "@testing-library/react";
import MobileScreen from "../../../components/BaseComponents/MobileScreen";

describe("MobileScreen Component", () => {
  it("renders mobile warning screen with correct content", () => {
    const { container } = render(<MobileScreen />);
    
    const warningContainer = container.querySelector(".mobile-warning");
    expect(warningContainer).toBeInTheDocument();
    
    // Check warning icon
    const warningIcon = warningContainer?.querySelector(".warning-icon");
    expect(warningIcon).toBeInTheDocument();
    expect(warningIcon).toHaveTextContent("!");
    
    // Check warning message
    const messageContainer = warningContainer?.querySelector(".warning-message");
    expect(messageContainer?.querySelector("h1")).toHaveTextContent("Device Not Supported");
    expect(messageContainer?.querySelector("p")).toHaveTextContent("Please use a desktop or laptop to access Pitchlake.");
  });
}); 