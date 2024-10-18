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

  const {
    vaultAddress,
    roundId,
    roundState,
    deploymentDate,
    auctionStartDate,
    auctionEndDate,
    optionSettleDate,
    startingLiquidity,
    soldLiquidity,
    unsoldLiquidity,
    reservePrice,
    strikePrice,
    capLevel,
    clearingPrice,
    optionsSold,
    availableOptions,
    premiums,
    settlementPrice,
    totalPayout,
  } = useContractReads({
    contractData,
    watch: true,
    states: [
      { 
        functionName: "get_vault_address", key: "vaultAddress" },
      {
        functionName: "get_round_id",
        key: "roundId",
      },
      {
        functionName: "get_state",
        key: "roundState",
      },
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
      {
        functionName: "get_starting_liquidity",
        key: "startingLiquidity",
      },
      {
        functionName: "get_sold_liquidity",
        key: "soldLiquidity",
      },
      {
        functionName: "get_unsold_liquidity",
        key: "unsoldLiquidity",
      },
      {
        functionName: "get_reserve_price",
        key: "reservePrice",
      },
      {
        functionName: "get_strike_price",
        key: "strikePrice",
      },
      {
        functionName: "get_cap_level",
        key: "capLevel",
      },
      {
        functionName: "get_options_available",
        key: "availableOptions",
      },
      {
        functionName: "get_options_sold",
        key: "optionsSold",
      },
      {
        functionName: "get_clearing_price",
        key: "clearingPrice",
      },
      {
        functionName: "get_total_premium",
        key: "premiums",
      },
      {
        functionName: "get_settlement_price",
        key: "settlementPrice",
      },
      {
        functionName: "get_total_payout",
        key: "totalPayout",
      },
    ],
  });

  //Wallet States
  const {
    treeNonce,
    biddingNonce,
    bids,
    refundableBids,
    tokenizableOptions,
    totalOptions,
    payoutBalance,
  } = useContractReads({
    contractData,

    states: [
      {
        functionName: "get_bid_tree_nonce",
        key: "treeNonce",
      },
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
        key: "tokenizableOptions",
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
