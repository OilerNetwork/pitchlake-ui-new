import { optionRoundABI } from "@/lib/abi";
import { useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { BlockTag, CairoCustomEnum, num } from "starknet";

const useRoundState = (address: string, args?: { watch?: boolean }) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { data: roundState } = useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_state",
    args:[],
    watch: true,
    
  })

  return {
    roundState: roundState
      ? (roundState as unknown as CairoCustomEnum).activeVariant()
      : "",
  };
};

export default useRoundState;
