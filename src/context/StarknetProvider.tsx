"use client";
import React from "react";
import { RpcProvider } from "starknet";
import { sepolia, mainnet, devnet, Chain } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
  useNetwork,
  argent,
  braavos,
  useInjectedConnectors,
  voyager,
  jsonRpcProvider,
} from "@starknet-react/core";
import { Provider } from "starknet";

export const StarknetProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "alphabetical",
  });

  function rpc(chain: Chain) {
    switch (chain.network) {
      case "sepolia":
        return {
          nodeUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA,
        };
      case "mainnet":
        return {
          nodeUrl: process.env.NEXT_PUBLIC_RPC_URL_MAINNET,
        };

      case "devnet":
        return {
          nodeUrl: process.env.NEXT_PUBLIC_RPC_URL_DEVNET,
        };
      default:
        return {
          nodeUrl: process.env.NEXT_PUBLIC_RPC_URL_DEVNET,
        };
    }
  }
  const provider = jsonRpcProvider({ rpc });

  return (
    <StarknetConfig
      chains={[sepolia, mainnet, devnet]}
      provider={provider}
      connectors={connectors}
      explorer={voyager}
      autoConnect={true}
    >
      {children}
    </StarknetConfig>
  );
};
