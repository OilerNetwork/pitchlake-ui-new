"use client";
import WrongNetworkScreen from "@/components/WrongNetworkScreen";
import MobileScreen from "@/components/BaseComponents/MobileScreen";
import VaultCard from "@/components/VaultCard/VaultCard";
import useWebSocketHome from "@/hooks/websocket/useWebSocketHome";
import useIsMobile from "@/hooks/window/useIsMobile";
import { useNetwork } from "@starknet-react/core";

export default function Home() {
  const { vaults: wsVaults } = useWebSocketHome();
  const { chain } = useNetwork();
  // @NOTE filtering done in this order to maintain correct ordering (until proper vault sorting is implemented)
  // TODO: Switch back to env var for this
  const vaults =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "demo"
      ? ["0x0677ead18a571524525eb1d5fbb18431efe869f07d700f03aa66ad0abb5de01d"]
      : process.env.NEXT_PUBLIC_ENVIRONMENT === "ws"
        ? [
            "0x2e0f81a9f5179c2be73cabeb92e8a6e526add4bab32e4855aa5522690c78217",
            "0x7edaf2d262f347619f24eaa11cdc7ae125e373843d5248368887fea4aa8ee7d",
            "0x19809922504ef98d98a406d12b2a67205a10294d3bf38f047e40239ce04c949",
          ].filter((addr) => wsVaults?.includes(addr))
        : [
            "0x0319254349e3ed8b3150dfdcb60a8a53163c391c36a82a2f7dc5aa057b548762",
            "0x07b9ffdf0c261788e00fb608f13ca03ec124ff14899ef3528f4a8d10971c92b9",
            "0x056ef4600198ea8692da0174970810d04f097b27dd94eb24efe5cde2dbab262a",
          ];

  //process.env.NEXT_PUBLIC_VAULT_ADDRESSES?.split(",");

  const { isMobile } = useIsMobile();

  if (isMobile) return <MobileScreen />;

  return (
    <div
      className={`flex flex-grow flex-col px-8  pt-[84px] py-4  w-full bg-faded-black-alt `}
    >
      {
        //Disable mainnet
        chain.network !== "mainnet" && (
          <div>
            <p className="my-2 mt-4 text-base text-white-alt py-2 font-medium">
              Popular Vaults
            </p>
            <div className="grid grid-cols-2 w-full pt-2 gap-x-6 gap-y-6">
              {vaults?.map((vault: string, index: number) => (
                // <VaultTimeline key={vault.address + idx.toString()} vault={vault} />
                <VaultCard key={index} vaultAddress={vault} />
              ))}

              {/* <CreateVault {...{ handleCreateClick }} /> */}
            </div>
          </div>
        )
      }
      {chain.network === "mainnet" && <WrongNetworkScreen />}
    </div>
  );
}
