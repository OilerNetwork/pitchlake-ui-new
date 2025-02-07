import { optionRoundABI } from "@/lib/abi";
import { useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { BlockTag } from "starknet";

const useStrikePrice = (address: string, args?: { watch?: boolean }) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { data: strikePrice } = useContractRead({
    ...contractData,

    functionName: "get_strike_price",
    args:[],
    watch: true,
    
  })


  return { strikePrice: strikePrice ? strikePrice.toString() : 0 };
};

export default useStrikePrice;
