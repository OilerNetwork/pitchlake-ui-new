import React, { ReactNode } from "react";
import { VaultStateType, LiquidityProviderStateType } from "@/lib/types";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import { formatEther } from "ethers";

interface WithdrawQueueProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const QueueWithdrawal: React.FC<WithdrawQueueProps> = ({
  showConfirmation,
}) => {
  const { vaultActions, lpState } = useProtocolContext();
  const { pendingTx } = useTransactionContext();
  const { account } = useAccount();
  const [state, setState] = React.useState({
    percentage: "0",
    //isButtonDisabled: true,
  });

  const updateState = (updates: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const bpsToPercentage = (bps: string) => {
    return ((100 * parseFloat(bps)) / 10_000).toFixed(0).toString();
  };

  const percentageToBps = (percentage: string): number => {
    return (10_000 * parseFloat(percentage)) / 100;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseInt(e.target.value);
    updateState({
      percentage: value.toString(),
      //isButtonDisabled: false
    });
  };

  const isButtonDisabled = (): boolean => {
    if (!account) return true;
    if (pendingTx) return true;
    if (
      state.percentage ===
      bpsToPercentage(lpState?.queuedBps ? lpState.queuedBps.toString() : "0")
    )
      return true;

    return false;
  };

  const queueWithdrawal = async (): Promise<void> => {
    await vaultActions.queueWithdrawal({
      bps: percentageToBps(state.percentage),
    });
    // queue withdrawal from vaultActions
  };

  const handleSubmit = () => {
    showConfirmation(
      "Liquidity Withdraw",
      <>
        update how much of your locked position will be stashed from{" "}
        <span className="font-semibold text-[#fafafa]">
          {bpsToPercentage(
            lpState?.queuedBps ? lpState.queuedBps.toString() : "0",
          )}
          %
        </span>{" "}
        to{" "}
        <span className="font-semibold text-[#fafafa]">
          {state.percentage}%
        </span>
      </>,
      queueWithdrawal,
    );
  };

  React.useEffect(() => {
    updateState({
      percentage: bpsToPercentage(lpState?.queuedBps?.toString() || "0"),
    });
  }, [account, pendingTx, lpState?.queuedBps]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow px-6">
        <label
          className="block text-sm font-medium text-gray-400 mb-2"
          htmlFor="percentage-slider"
        >
          Choose Percentage
        </label>
        <div className="flex items-center space-x-4">
          <div className="border-[1px] border-[#595959] w-full h-[44px] bg-[#0A0A0A] rounded-md flex items-center px-4">
            <input
              id="percentage-slider"
              type="range"
              min="0"
              max="100"
              value={state.percentage}
              onChange={handleSliderChange}
              className="w-full h-2 appearance-none bg-[#ADA478] rounded-full focus:outline-none
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-4
                [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:bg-[#F5EBB8]
                [&::-webkit-slider-thumb]:rounded-full
                [&::-moz-range-thumb]:appearance-none
                [&::-moz-range-thumb]:w-4
                [&::-moz-range-thumb]:h-4
                [&::-moz-range-thumb]:bg-red-500
                [&::-moz-range-thumb]:rounded-full
                [&::-webkit-slider-thumb]:hover:bg-[#F5EBB8]
                [&::-moz-range-thumb]:hover:bg-[#F5EBB8]"
            />
          </div>
          <div className="border-[1px] border-[#595959] flex justify-center items-center h-[44px] w-[60px] bg-[#0A0A0A] rounded-lg">
            <span className="text-[14px] font-medium text-[#FAFAFA] text-center">
              {state.percentage}%
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col h-[full] mt-[auto]">
        <div className="px-6 flex justify-between text-sm mb-6 mt-auto">
          <span className="text-gray-400">Current Locked Balance</span>
          <span className="text-white">
            {parseFloat(
              formatEther(lpState?.lockedBalance?.toString() || "0"),
            ).toFixed(3)}{" "}
            ETH
          </span>
        </div>
        <div className="mt-[auto] flex justify-between text-sm border-t border-[#262626] p-6">
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            text="Withdraw"
          />
        </div>
      </div>
    </div>
  );
};

export default QueueWithdrawal;
