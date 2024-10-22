"use client";
import React from "react";
import { RpcProvider } from "starknet";
import { sepolia, mainnet, devnet, Chain } from "@starknet-react/chains";
import {
  StarknetConfig,
  publicProvider,
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

  // function rpc(chain: Chain) {
  //   return {
  //     nodeUrl: `https://{chain.network}.example.org`,
  //   };
  // }

  function rpc(chain: Chain) {
    return {
      nodeUrl: `http://localhost:5050/rpc`,
    };
  }
  const provider = jsonRpcProvider({ rpc });

  return (
    <StarknetConfig
      chains={[sepolia]}
      //chains={[mainnet, sepolia, devnet]}
      provider={provider}
      connectors={connectors}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
};
