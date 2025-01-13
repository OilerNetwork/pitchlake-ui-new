import { render, screen } from "@testing-library/react";
import MobileScreen from "../../../components/BaseComponents/MobileScreen";

describe("MobileScreen Component", () => {
  it("renders the mobile warning message", () => {
    render(<MobileScreen />);
    
    expect(screen.getByText("Device Not Supported")).toBeInTheDocument();
    expect(
      screen.getByText("Please use a desktop or laptop to access Pitchlake.")
    ).toBeInTheDocument();
  });

  it("renders the warning icon", () => {
    render(<MobileScreen />);
    
    const warningIcon = screen.getByText("!");
    expect(warningIcon).toBeInTheDocument();
  });
}); 