import { optionRoundABI } from "@/lib/abi";
import { OptionRoundStateType } from "@/lib/types";
import { useMemo } from "react";
import { BlockTag, CairoCustomEnum, num } from "starknet";
import { getPerformanceLP, getPerformanceOB } from "@/lib/utils";
import { useContractRead } from "@starknet-react/core";

const useOptionRoundStateRPC = (conn: string, address: string | undefined) => {
  const contractData = useMemo(() => {
    console.log("REDO")
    if (conn === "mock") return { abi: optionRoundABI, address: undefined };
    else return { abi: optionRoundABI, address: address as `0x${string}` };
  }, [conn,address]);
  //Read States

  const {data:vaultAddress} = useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_vault_address",
    args:[],
    watch: true,
    
  })
  const {data:roundId} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_round_id",
    args:[],
    watch: true,
    
  })
  const {data:roundState} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_state",
    args:[],
    watch: true,
    
  })
  const {data:deploymentDate} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_deployment_date",
    args:[],
    watch: true,
    
  })
  const {data:auctionStartDate} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_auction_start_date",
    args:[],
    watch: true,
    
  })
  const {data:auctionEndDate} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_auction_end_date",
    args:[],
    watch: true,
    
  })
  const {data:optionSettleDate} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
      functionName: "get_option_settlement_date",
    args:[],
    watch: true,
    
  })
  const {data:treeNonce} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_bid_tree_nonce",
    args:[],
    watch: true,
    
  })
  const {data:startingLiquidity} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_starting_liquidity",
    args:[],
    watch: true,
    
    })
  const {data:soldLiquidity} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_sold_liquidity",
    args:[],
    watch: true,
    
  })
  const {data:unsoldLiquidity} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_unsold_liquidity",
    args:[],
    watch: true,
    
  })
  const {data:reservePrice} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_reserve_price",
    args:[],
    watch: true,
    
  })
  const {data:strikePrice} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_strike_price",
    args:[],
    watch: true,
    
  })
  const {data:capLevel} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_cap_level",
    args:[],
    watch: true,
    
  })
  const {data:availableOptions} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_options_available",
    args:[],
    watch: true,
    
  })
  const {data:optionsSold} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_options_sold",
    args:[],
    watch: true,
    
  })
  const {data:clearingPrice} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_clearing_price",
    args:[],
    watch: true,
    
  })
  const {data:premiums} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_total_premium",
    args:[],
    watch: true,
    
  })
  const {data:totalPayout} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_total_payout",
    args:[],
    watch: true,
    
  })
  const {data:settlementPrice} = useContractRead({ 
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_settlement_price",
    args:[],
    watch: true,
    
  })

  console.log("settlementPrice",settlementPrice)

  const performanceLP = useMemo(() => {
    if(soldLiquidity && premiums && totalPayout){ 
      return getPerformanceLP(
        soldLiquidity.toString(),
        premiums.toString(),
        totalPayout.toString()
      );
    }
    return "0";
  }, [soldLiquidity, premiums, totalPayout]);

  const performanceOB = useMemo(() => {
    if(premiums && totalPayout){
      return getPerformanceOB(
        premiums.toString(),
        totalPayout.toString()
      );
    }
    return "0";
  }, [premiums, totalPayout]);

  return {
      address,
      vaultAddress: vaultAddress ? vaultAddress.toString() : "",
      roundId: roundId ? roundId.toString() : 0,
      roundState: roundState
        ? (roundState as unknown as CairoCustomEnum).activeVariant()
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
