import { render, screen } from "@testing-library/react";
import Home from "../../app/page";
import { useNetwork } from "@starknet-react/core";
import useWebSocketHome from "../../hooks/websocket/useWebSocketHome";
import useIsMobile from "../../hooks/window/useIsMobile";
import VaultCard from "../../components/VaultCard/VaultCard";

// Mock hooks
jest.mock("@starknet-react/core", () => ({
  useNetwork: jest.fn(),
}));

jest.mock("../../hooks/websocket/useWebSocketHome", () => jest.fn());
jest.mock("../../hooks/window/useIsMobile", () => jest.fn());
jest.mock("../../components/VaultCard/VaultCard", () => ({
  __esModule: true,
  default: jest.fn(({ vaultAddress }: { vaultAddress: string }) => (
    <div data-testid={`vault-${vaultAddress}`}>Vault {vaultAddress}</div>
  )),
}));

type MockHookParams = {
  network?: string;
  vaults?: string[];
};

const mockHooks = ({ network = "testnet", vaults = [""] }: MockHookParams = {}) => {
  (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
  (useNetwork as jest.Mock).mockReturnValue({ chain: { network } });
  (useWebSocketHome as jest.Mock).mockReturnValue({ vaults });
};

describe("Home Component", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Network handling", () => {
    it("renders mainnet warning when network is mainnet", () => {
      mockHooks({ network: "mainnet" });
      render(<Home />);
      expect(screen.getByText(/mainnet is not yet released/i)).toBeInTheDocument();
    });

    it("renders content when network is testnet", () => {
      mockHooks({ network: "testnet" });
      render(<Home />);
      expect(screen.getByText(/popular vaults/i)).toBeInTheDocument();
    });
  });

  describe("Vault rendering", () => {
    const testVaults = [
      "0x2e0f81a9f5179c2be73cabeb92e8a6e526add4bab32e4855aa5522690c78217",
      "0x7edaf2d262f347619f24eaa11cdc7ae125e373843d5248368887fea4aa8ee7d",
    ];

    it("renders vaults from websocket when environment is 'ws'", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "ws";
      mockHooks({ vaults: testVaults });

      render(<Home />);
      
      testVaults.forEach(vault => {
        expect(screen.getByTestId(`vault-${vault}`)).toBeInTheDocument();
      });
    });

    it("renders vaults from env variables when environment is not 'ws'", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "other";
      process.env.NEXT_PUBLIC_VAULT_ADDRESSES = "0x123,0x456";
      mockHooks({});

      render(<Home />);
      
      ["0x123", "0x456"].forEach(vault => {
        expect(screen.getByTestId(`vault-${vault}`)).toBeInTheDocument();
      });
    });

    it("handles empty vault list gracefully", () => {
      process.env.NEXT_PUBLIC_ENVIRONMENT = "ws";
      mockHooks({ vaults: [] });

      render(<Home />);
      expect(screen.getByText(/popular vaults/i)).toBeInTheDocument();
      expect(screen.queryByTestId(/^vault-/)).not.toBeInTheDocument();
    });
  });
});
