import { useNewContext } from "@/context/NewProvider";
import { vaultABI } from "@/lib/abi";
import { LiquidityProviderStateType } from "@/lib/types";
import { useAccount, useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { BlockTag } from "starknet";

const useLPStateRPC = () => {
  const { conn, vaultAddress } = useNewContext();
  const contractData = useMemo(() => {
    return {
      abi: vaultABI,
      address:
        conn === "rpc" || conn === "demo"
          ? (vaultAddress as `0x${string}`)
          : undefined,
    };
  }, [vaultAddress, conn]);

  const { account } = useAccount();

  const { data: lockedBalance } = useContractRead({
    ...contractData,
    blockIdentifier: BlockTag.PENDING,
    watch: true,
    functionName: "get_account_locked_balance",
    args: [account?.address as string],
  });
  const { data: unlockedBalance } = useContractRead({
    ...contractData,
    blockIdentifier: BlockTag.PENDING,
    watch: true,
    functionName: "get_account_unlocked_balance",
    args: [account?.address as string],
  });
  const { data: stashedBalance } = useContractRead({
    ...contractData,
    blockIdentifier: BlockTag.PENDING,
    watch: true,
    functionName: "get_account_stashed_balance",
    args: [account?.address as string],
  });
  const { data: queuedBps } = useContractRead({
    ...contractData,
    blockIdentifier: BlockTag.PENDING,
    watch: true,
    functionName: "get_account_queued_bps",
    args: [account?.address as string],
  });
  return {
    address: account?.address,
    lockedBalance,
    unlockedBalance,
    stashedBalance,
    queuedBps,
  } as LiquidityProviderStateType;
};

export default useLPStateRPC;
