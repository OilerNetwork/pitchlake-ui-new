"use client";
import { Vault } from "@/components/Vault/Vault";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useEffect } from "react";

export default function Home({
  params: { address },
}: {
  params: { address: string };
}) {
  const { setVaultAddress } = useProtocolContext();

  const {status} = useAccount()
  useEffect(() => {
    if (status === "disconnected") {
      // on disconnect
      console.log("disconnected from vault");
    } else if (status === "connected") {
      // on connect
      console.log("connected to vault");
    }
  }, [status]);
  useEffect(() => {
    if (address) {
      setVaultAddress(address);
    }
  }, [address]);

  return <Vault />;
}
