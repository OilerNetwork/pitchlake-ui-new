import React, { ReactNode, useEffect, useMemo } from "react";
import { formatEther } from "ethers";
import { ExerciseOptionsIcon } from "@/components/Icons";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { useAccount } from "@starknet-react/core";
import { formatNumber, formatNumberText } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import useERC20 from "@/hooks/erc20/useERC20";
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useOBState from "@/hooks/vault_v2/states/useOBState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useNewContext } from "@/context/NewProvider";

interface ExerciseProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const Exercise: React.FC<ExerciseProps> = ({ showConfirmation }) => {
  const { conn } = useNewContext();
  const { address, account } = useAccount();
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const selectedRoundBuyerState = useOBState(selectedRoundAddress);
  const vaultActions = useVaultActions();
  const { pendingTx } = useTransactionContext();
  const { balance } = useERC20(selectedRoundState?.address as `0x${string}`);

  const totalOptions = useMemo(() => {
    let total = BigInt(0);
    if (!selectedRoundBuyerState) return total;

    // In RPC mode, we include the mintable option balance from the contrct getter (will be 0 post-mint)
    if (conn !== "ws") {
      if (balance) total += BigInt(balance);
      if (selectedRoundBuyerState.mintableOptions)
        total += BigInt(selectedRoundBuyerState?.mintableOptions);
    }
    // In WS mode, `mintableOptions` keeps the value of of the mintable options pre-mint, and uses a `hasMinted` flag
    else if (
      selectedRoundBuyerState.hasMinted === false &&
      selectedRoundBuyerState.mintableOptions
    )
      total += BigInt(selectedRoundBuyerState.mintableOptions);

    return total;
  }, [
    selectedRoundBuyerState?.mintableOptions,
    selectedRoundBuyerState?.hasMinted,
    selectedRoundBuyerState?.erc20Balance,
    selectedRoundState?.payoutPerOption,
    balance,
  ]);
  console.log("totalOptions", totalOptions);

  const payoutBalanceWei = selectedRoundState?.payoutPerOption
    ? totalOptions * BigInt(selectedRoundState?.payoutPerOption.toString())
    : "0";
  const payoutBalanceEth = formatEther(payoutBalanceWei);

  const handleExerciseOptions = async (): Promise<void> => {
    address &&
      (await vaultActions?.exerciseOptions({
        roundAddress: selectedRoundAddress ? selectedRoundAddress : "0x0",
      }));
  };

  const handleSubmit = () => {
    showConfirmation(
      "Exercise",
      <>
        exercise{" "}
        <span className="font-semibold text-[#fafafa]">
          {formatNumberText(Number(totalOptions.toString()))}
        </span>{" "}
        options for{" "}
        <span className="font-semibold text-[#fafafa]">
          {formatNumber(Number(payoutBalanceEth))} ETH
        </span>
      </>,
      handleExerciseOptions,
    );
  };

  const isButtonDisabled = (): boolean => {
    if (!account) return true;
    if (pendingTx) return true;
    if (!selectedRoundBuyerState) return true;
    if (Number(payoutBalanceWei) === 0) return true;

    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow space-y-6 items-center justify-center">
        <ExerciseOptionsIcon
          classname={
            "w-[92px] h-[92px] rounded-2xl bg-icon-gradient border-[1px] border-greyscale-800 flex flex-row justify-center items-center"
          }
        />
        <p className="max-w-[290px] text-[#bfbfbf] text-center">
          You currently have{" "}
          <span className="font-semibold text-[#fafafa]">
            {totalOptions
              ? formatNumberText(Number(totalOptions.toString()))
              : 0}
          </span>{" "}
          options worth
          <br />{" "}
          <span className="font-semibold text-[#fafafa]">
            {" "}
            {formatNumber(Number(payoutBalanceEth))} ETH
          </span>
        </p>
      </div>

      <div className="mt-auto">
        <Hoverable
          dataId="exerciseButton"
          className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]"
        >
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            text="Exercise Now"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default Exercise;
