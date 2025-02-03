import { useAccount } from "@starknet-react/core";
import { vaultABI } from "@/lib/abi";
import { useMemo } from "react";
import useVaultStateRPC from "./rpc/useVaultStateRPC";
import { useNewContext } from "@/context/NewProvider";
import useMockVault from "./mock/useMockVault";

const useVaultState = (address: string | undefined) => {
  const { conn, selectedRound, vaultAddress, wsData } = useNewContext();
  const contractData = useMemo(() => {
    return {
      abi: vaultABI,
      address: conn === "rpc" ? (address as `0x${string}`) : undefined,
    };
  }, [address, conn]);

  const actionsContractData = useMemo(() => {
    return {
      abi: vaultABI,
      address: address as `0x${string}`,
    };
  }, [address]);
  const { account } = useAccount();

  const { vaultState: vaultStateRPC } = useVaultStateRPC({
    conn,
    address: vaultAddress,
    selectedRound,
  });

  const { vaultState: vaultStateMock } = useMockVault({
    selectedRound,
    address: vaultAddress,
  });
  const vaultState =
    conn === "rpc"
      ? vaultStateRPC
      : conn === "ws"
      ? wsData.wsVaultState
      : vaultStateMock;

      return vaultState
  //Read States

  //States without a param
};

export default useVaultState;
