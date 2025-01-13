"use client";
import VaultCard from "@/components/VaultCard/VaultCard";
import useWebSocketHome from "@/hooks/websocket/useWebSocketHome";
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

  return (
    <div className="px-4 sm:px-8 pt-[84px] sm:pt-[100px] pb-4 sm:pb-8">
      {chain.network !== "mainnet" && (
        <div className="max-w-[1920px] mx-auto">
          <p className="my-2 text-base text-white-alt py-2 font-medium">
            Popular Vaults
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {vaults?.map((vault: string, index: number) => (
              <VaultCard key={index} vaultAddress={vault} />
            ))}
          </div>
        </div>
      )}

      {chain.network === "mainnet" && (
        <div className="fixed inset-0 flex items-center justify-center text-error-400 text-center px-4">
          <p className="text-[40px] leading-tight max-w-[80%]">
            Mainnet is not yet released. Please switch to a supported network
          </p>
        </div>
      )}
    </div>
  );
}

