import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useMemo } from "react";

const useStrikePrice = (address: string, args?: { watch?: boolean }) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { strikePrice } = useContractReads({
    contractData,
    watch,
    states: [
      {
        functionName: "get_strike_price",
        key: "strikePrice",
      },
    ],
  });

  return { strikePrice: strikePrice ? strikePrice.toString() : 0 };
};

export default useStrikePrice;
