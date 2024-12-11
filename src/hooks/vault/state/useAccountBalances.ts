import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

const useAccountBalances = (address: string, args?: { watch?: boolean }) => {
  const { account } = useAccount();
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const accountAddress = account ? account.address : "";

  const { lockedBalance, unlockedBalance, stashedBalance } = useContractReads({
    contractData,
    watch,
    states: [
      {
        functionName: "get_account_locked_balance",
        args: [accountAddress],
        key: "lockedBalance",
      },
      {
        functionName: "get_account_unlocked_balance",
        args: [accountAddress],
        key: "unlockedBalance",
      },
      {
        functionName: "get_account_stashed_balance",
        args: [accountAddress],
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

export default useAccountBalances;
