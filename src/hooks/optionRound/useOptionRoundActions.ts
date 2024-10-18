import { optionRoundABI } from "@/abi";
import { useTransactionContext } from "@/context/TransactionProvider";
import {
  OptionRoundActionsType,
  PlaceBidArgs,
  RefundBidsArgs,
  TransactionResult,
  UpdateBidArgs,
} from "@/lib/types";
import { useAccount, useContract } from "@starknet-react/core";
import { useCallback, useMemo } from "react";
import { Account } from "starknet";

const useOptionRoundActions = (address: string | undefined) => {
  const { contract } = useContract({
    abi: optionRoundABI,
    address,
  });

  const { isDev, devAccount } = useTransactionContext();
  const { account: connectorAccount } = useAccount();
  const { setPendingTx } = useTransactionContext();

  const account = useMemo(() => {
    if (isDev === true) {
      return devAccount;
    } else return connectorAccount;
  }, [connectorAccount, isDev, devAccount]);

  const typedContract = useMemo(() => {
    if (!contract) return;
    const typedContract = contract.typedv2(optionRoundABI);
    if (account) typedContract.connect(account as Account);
    return typedContract;
  }, [contract, account]);

  //Write Calls

  const placeBid = async (args: PlaceBidArgs) => {
    await callContract("place_bid")(args);
  };

  const updateBid = async (args: UpdateBidArgs) => {
    await callContract("update_bid")(args);
  };

  const refundUnusedBids = async (args: RefundBidsArgs) => {
    await callContract("refund_unused_bids")(args);
  };

  const tokenizeOptions = async () => {
    await callContract("tokenize_options")();
  };

  const exerciseOptions = async () => {
    await callContract("exercise_options")();
  };

  const callContract = useCallback(
    (functionName: string) =>
      async (args?: PlaceBidArgs | UpdateBidArgs | RefundBidsArgs) => {
        if (!typedContract) return;
        let argsData;
        if (args) argsData = Object.values(args).map((value) => value);
        let data;
        if (argsData) {
          data = await typedContract?.[functionName](...argsData);
        } else {
          data = await typedContract?.[functionName]();
        }
        const typedData = data as TransactionResult;
        setPendingTx(typedData.transaction_hash);
        // const data = await writeAsync({ calls: [callData] });
        return typedData;
      },
    [typedContract, setPendingTx]
  );

  return {
    placeBid,
    updateBid,
    refundUnusedBids,
    tokenizeOptions,
    exerciseOptions,
  } as OptionRoundActionsType;
};
export default useOptionRoundActions;