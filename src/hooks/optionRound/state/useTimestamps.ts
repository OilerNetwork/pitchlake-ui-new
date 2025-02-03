import { optionRoundABI } from "@/lib/abi";
import { useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { BlockTag } from "starknet";

const useTimestamps = (
  address: string | undefined,
  args?: { watch?: boolean }
) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address: address as `0x${string}` };
  }, [address]);

  const { data: deploymentDate } = useContractRead({
    ...contractData,
    blockIdentifier:BlockTag.PENDING,
    functionName: "get_deployment_date",
    args: [],
    watch: true,
  });
  const { data: auctionStartDate } = useContractRead({
    ...contractData,
    blockIdentifier:BlockTag.PENDING,
    watch,
    functionName: "get_auction_start_date",
    args: [],
  });

  const { data: auctionEndDate } = useContractRead({
    ...contractData,
    blockIdentifier:BlockTag.PENDING,
    functionName: "get_auction_end_date",
    args: [],
    watch: true,
  });

  const { data: optionSettleDate } = useContractRead({
    ...contractData,
    blockIdentifier:BlockTag.PENDING,
    functionName: "get_option_settlement_date",
    args: [],
    watch: true,
  });

  return {
    deploymentDate: deploymentDate?.toString(),
    auctionStartDate: auctionStartDate?.toString(),
    auctionEndDate: auctionEndDate?.toString(),
    optionSettleDate: optionSettleDate?.toString(),
  };
};

export default useTimestamps;
