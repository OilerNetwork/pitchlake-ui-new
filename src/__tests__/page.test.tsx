import { render, screen } from "@testing-library/react";
import Home from "../app/page";
import { useAccount, useNetwork, useReadContract } from "@starknet-react/core";
import useWebSocketHome from "../hooks/websocket/useWebSocketHome";
import useIsMobile from "../hooks/window/useIsMobile";
import useVaultState from "../hooks/vault/useVaultState";
import { useProvider } from "@starknet-react/core";
import useRoundState from "../hooks/optionRound/state/useRoundState";
import { useRouter } from "next/navigation";
import VaultCard from "../components/VaultCard/VaultCard";
// Mock hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useNetwork: jest.fn(),
}));

jest.mock("../components/VaultCard/VaultCard", () => ({
  __esModule: true,
  default: jest.fn(({ vaultAddress }: { vaultAddress: string }) => (
    <div data-testid={`mocked-child-${vaultAddress}`}>
      Mocked Child {vaultAddress}
    </div>
  )),
}));

jest.mock("../hooks/websocket/useWebSocketHome", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../hooks/window/useIsMobile", () => ({
  __esModule: true, // This makes sure Jest treats it as a module with exports
  default: jest.fn(), // Mock the default export
}));

type MockHookParams = {
  isMobile?:boolean,
  network?:string,
  vaults?:string[]
}
const mockHooks = ({isMobile,network,vaults}:MockHookParams) => {
  (useIsMobile as jest.Mock).mockReturnValue({ isMobile:isMobile??false });
  (useNetwork as jest.Mock).mockReturnValue({
    chain: { network:network??"testnet" },
  });
  (useWebSocketHome as jest.Mock).mockReturnValue({ vaults:vaults??[""]});
};


describe("Home Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the MobileScreen component when isMobile is true", () => {
    mockHooks({
      isMobile:true,
    });

    render(<Home />);
    screen.debug();
    
    //Update to checks for MobileScreen
    expect(screen.getByText(/device not supported/i)).toBeInTheDocument();
  });
  it("renders the default screen component when isMobile is true", () => {
    mockHooks({
      isMobile:false,
    });
    render(<Home />);
    screen.debug();
    expect(screen.getByText(/popular/i)).toBeInTheDocument();
  });
});
