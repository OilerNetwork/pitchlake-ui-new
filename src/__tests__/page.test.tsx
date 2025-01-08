import { render, screen } from "@testing-library/react";
import Home from "../app/page";
import { useAccount, useNetwork, useReadContract } from "@starknet-react/core";
import useWebSocketHome from "../hooks/websocket/useWebSocketHome";
import useIsMobile from "../hooks/window/useIsMobile";
import useVaultState from "../hooks/vault/useVaultState";
import { useProvider } from "@starknet-react/core";
import useRoundState from "../hooks/optionRound/state/useRoundState";
import { useRouter } from "next/navigation";
// Mock hooks
jest.mock("@starknet-react/core", () => ({
  __esModule: true,
  useNetwork: jest.fn(),
  useProvider: jest.fn(),
  useReadContract: jest.fn(),
  useAccount:jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));
jest.mock("../hooks/websocket/useWebSocketHome", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock ("../hooks/vault/useVaultState",()=>({
  __esModule:true,
  default:jest.fn()
}))
jest.mock ("../hooks/optionRound/state/useRoundState",()=>({
  __esModule:true,
  default:jest.fn()
}))
jest.mock("../hooks/window/useIsMobile", () => ({
  __esModule: true, // This makes sure Jest treats it as a module with exports
  default: jest.fn(), // Mock the default export
}));
jest.mock("../hooks/window/useIsMobile", () => ({
  __esModule: true, // This makes sure Jest treats it as a module with exports
  default: jest.fn(), // Mock the default export
}));

describe("Home Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the MobileScreen component when isMobile is true", () => {
    (useIsMobile as jest.Mock).mockReturnValue({ isMobile: false });
    (useNetwork as jest.Mock).mockReturnValue({
      chain: { network: "testnet" },
    });
    (useWebSocketHome as jest.Mock).mockReturnValue({ vaults: [""] });

    (useRouter as jest.Mock).mockReturnValue({
      pathname: "/home",
      push: jest.fn(),
    });

    (useProvider as jest.Mock)
      .mockReturnValue({
        provider: {
          getBlock: () => "1",
          getChainId: () => "1",
        },
      });
      (useReadContract as jest.Mock)
      .mockReturnValue({
        data: {},
      });
      (useAccount as jest.Mock)
      .mockReturnValue({
        account: {},
      });
      (useVaultState as jest.Mock).mockReturnValue({
        vaultState:{
          selectedRoundAddress:"0x123"
        }
      });

      (useRoundState as jest.Mock).mockReturnValue({
        roundState:{
          roundState:{
            activeVariant:"Open"
          }
        }
      })
    render(<Home />);
    screen.debug();
    expect(screen.getByText(/popular/i)).toBeInTheDocument();
  });
});
