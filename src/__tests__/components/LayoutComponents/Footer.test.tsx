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

  it("renders footer with navigation and social links", () => {
    const { container } = render(<Footer />);
    
    // Check footer container
    const footer = container.querySelector(".flex.flex-col.md\\:flex-row");
    expect(footer).toBeInTheDocument();

    // Check copyright section
    const currentYear = new Date().getFullYear();
    const copyright = footer?.querySelector(".text-sm.text-[var\\(--buttongrey\\)]");
    expect(copyright).toHaveTextContent(`Copyright © ${currentYear} by Oiler`);

    // Check navigation links
    const navLinks = [
      { text: "Terms of Service", href: "/terms" },
      { text: "Legal & Risk Disclosure", href: "/legal" },
      { text: "Privacy Policy", href: "/privacy" },
      { text: "Documentation", href: "/docs" },
    ];

    const navigation = footer?.querySelector(".flex.flex-col.md\\:flex-row.gap-4");
    expect(navigation).toBeInTheDocument();

    navLinks.forEach(({ text, href }) => {
      const link = navigation?.querySelector(`a[href="${href}"]`);
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(text);
      expect(link).toHaveClass("text-sm", "text-[var(--buttongrey)]", "hover:text-white");
    });

    // Check social links
    const socialLinks = [
      { href: "https://twitter.com/OilerNetwork", className: "twitter" },
      { href: "https://discord.com/invite/qd5AAJPBsq", className: "discord" },
      { href: "https://t.me/oiler_official", className: "telegram" },
    ];

    const socialContainer = footer?.querySelector(".flex.gap-4");
    expect(socialContainer).toBeInTheDocument();

    socialLinks.forEach(({ href, className }) => {
      const link = socialContainer?.querySelector(`a[href="${href}"]`);
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("target", "_blank");
      expect(link?.querySelector(`.${className}-icon`)).toBeInTheDocument();
    });
  });

  it("does not render on mobile", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: true });
    const { container } = render(<Footer />);
    expect(container.firstChild).toBeNull();
  });
}); 