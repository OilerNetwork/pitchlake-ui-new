import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

const useVaultBalances = (address: string, args?: { watch?: boolean }) => {
  // Determine if args were provided
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { lockedBalance, unlockedBalance, stashedBalance } = useContractReads({
    contractData,
    watch,
    states: [
      {
        functionName: "get_vault_locked_balance",
        key: "lockedBalance",
      },
      {
        functionName: "get_vault_unlocked_balance",
        key: "unlockedBalance",
      },
      {
        functionName: "get_vault_stashed_balance",
        key: "stashedBalance",
      },
    ],
  });

  return {
    lockedBalance: lockedBalance ? lockedBalance.toString() : 0,
    unlockedBalance: unlockedBalance ? unlockedBalance.toString() : 0,
    stashedBalance: stashedBalance ? stashedBalance.toString() : 0,
  };
};

export default useVaultBalances;
