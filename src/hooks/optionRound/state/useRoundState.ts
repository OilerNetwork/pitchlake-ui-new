import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useMemo } from "react";
import { CairoCustomEnum, num } from "starknet";

const useRoundState = (address: string, args?: { watch?: boolean }) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { roundState } = useContractReads({
    contractData,
    watch,
    states: [
      {
        functionName: "get_state",
        key: "roundState",
      },
    ],
  });

  return {
    roundState: roundState
      ? (roundState as CairoCustomEnum).activeVariant()
      : "",
  };
};

export default useRoundState;
