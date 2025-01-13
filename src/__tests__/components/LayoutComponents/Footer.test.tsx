import { render, screen } from "@testing-library/react";
import Footer from "../../../components/LayoutComponents/Footer";
import useIsMobile from "../../../hooks/window/useIsMobile";

// Mock the useIsMobile hook
jest.mock("../../../hooks/window/useIsMobile", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("Footer Component", () => {
  beforeEach(() => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
  });

  it("renders copyright text", () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`Copyright © ${currentYear} by Oiler`)).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Footer />);
    
    const links = [
      { text: "Terms of Service", href: "/terms" },
      { text: "Legal & Risk Disclosure", href: "/legal" },
      { text: "Privacy Policy", href: "/privacy" },
      { text: "Documentation", href: "/docs" },
    ];

    links.forEach(link => {
      const element = screen.getByText(link.text);
      expect(element).toBeInTheDocument();
      expect(element.closest('a')).toHaveAttribute('href', link.href);
    });
  });

  it("renders social media links", () => {
    const { container } = render(<Footer />);
    
    const socialLinks = [
      { href: "https://twitter.com/OilerNetwork", testId: "twitter-link" },
      { href: "https://discord.com/invite/qd5AAJPBsq", testId: "discord-link" },
      { href: "https://t.me/oiler_official", testId: "telegram-link" },
    ];

    // Find all social media links
    const socialIcons = container.querySelectorAll('.flex.items-center.gap-4.ml-4 a');
    expect(socialIcons).toHaveLength(socialLinks.length);

    // Check each link's href
    socialIcons.forEach((icon, index) => {
      expect(icon).toHaveAttribute('href', socialLinks[index].href);
      expect(icon).toHaveAttribute('target', '_blank');
    });
  });

  it("does not render when isMobile is true", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });
}); 