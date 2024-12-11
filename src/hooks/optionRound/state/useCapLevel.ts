import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useMemo } from "react";

const useCapLevel = (address: string, args?: { watch?: boolean }) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { capLevel } = useContractReads({
    contractData,
    watch,
    states: [
      {
        functionName: "get_cap_level",
        key: "capLevel",
      },
    ],
  });

  return { capLevel: capLevel ? capLevel.toString() : 0 };
};

export default useCapLevel;
