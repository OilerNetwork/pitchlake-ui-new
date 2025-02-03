import { optionRoundABI } from "@/lib/abi";
import { OptionRoundStateType } from "@/lib/types";
import useContractReads from "@/lib/useContractReads";
import { useMemo } from "react";
import { CairoCustomEnum, num } from "starknet";
import { getPerformanceLP, getPerformanceOB } from "@/lib/utils";

const useOptionRoundStateRPC = (conn: string, address: string | undefined) => {
  const contractData = useMemo(() => {
    if (conn === "mock") return { abi: optionRoundABI, address: undefined };
    else return { abi: optionRoundABI, address: address as `0x${string}` };
  }, [conn,address]);
  //Read States
  const {
    vaultAddress,
    roundId,
    roundState,
    deploymentDate,
    auctionStartDate,
    auctionEndDate,
    optionSettleDate,
    treeNonce,
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
        functionName: "get_vault_address",
        key: "vaultAddress",
      },
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
        functionName: "get_bid_tree_nonce",
        key: "treeNonce",
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

  const performanceLP = useMemo(() => {
    return getPerformanceLP(
      soldLiquidity ? soldLiquidity.toString() : "0",
      premiums ? premiums.toString() : "0",
      totalPayout ? totalPayout.toString() : "0"
    );
  }, [soldLiquidity, premiums, totalPayout]);

  const performanceOB = useMemo(() => {
    return getPerformanceOB(
      premiums ? premiums.toString() : "0",
      totalPayout ? totalPayout.toString() : "0"
    );
  }, [premiums, totalPayout]);

  return {
      address,
      vaultAddress: vaultAddress ? vaultAddress.toString() : "",
      roundId: roundId ? roundId.toString() : 0,
      roundState: roundState
        ? (roundState as CairoCustomEnum).activeVariant()
        : "",
      deploymentDate: deploymentDate ? deploymentDate.toString() : "0",
      auctionStartDate: auctionStartDate ? auctionStartDate.toString() : "0",
      auctionEndDate: auctionEndDate ? auctionEndDate.toString() : "0",
      optionSettleDate: optionSettleDate ? optionSettleDate.toString() : "0",
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
          ? num.toBigInt(num.toBigInt(optionsSold.toString())) > 0
            ? num.toBigInt(num.toBigInt(totalPayout.toString())) /
              num.toBigInt(num.toBigInt(optionsSold.toString()))
            : 0
          : 0
        : 0, // replace ?
      treeNonce: treeNonce ? treeNonce.toString() : 0,
      performanceLP,
      performanceOB,
      //queuedLiquidity: 0, //Add queuedLiquidity (is on vault not round)
    } as OptionRoundStateType

};

export default useOptionRoundStateRPC;
