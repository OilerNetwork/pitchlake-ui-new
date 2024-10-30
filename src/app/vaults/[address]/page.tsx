"use client"
import { Vault } from "@/components/Vault/Vault";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useEffect } from "react";

export default function Home({
  params: { address },
}: {
  params: { address: string };
}) {
  const { vaultAddress,setVaultAddress } = useProtocolContext();
  useEffect(() => {
    if (address && address.toLowerCase()!==vaultAddress?.toLowerCase()){
       setVaultAddress(address);}
  }, []);
  return <Vault />;
}
