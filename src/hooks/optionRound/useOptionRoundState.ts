import { optionRoundABI } from "@/abi";
import { OptionBuyerStateType, OptionRoundStateType } from "@/lib/types";
import useContractReads from "@/lib/useContractReads";
import { useAccount, useContract, useContractRead } from "@starknet-react/core";
import { useMemo } from "react";
import { CairoCustomEnum, num } from "starknet";

const useOptionRoundState = (address: string | undefined) => {
  const contractData = useMemo(() => {
    return { abi: optionRoundABI, address };
  }, [address]);
  const { account } = useAccount();
  //Read States
  const { data: vaultAddress } = useContractRead({
    ...contractData,
    functionName: "get_vault_address",
    args: [],
    watch: true,
  });
  
  const { data: roundId } = useContractRead({
    ...contractData,
    functionName: "get_round_id",
    args: [],
    watch: true,
  });
  
  const { data: roundState } = useContractRead({
    ...contractData,
    functionName: "get_state",
    args: [],
    watch: true,
  });
  
  const { data: deploymentDate } = useContractRead({
    ...contractData,
    functionName: "get_deployment_date",
    args: [],
    watch: true,
  });
  
  const { data: auctionStartDate } = useContractRead({
    ...contractData,
    functionName: "get_auction_start_date",
    args: [],
    watch: true,
  });
  
  const { data: auctionEndDate } = useContractRead({
    ...contractData,
    functionName: "get_auction_end_date",
    args: [],
    watch: true,
  });
  
  const { data: optionSettleDate } = useContractRead({
    ...contractData,
    functionName: "get_option_settlement_date",
    args: [],
    watch: true,
  });
  
  const { data: startingLiquidity } = useContractRead({
    ...contractData,
    functionName: "get_starting_liquidity",
    args: [],
    watch: true,
  });
  
  const { data: soldLiquidity } = useContractRead({
    ...contractData,
    functionName: "get_sold_liquidity",
    args: [],
    watch: true,
  });
  
  const { data: unsoldLiquidity } = useContractRead({
    ...contractData,
    functionName: "get_unsold_liquidity",
    args: [],
    watch: true,
  });
  
  const { data: reservePrice } = useContractRead({
    ...contractData,
    functionName: "get_reserve_price",
    args: [],
    watch: true,
  });
  
  const { data: strikePrice } = useContractRead({
    ...contractData,
    functionName: "get_strike_price",
    args: [],
    watch: true,
  });
  
  const { data: capLevel } = useContractRead({
    ...contractData,
    functionName: "get_cap_level",
    args: [],
    watch: true,
  });
  
  const { data: clearingPrice } = useContractRead({
    ...contractData,
    functionName: "get_clearing_price",
    args: [],
    watch: true,
  });
  
  const { data: optionsSold } = useContractRead({
    ...contractData,
    functionName: "get_options_sold",
    args: [],
    watch: true,
  });
  
  const { data: availableOptions } = useContractRead({
    ...contractData,
    functionName: "get_options_available",
    args: [],
    watch: true,
  });
  
  const { data: premiums } = useContractRead({
    ...contractData,
    functionName: "get_total_premium",
    args: [],
    watch: true,
  });
  
  const { data: settlementPrice } = useContractRead({
    ...contractData,
    functionName: "get_settlement_price",
    args: [],
    watch: true,
  });
  
  const { data: totalPayout } = useContractRead({
    ...contractData,
    functionName: "get_total_payout",
    args: [],
    watch: true,
  });

  //Wallet States
  const { data: treeNonce } = useContractRead({
    ...contractData,
    functionName: "get_bid_tree_nonce",
    args: [],
    watch: true,
  });
  
  const { data: biddingNonce } = useContractRead({
    ...contractData,
    functionName: "get_account_bidding_nonce",
    args: [account?.address as string],
    watch: true,
  });
  
  const { data: bids } = useContractRead({
    ...contractData,
    functionName: "get_account_bids",
    args: [account?.address as string],
    watch: true,
  });
  
  const { data: refundableBids } = useContractRead({
    ...contractData,
    functionName: "get_account_refundable_balance",
    args: [account?.address as string],
    watch: true,
  });
  
  const { data: tokenizableOptions } = useContractRead({
    ...contractData,
    functionName: "get_account_mintable_options",
    args: [account?.address as string],
    watch: true,
  });
  
  const { data: totalOptions } = useContractRead({
    ...contractData,
    functionName: "get_account_total_options",
    args: [account?.address as string],
    watch: true,
  });
  
  const { data: payoutBalance } = useContractRead({
    ...contractData,
    functionName: "get_account_payout_balance",
    args: [account?.address as string],
    watch: true,
  });

  //  const { data:  } = useMemo(
  //   () =>
  //     useContractRead({ ...contractData, functionName: "get_reserve_price" }),
  //   [typedContract]
  // );
  //Write Calls

  return {
    optionRoundState: {
      address,
      vaultAddress: vaultAddress?.toString(),
      roundId: roundId ? roundId.toString() : 0,
      roundState: roundState?(roundState as CairoCustomEnum).activeVariant():"",
      deploymentDate: deploymentDate?.toString(),
      auctionStartDate: auctionStartDate?.toString(),
      auctionEndDate: auctionEndDate?.toString(),
      optionSettleDate: optionSettleDate?.toString(),
      startingLiquidity: startingLiquidity ? startingLiquidity.toString() : 0,
      soldLiquidity: soldLiquidity ? soldLiquidity.toString() : 0,
      unsoldLiquidity: unsoldLiquidity ? unsoldLiquidity.toString() : 0,
      reservePrice: reservePrice ? reservePrice.toString() : 0,
      strikePrice: strikePrice ? strikePrice.toString() : 0,
      capLevel: capLevel ? capLevel.toString() : 0,
      availableOptions: availableOptions ? availableOptions.toString() : 0,
      optionsSold: optionsSold ? optionsSold.toString() : 0,
      clearingPrice: clearingPrice ? clearingPrice.toString() : 0,
      premiums: premiums ? premiums.toString() : 0,
      settlementPrice: settlementPrice ? settlementPrice.toString() : 0,
      totalPayout: totalPayout ? totalPayout.toString() : 0,
      payoutPerOption: totalPayout
        ? optionsSold
          ? Number(num.toBigInt(optionsSold.toString())) > 0
            ? Number(num.toBigInt(totalPayout.toString())) /
              Number(num.toBigInt(optionsSold.toString()))
            : 0
          : 0
        : 0, // replace ?
      treeNonce: treeNonce ? treeNonce.toString() : 0,
      //queuedLiquidity: 0, //Add queuedLiquidity (is on vault not round)
    } as OptionRoundStateType,
    optionBuyerState: {
      address: account?.address as string,
      roundId: roundId ? roundId.toString() : 0,
      bidderNonce: biddingNonce ? biddingNonce.toString() : 0,
      bids: bids ? bids : [],
      refundableBalance: refundableBids ? refundableBids.toString() : 0,
      tokenizableOptions: tokenizableOptions
        ? tokenizableOptions.toString()
        : 0,
      totalOptions: totalOptions ? totalOptions.toString() : 0,
      payoutBalance: payoutBalance ? payoutBalance.toString() : 0,
    } as OptionBuyerStateType,
  };
};

export default useOptionRoundState;
