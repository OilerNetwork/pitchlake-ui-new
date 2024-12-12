import {
  useAccount,
  useContract,
  useNetwork,
  useProvider,
} from "@starknet-react/core";
import { vaultABI } from "@/lib/abi";
import {
  DepositArgs,
  TransactionResult,
  VaultActionsType,
  WithdrawLiquidityArgs,
  QueueArgs,
  CollectArgs,
} from "@/lib/types";
import { getDevAccount } from "@/lib/constants";
import { Account, RpcProvider } from "starknet";
import { useCallback, useMemo } from "react";
import { useTransactionContext } from "@/context/TransactionProvider";

const useVaultActions = (address?: `0x${string}`) => {
  const { setPendingTx } = useTransactionContext();
  const { account } = useAccount();
  const { provider } = useProvider();
  const { contract } = useContract({
    abi: vaultABI,
    address,
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
        args?: DepositArgs | WithdrawLiquidityArgs | QueueArgs | CollectArgs,
      ) => {
        if (!typedContract) return;
        let argsData;
        if (args) argsData = Object.values(args).map((value) => value);
        let data;
        const nonce =
          provider && account
            ? await provider.getNonceForAddress(account.address)
            : "0";
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

  const startAuction = useCallback(async () => {
    await callContract("start_auction")();
  }, [callContract]);

  const endAuction = useCallback(async () => {
    await callContract("end_auction")();
  }, [callContract]);

  const settleOptionRound = useCallback(async () => {
    await callContract("settle_round")();
  }, [callContract]);
  //State Transition

  return {
    depositLiquidity,
    withdrawLiquidity,
    withdrawStash,
    queueWithdrawal,
    startAuction,
    endAuction,
    settleOptionRound,
  } as VaultActionsType;
};

export default useVaultActions;
