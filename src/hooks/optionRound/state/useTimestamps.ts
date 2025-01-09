import { optionRoundABI } from "@/lib/abi";
import useContractReads from "@/lib/useContractReads";
import { useMemo } from "react";

const useTimestamps = (
  address: string | undefined,
  args?: { watch?: boolean },
) => {
  const watch = args?.watch ?? false;
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address:address as `0x${string}` };
  }, [address]);

  const { deploymentDate, auctionStartDate, auctionEndDate, optionSettleDate } =
    useContractReads({
      contractData,
      watch,
      states: [
        {
          functionName: "get_deployment_date",
          key: "deploymentDate",
        },

        {
          functionName: "get_auction_start_date",
          key: "auctionStartDate",
        },
        {
          functionName: "get_auction_end_date",
          key: "auctionEndDate",
        },
        {
          functionName: "get_option_settlement_date",
          key: "optionSettleDate",
        },
      ],
    });

  return {
    deploymentDate: deploymentDate?.toString(),
    auctionStartDate: auctionStartDate?.toString(),
    auctionEndDate: auctionEndDate?.toString(),
    optionSettleDate: optionSettleDate?.toString(),
  };
};

export default useTimestamps;
