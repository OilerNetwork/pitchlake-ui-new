import { optionRoundABI } from "@/lib/abi";
import { useTransactionContext } from "@/context/TransactionProvider";
import {
  OptionRoundActionsType,
  PlaceBidArgs,
  RefundBidsArgs,
  TransactionResult,
  UpdateBidArgs,
} from "@/lib/types";
import { useAccount, useProvider, useContract } from "@starknet-react/core";
import { useCallback, useMemo } from "react";
import { Account } from "starknet";

const useOptionRoundActions = (address?: string) => {
  const { contract } = useContract({
    abi: optionRoundABI,
    address,
  });

  const { setPendingTx } = useTransactionContext();

  //  const account = useMemo(() => {
  //    if (isDev === true) {
  //      return devAccount;
  //    } else return connectorAccount;
  //  }, [connectorAccount, isDev, devAccount]);
  const { account } = useAccount();
  const { provider } = useProvider();

  const typedContract = useMemo(() => {
    if (!contract) return;
    const typedContract = contract.typedv2(optionRoundABI);
    if (account) typedContract.connect(account as Account);
    return typedContract;
  }, [contract, account]);

  //Write Calls

  const callContract = useCallback(
    (functionName: string) =>
      async (args?: PlaceBidArgs | UpdateBidArgs | RefundBidsArgs) => {
        if (!typedContract) return;

        let argsData;
        if (args) argsData = Object.values(args).map((value) => value);
        let data;
        const nonce =
          provider && account
            ? await provider.getNonceForAddress(account.address)
            : "0";
        if (argsData) {
          data = await typedContract?.[functionName](...argsData, { nonce });
        } else {
          data = await typedContract?.[functionName]({ nonce });
        }
        const typedData = data as TransactionResult;
        setPendingTx(typedData.transaction_hash);
        // const data = await writeAsync({ calls: [callData] });
        return typedData;
      },
    [typedContract, account, provider, setPendingTx],
  );
  const placeBid = useCallback(
    async (args: PlaceBidArgs) => {
      await callContract("place_bid")(args);
    },
    [callContract],
  );

  const updateBid = useCallback(
    async (args: UpdateBidArgs) => {
      await callContract("update_bid")(args);
    },
    [callContract],
  );

  const refundUnusedBids = useCallback(
    async (args: RefundBidsArgs) => {
      await callContract("refund_unused_bids")(args);
    },
    [callContract],
  );

  const tokenizeOptions = useCallback(async () => {
    await callContract("mint_options")();
  }, [callContract]);

  const exerciseOptions = useCallback(async () => {
    await callContract("exercise_options")();
  }, [callContract]);

  return {
    placeBid,
    updateBid,
    refundUnusedBids,
    tokenizeOptions,
    exerciseOptions,
  } as OptionRoundActionsType;
};
export default useOptionRoundActions;
