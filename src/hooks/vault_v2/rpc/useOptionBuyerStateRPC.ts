import { useNewContext } from "@/context/NewProvider";
import { optionRoundABI } from "@/lib/abi";
import { OptionBuyerStateType } from "@/lib/types";
import useContractReads from "@/lib/useContractReads";
import { useAccount } from "@starknet-react/core";
import { useMemo } from "react";

const useOptionBuyerStateRPC = (address:string)=>{
    const {conn} = useNewContext();
    const contractData = useMemo(() => {
        if (conn === "mock") return { abi: optionRoundABI, address: undefined };
        else return { abi: optionRoundABI, address: address as `0x${string}` };
      }, [conn,address]);
    const account = useAccount();
    const {
        biddingNonce,
        bids,
        refundableBids,
        mintableOptions,
        totalOptions,
        payoutBalance,
      } = useContractReads({
        contractData,
        watch: true,
        states: [
          {
            functionName: "get_account_bidding_nonce",
            args: [account?.address as string],
            key: "biddingNonce",
          },
          {
            functionName: "get_account_bids",
            args: [account?.address as string],
            key: "bids",
          },
          {
            functionName: "get_account_refundable_balance",
            args: [account?.address as string],
            key: "refundableBids",
          },
          {
            functionName: "get_account_mintable_options",
            args: [account?.address as string],
            key: "mintableOptions",
          },
    
          {
            functionName: "get_account_total_options",
            args: [account?.address as string],
            key: "totalOptions",
          },
          {
            functionName: "get_account_payout_balance",
            args: [account?.address as string],
            key: "payoutBalance",
          },
        ],
      });
      return {
        address: account?.address as string,
        bids: bids ? bids : [],
        roundAddress: address,
        bidderNonce: biddingNonce ? biddingNonce.toString() : 0,
        refundableOptions: refundableBids ? refundableBids.toString() : 0,
        mintableOptions: mintableOptions ? mintableOptions.toString() : 0,
        totalOptions: totalOptions ? totalOptions.toString() : 0,
        payoutBalance: payoutBalance ? payoutBalance.toString() : 0,
      } as OptionBuyerStateType
}

export default useOptionBuyerStateRPC