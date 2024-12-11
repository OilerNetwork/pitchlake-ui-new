import {
  useAccount,
  useContract,
  useContractRead,
  useProvider,
  useContractWrite,
} from "@starknet-react/core";
import { useEffect, useCallback, useMemo, useState } from "react";
import { ApprovalArgs, TransactionResult } from "@/lib/types";
import { erc20ABI } from "@/lib/abi";
import { Account, AccountInterface, RpcProvider } from "starknet";
import { useTransactionContext } from "@/context/TransactionProvider";
import { getDevAccount } from "@/lib/constants";

const useERC20 = (
  tokenAddress: string | undefined,
  target?: string,
) => {
  //   const typedContract = useContract({abi:erc20ABI,address}).contract?.typedv2(erc20ABI)
  const contractData = {
    abi: erc20ABI,
    address: tokenAddress,
  };

  const { contract } = useContract({ ...contractData });
  const { provider } = useProvider();
  const { isDev, devAccount, setPendingTx, pendingTx } =
    useTransactionContext();

  const {account} = useAccount()
  const [balance, setBalance] = useState<number>(0);
  const [allowance, setAllowance] = useState<number>(0);

  // const { writeAsync } = useContractWrite({});

  // const account = useMemo(() => {
  //   if (isDev === true) {
  //     return devAccount;
  //   } else return connectorAccount;
  // }, [connectorAccount, isDev, devAccount]);

  const devAcc = () => {
    const _address = process.env.NEXT_PUBLIC_DEV_ADDRESS;
    const _pk = process.env.NEXT_PUBLIC_DEV_PK;
    const address = _address ? _address : "";
    const pk = _pk ? _pk : "";

    return new Account(provider, address, pk);
  };

  const typedContract = useMemo(() => {
    if (!contract) return;
    const typedContract = contract.typedv2(erc20ABI);
    if (account) typedContract.connect(account as Account);

    return typedContract;
  }, [contract, account]);

  //  const typedContractFunding = useMemo(() => {
  //    if (!contract) return;
  //    const typedContract = contract.typedv2(erc20ABI);
  //
  //    // Build dev (funded) account
  //    const address = process.env.NEXT_PUBLIC_DEV_ADDRESS;
  //    const pk = process.env.NEXT_PUBLIC_DEV_PK;
  //
  //    const _address = address ? address : "";
  //    const _pk = pk ? pk : "";
  //    const acc = new Account(provider, _address, _pk);
  //
  //    if (target) typedContract.connect(devAcc());
  //    return typedContract;
  //  }, [contract, account]);

  //Read States

  const { data: balanceRaw } = useContractRead({
    abi: erc20ABI,
    address: tokenAddress ? tokenAddress : undefined,
    functionName: "balance_of",
    args: account ? [account.address] : undefined,
    watch: true,
  });

  const { data: allowanceRaw } = useContractRead({
    abi: erc20ABI,
    address: tokenAddress ? tokenAddress : undefined,
    functionName: "allowance",
    args: account?.address && target ? [account.address, target] : undefined,
    watch: true,
  });

  // No increase_allowance on ETH ?
  const increaseAllowance = useCallback(
    async (approvalArgs: ApprovalArgs) => {
      if (!contract) return;
      const typedContract = contract.typedv2(erc20ABI);
      if (account) typedContract.connect(account as Account);

      try {
        const data = await typedContract.increase_allowance(
          approvalArgs.spender,
          approvalArgs.amount,
        );
        const typedData = data as TransactionResult;
        setPendingTx(typedData.transaction_hash);
      } catch (err) {
        console.log(err);
      }
    },
    [account, typedContract, pendingTx, setPendingTx],
  );

  const approve = useCallback(
    async (approvalArgs: ApprovalArgs) => {
      if (!contract) {
        return;
      }
      const typedContract = contract.typedv2(erc20ABI);
      if (account) typedContract.connect(account as Account);

      let nonce;
      if (provider && account) {
        try {
          nonce = await provider.getNonceForAddress(account.address);
        } catch (error) {
          console.log("Error fetching nonce:", error);
          nonce = "0";
        }
      } else {
        nonce = "0";
      }

      try {
        const data = await typedContract.approve(
          approvalArgs.spender,
          approvalArgs.amount,
          { nonce },
        );
        const typedData = data as TransactionResult;
        setPendingTx(typedData.transaction_hash);
      } catch (err) {
        console.log("ERR", err);
      }
    },
    [account, typedContract, pendingTx, setPendingTx],
  );

  //  const fund = useCallback(
  //    async (approvalArgs: ApprovalArgs) => {
  //      if (!typedContractFunding) return;
  //      try {
  //        const nonce =
  //          provider && devAcc()
  //            ? await provider.getNonceForAddress(devAcc().address)
  //            : "0";
  //
  //        const data = typedContractFunding.transfer(
  //          approvalArgs.spender,
  //          approvalArgs.amount,
  //          {
  //            nonce:
  //              tokenAddress ===
  //              "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
  //                ? Number(nonce) + 1
  //                : nonce,
  //          },
  //        );
  //        const typedData = data as TransactionResult;
  //        setPendingTx(typedData.transaction_hash);
  //      } catch (err) {
  //        console.log("ERR", err);
  //      }
  //    },
  //    [account, typedContractFunding, pendingTx, setPendingTx],
  //  );

  useEffect(() => {
    setBalance(balanceRaw ? Number(balanceRaw) : 0);
    setAllowance(allowanceRaw ? Number(allowanceRaw) : 0);
  }, [ balanceRaw, allowanceRaw, pendingTx]);

  return {
    balance,
    allowance,
    approve,
    increaseAllowance,
    //   fund,
  };
};

export default useERC20;
