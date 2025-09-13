import { optionRoundABI } from "@/lib/abi";
import { useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { BlockTag } from "starknet";

const useCapLevel = (address: string) => {
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { data: capLevel } = useContractRead({
    ...contractData,

    functionName: "get_cap_level",
    args:[],
    watch: true,
    
  })
  
  return { capLevel: capLevel ? capLevel.toString() : 0 };
};

export default useCapLevel;
