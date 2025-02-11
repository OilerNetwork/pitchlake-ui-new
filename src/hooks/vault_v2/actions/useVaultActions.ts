import { useAccount, useContract, useProvider } from "@starknet-react/core";
import { vaultABI } from "@/lib/abi";
import {
  DepositArgs,
  TransactionResult,
  VaultActionsType,
  WithdrawLiquidityArgs,
  QueueArgs,
  CollectArgs,
  PlaceBidArgs,
  UpdateBidArgs,
  RefundBidsArgs,
  MintOptionsArgs,
  ExerciseOptionsArgs,
} from "@/lib/types";
import { useCallback, useMemo } from "react";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useNewContext } from "@/context/NewProvider";
import { DemoFossilCallParams } from "@/app/api/sendMockFossilCallback/route";
const useVaultActions = () => {
  const { vaultAddress } = useNewContext();
  const { setPendingTx } = useTransactionContext();
  const { account } = useAccount();
  const { provider } = useProvider();
  const { contract } = useContract({
    abi: vaultABI,
    address: vaultAddress as `0x${string}`,
  });

  const typedContract = useMemo(() => {
    if (!contract) return;
    const typedContract = contract.typedv2(vaultABI);
    if (account) typedContract.connect(account);
    return typedContract;
  }, [contract, account]);

  //Maybe used later to rewrite calls as useMemos with and writeAsync
  //May not be required if we watch our transactions off the plugin
  // const { writeAsync } = useContractWrite({});
  // const contractData = {
  //   abi: vaultABI,
  //   address,
  // };

  //Write Calls

  const callContract = useCallback(
    (functionName: string) =>
      async (
        args?:
          | DepositArgs
          | WithdrawLiquidityArgs
          | QueueArgs
          | CollectArgs
          | PlaceBidArgs
          | UpdateBidArgs
          | RefundBidsArgs
          | MintOptionsArgs
          | ExerciseOptionsArgs,
      ) => {
        if (!typedContract || !provider || !account) return;
        let argsData;
        if (args) argsData = Object.values(args).map((value) => value);
        let data;
        const nonce = await provider?.getNonceForAddress(account?.address);
        if (argsData) {
          data = await typedContract?.[functionName](...argsData, {
            nonce,
          });
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

  /// LP

  const depositLiquidity = useCallback(
    async (depositArgs: DepositArgs) => {
      await callContract("deposit")(depositArgs);
    },
    [callContract],
  );

  const withdrawLiquidity = useCallback(
    async (withdrawArgs: WithdrawLiquidityArgs) => {
      await callContract("withdraw")(withdrawArgs);
    },
    [callContract],
  );

  const withdrawStash = useCallback(
    async (collectArgs: CollectArgs) => {
      await callContract("withdraw_stash")(collectArgs);
    },
    [callContract],
  );

  const queueWithdrawal = useCallback(
    async (queueArgs: QueueArgs) => {
      await callContract("queue_withdrawal")(queueArgs);
    },
    [callContract],
  );

  // STATE TRANSITIONS

  const startAuction = useCallback(async () => {
    await callContract("start_auction")();
  }, [callContract]);

  const endAuction = useCallback(async () => {
    await callContract("end_auction")();
  }, [callContract]);

  const demoFossilCallback = useCallback(
    async ({ roundId, toTimestamp }: DemoFossilCallParams) => {
      const body: DemoFossilCallParams = {
        vaultAddress: vaultAddress ? vaultAddress : "0x0",
        roundId,
        toTimestamp,
      };

      try {
        const response = await fetch("/api/sendMockFossilCallback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          alert("Txn failed to send, try again in a couple seconds");
          throw new Error(
            `Failed to send mocked Fossil request from client side: ${response.status}`,
          );
        } else {
          const resp = await response.json();
          alert("Txn sent: " + resp.tx_hash);
        }
      } catch (error) {
        console.error(
          "Failed to send mocked Fossil request from client side",
          error,
        );
      }
    },
    [callContract],
  );

  // @NOTE: rm and consider adding demo_fossil_callback to actions
  const settleOptionRound = useCallback(async () => {
    try {
      await callContract("settle_round")();
    } catch (error) {
      console.log(error);
    }
  }, [callContract]);

  // OB
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

  const mintOptions = useCallback(
    async (args: MintOptionsArgs) => {
      await callContract("mint_options")(args);
    },
    [callContract],
  );

  const exerciseOptions = useCallback(
    async (args: ExerciseOptionsArgs) => {
      await callContract("exercise_options")(args);
    },
    [callContract],
  );

  //State Transition

  return {
    depositLiquidity,
    withdrawLiquidity,
    withdrawStash,
    queueWithdrawal,
    startAuction,
    endAuction,
    demoFossilCallback,
    settleOptionRound,
    placeBid,
    updateBid,
    refundUnusedBids,
    mintOptions,
    exerciseOptions,
  } as VaultActionsType;
};

export default useVaultActions;
