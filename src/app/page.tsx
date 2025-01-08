"use client";
import MobileScreen from "@/components/BaseComponents/MobileScreen";
import VaultCard from "@/components/VaultCard/VaultCard";
import useWebSocketHome from "@/hooks/websocket/useWebSocketHome";
import useIsMobile from "@/hooks/window/useIsMobile";
import { useNetwork } from "@starknet-react/core";

export default function Home() {
  const { vaults: wsVaults } = useWebSocketHome();
  const { chain } = useNetwork();
  // @NOTE filtering done in this order to maintain correct ordering (until proper vault sorting is implemented)
  const vaults =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "ws"
      ? [
          "0x2e0f81a9f5179c2be73cabeb92e8a6e526add4bab32e4855aa5522690c78217",
          "0x7edaf2d262f347619f24eaa11cdc7ae125e373843d5248368887fea4aa8ee7d",
          "0x19809922504ef98d98a406d12b2a67205a10294d3bf38f047e40239ce04c949",
        ].filter((addr) => wsVaults?.includes(addr))
      : process.env.NEXT_PUBLIC_VAULT_ADDRESSES?.split(",");

  const { isMobile } = useIsMobile();

  if (isMobile) {
    return <MobileScreen />;
  }

  return (
    <div
      className={`flex flex-grow flex-col px-8 py-4 pt-[84px]  w-full bg-faded-black-alt ${
        chain.network === "mainnet"?"opacity-90":""
      } `}
    >
      {
      //Disable mainnet
     
      (
        <div>
          <p className="my-2 text-base text-white-alt py-2 font-medium">
            Popular Vaults
          </p>
          <div className="grid grid-cols-2 w-full pt-4 gap-x-6 gap-y-6">
            {vaults?.map((vault: string, index: number) => (
              // <VaultTimeline key={vault.address + idx.toString()} vault={vault} />
              <VaultCard key={index} vaultAddress={vault} />
            ))}

            {/* <CreateVault {...{ handleCreateClick }} /> */}
          </div>
        </div>
      )}

{
  chain.network === "mainnet"&&
//Disabled Mainnet Prompt
<div className="fixed h-full w-full text-error-900 justify-center text-center mt-[-40px] text-[40px]  flex flex-col">
  <p>
    {
      "Mainnet is not yet released. Please switch to a supported network"
    }
  </p>
  </div>
}
      {
        // <CreateVaultModal isModalVisible={isModalVisible} closeModal={() => setIsModalVisible(false)} />
      }
    </div>
  );
}
