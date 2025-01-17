import { render, screen } from "@testing-library/react";
import Home from "../../app/page";
import { useNetwork } from "@starknet-react/core";
import useWebSocketHome from "../../hooks/websocket/useWebSocketHome";
import useIsMobile from "../../hooks/window/useIsMobile";
import VaultCard from "../../components/VaultCard/VaultCard";

// Mock hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useNetwork: jest.fn(),
}));

jest.mock("../../hooks/websocket/useWebSocketHome", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../hooks/window/useIsMobile", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../components/VaultCard/VaultCard", () => ({
  __esModule: true,
  default: jest.fn(({ vaultAddress }: { vaultAddress: string }) => (
    <div data-testid={`mocked-vault-${vaultAddress}`}>
      Mocked Vault {vaultAddress}
    </div>
  )),
}));

type MockHookParams = {
  isMobile?: boolean;
  network?: string;
  vaults?: string[];
};

const mockHooks = ({ isMobile, network, vaults }: MockHookParams) => {
  (useIsMobile as jest.Mock).mockReturnValue({ isMobile: isMobile ?? false });
  (useNetwork as jest.Mock).mockReturnValue({
    chain: { network: network ?? "testnet" },
  });
  (useWebSocketHome as jest.Mock).mockReturnValue({ vaults: vaults ?? [""] });
};

describe("Home Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the MobileScreen component when isMobile is true", () => {
    mockHooks({ isMobile: true });
    render(<Home />);
    expect(screen.getByText(/device not supported/i)).toBeInTheDocument();
  });

  it("renders the vaults when the environment is 'ws'", () => {
    mockHooks({
      isMobile: false,
      network: "testnet",
      vaults: [
        "0x2e0f81a9f5179c2be73cabeb92e8a6e526add4bab32e4855aa5522690c78217",
        "0x7edaf2d262f347619f24eaa11cdc7ae125e373843d5248368887fea4aa8ee7d",
      ],
    });
    process.env.NEXT_PUBLIC_ENVIRONMENT = "ws";

    render(<Home />);
    expect(screen.getByText(/popular vaults/i)).toBeInTheDocument();
    expect(screen.getByTestId("mocked-vault-0x2e0f81a9f5179c2be73cabeb92e8a6e526add4bab32e4855aa5522690c78217")).toBeInTheDocument();
    expect(screen.getByTestId("mocked-vault-0x7edaf2d262f347619f24eaa11cdc7ae125e373843d5248368887fea4aa8ee7d")).toBeInTheDocument();
  });

  it("renders the vaults when the environment is not 'ws'", () => {
    mockHooks({ isMobile: false, network: "testnet" });
    process.env.NEXT_PUBLIC_ENVIRONMENT = "other";
    process.env.NEXT_PUBLIC_VAULT_ADDRESSES = "0x123,0x456";

    render(<Home />);
    expect(screen.getByText(/popular vaults/i)).toBeInTheDocument();
    expect(screen.getByTestId("mocked-vault-0x123")).toBeInTheDocument();
    expect(screen.getByTestId("mocked-vault-0x456")).toBeInTheDocument();
  });

  it("renders the mainnet warning when the network is 'mainnet'", () => {
    mockHooks({ isMobile: false, network: "mainnet" });

    render(<Home />);
    expect(screen.getByText(/mainnet is not yet released/i)).toBeInTheDocument();
  });
});
