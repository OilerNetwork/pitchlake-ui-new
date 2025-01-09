import { vaultABI } from "@/lib/abi";
import { LiquidityProviderStateType } from "@/lib/types";
import useContractReads from "@/lib/useContractReads";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

const useLPState = (vaultAddress: string|undefined, conn: string) => {
  const contractData = useMemo(() => {
    return {
      abi: vaultABI,
      address: conn === "rpc" ? vaultAddress as `0x${string}` : undefined,
    };
  }, [vaultAddress, conn]);
  const { address: accountAddress } = useAccount();
  const lpState = useContractReads({
    contractData,
    states: [
      {
        functionName: "get_account_locked_balance",
        args: [accountAddress as string],
        key: "lockedBalance",
      },
      {
        functionName: "get_account_unlocked_balance",
        args: [accountAddress as string],
        key: "unlockedBalance",
      },
      {
        functionName: "get_account_stashed_balance",
        args: [accountAddress as string],
        key: "stashedBalance",
      },
      {
        functionName: "get_account_queued_bps",
        args: [accountAddress as string],
        key: "queuedBps",
      },
    ],
  }) as unknown as LiquidityProviderStateType;
  return lpState;
};

export default useLPState