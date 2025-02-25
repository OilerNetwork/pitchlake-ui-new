import React, { ReactNode, useEffect } from "react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { useAccount } from "@starknet-react/core";
import { RepeatEthIcon } from "@/components/Icons";
import { formatNumber } from "@/lib/utils";
import { num } from "starknet";
import { formatEther } from "ethers";
import { useTransactionContext } from "@/context/TransactionProvider";
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useOBState from "@/hooks/vault_v2/states/useOBState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";

interface RefundProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const Refund: React.FC<RefundProps> = ({ showConfirmation }) => {
  const { address, account } = useAccount();
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundBuyerState = useOBState(selectedRoundAddress);
  const vaultActions = useVaultActions();
  const { pendingTx } = useTransactionContext();

  const refundBalanceWei = selectedRoundBuyerState?.refundableOptions
    ? process.env.NEXT_PUBLIC_ENVIRONMENT === "ws"
      ? !selectedRoundBuyerState?.hasMinted
        ? selectedRoundBuyerState?.refundableOptions
        : "0"
      : selectedRoundBuyerState?.refundableOptions
    : "0";

  const refundBalanceEth = formatEther(num.toBigInt(refundBalanceWei));

  const handleRefundBid = async (): Promise<void> => {
    address &&
      (await vaultActions?.refundUnusedBids({
        roundAddress: selectedRoundAddress ? selectedRoundAddress : "0x0",
        optionBuyer: address,
      }));
  };

  const handleSubmit = () => {
    showConfirmation(
      "Refund",
      <>
        refund bids worth{" "}
        <span className="font-semibold text-[#fafafa]">
          {formatNumber(Number(refundBalanceEth))} ETH
        </span>
      </>,
      handleRefundBid,
    );
  };

  const isButtonDisabled = (): boolean => {
    if (!account) return true;
    if (pendingTx) return true;
    if (!selectedRoundBuyerState) return true;
    if (refundBalanceWei.toString() === "0") return true;

    return false;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow space-y-6 items-center justify-center">
        <RepeatEthIcon classname="refund-icon rounded-2xl bg-icon-gradient border-[1px] border-greyscale-800 flex flex-row justify-center items-center" />
        <p className="text-center text-[#bfbfbf]">
          Your refundable balance is <br />
          <span className="font-semibold text-[#fafafa]">
            {formatNumber(Number(refundBalanceEth))} ETH
          </span>
        </p>
      </div>

      <div className="mt-auto">
        <Hoverable
          dataId="refundButton"
          className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]"
        >
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            text="Refund Now"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default Refund;
