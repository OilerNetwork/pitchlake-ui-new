import { useNewContext } from "@/context/NewProvider";
import { vaultABI } from "@/lib/abi";
import { LiquidityProviderStateType } from "@/lib/types";
import useContractReads from "@/lib/useContractReads";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

const useLPStateRPC = () => {
    const { conn, vaultAddress } = useNewContext();
    const contractData = useMemo(() => {
      return {
        abi: vaultABI,
        address: conn === "rpc" ? (vaultAddress as `0x${string}`) : undefined,
      };
    }, [vaultAddress, conn]);

    const { account } = useAccount();

    const lpState = useContractReads({
        contractData,
        states: [
          {
            functionName: "get_account_locked_balance",
            args: [account?.address as string],
            key: "lockedBalance",
          },
          {
            functionName: "get_account_unlocked_balance",
            args: [account?.address as string],
            key: "unlockedBalance",
          },
          {
            functionName: "get_account_stashed_balance",
            args: [account?.address as string],
            key: "stashedBalance",
          },
          {
            functionName: "get_account_queued_bps",
            args: [account?.address as string],
            key: "queuedBps",
          },
        ],
        watch: true,
      }) as unknown as LiquidityProviderStateType;
      return lpState
}

export default useLPStateRPC