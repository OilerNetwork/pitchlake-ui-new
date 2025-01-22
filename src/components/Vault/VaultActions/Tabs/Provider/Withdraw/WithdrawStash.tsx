import React, { useEffect, ReactNode } from "react";
import { VaultStateType, LiquidityProviderStateType } from "@/lib/types";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import collect from "@/../public/collect.svg";
import { formatEther, parseEther } from "ethers";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { DepositArgs } from "@/lib/types";
import { CollectEthIcon } from "@/components/Icons";
import { num } from "starknet";
import { useTransactionContext } from "@/context/TransactionProvider";
import Hoverable from "@/components/BaseComponents/Hoverable";

interface WithdrawStashProps {
  //withdrawStash: () => Promise<void>;
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const WithdrawStash: React.FC<WithdrawStashProps> = ({
  showConfirmation,
  //withdrawStash,
}) => {
  const { vaultState, lpState, vaultActions } = useProtocolContext();
  const { account } = useAccount();
  const { pendingTx } = useTransactionContext();
  const [state, setState] = React.useState({
    isButtonDisabled: true,
  });

  const updateState = (updates: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const withdrawStashedBalance = async (): Promise<void> => {
    await vaultActions.withdrawStash({
      account: account ? account.address : "",
    });

    // withdrawStash from vaultActions
  };

  const handleSubmit = () => {
    showConfirmation(
      "Withdraw Stashed",
      <>
        collect your stashed{" "}
        <span className="font-semibold text-[#fafafa]">
          {formatEther(
            lpState?.stashedBalance ? lpState.stashedBalance.toString() : "0",
          )}{" "}
          ETH
        </span>{" "}
      </>,
      withdrawStashedBalance,
    );
  };

  const isButtonDisabled = (): boolean => {
    if (!account) return true;
    if (pendingTx) return true;
    if (
      num.toBigInt(vaultState?.stashedBalance ? vaultState.stashedBalance : 0) >
      0
    ) {
      return false;
    }
    return true;

    //if (vaultState.stashedBalance) {
    //  return false;
    //}

    //return false; // Button should be disabled is staked ETH is 0
  };

  useEffect(() => {}, [account]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col justify-center h-full align-center space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center">
            <div className="bg-[#1E1E1E] rounded-lg p-4">
              <CollectEthIcon classname="w-16 h-16 mx-auto" stroke="" fill="" />
            </div>
          </div>
          <p className="text-[#BFBFBF] text-center font-regular text-[14px]">
            Your current stashed balance is
            <br />
            <b className="mt-0 text-[#FAFAFA] text-[14px] font-bold text-center">
              {lpState?.stashedBalance
                ? parseFloat(formatEther(lpState.stashedBalance.toString()))
                    .toFixed(3)
                    .toString()
                : "0"}{" "}
              ETH
            </b>
          </p>
        </div>
      </div>
      <div className="mt-auto">
        <Hoverable
          dataId="collectStashButton"
          className="flex justify-between text-sm border-t border-[#262626] p-6"
        >
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            text="Collect"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default WithdrawStash;
