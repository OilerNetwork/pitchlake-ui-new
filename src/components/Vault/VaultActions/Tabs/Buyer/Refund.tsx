import React, { ReactNode, useState, useEffect } from "react";
import InputField from "@/components/Vault/Utils/InputField";
import { Layers3, Currency } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { PlaceBidArgs } from "@/lib/types";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { RepeatEthIcon } from "@/components/Icons";
import { formatNumberText } from "@/lib/utils";
import { num } from "starknet";
import { formatEther } from "ethers";

interface RefundProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const Refund: React.FC<RefundProps> = ({ showConfirmation }) => {
  const { address } = useAccount();
  const { roundActions, selectedRoundBuyerState } = useProtocolContext();
  const refundBalanceWei = selectedRoundBuyerState
    ? selectedRoundBuyerState.refundableBalance
    : "0";
  const refundBalanceEth = formatEther(num.toBigInt(refundBalanceWei));

  const handleRefundBid = async (): Promise<void> => {
    address && (await roundActions?.refundUnusedBids({ optionBuyer: address }));
  };

  const handleSubmit = () => {
    console.log("Place Bid confirmation");
    showConfirmation(
      "Refund",
      <>
        refund bids worth{" "}
        <span className="font-semibold text-[#fafafa]">
          {Number(refundBalanceEth).toFixed(3)} ETH
        </span>
      </>,
      handleRefundBid,
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow space-y-6 items-center justify-center">
        <div className="w-[92px] h-[92px] p-6 rounded-2xl bg-icon-gradient border-[1px] border-greyscale-800 flex flex-row justify-center items-center">
          <RepeatEthIcon />
        </div>
        <p className="text-center text-[#bfbfbf]">
          Your refundable balance is <br />
          <span className="font-semibold text-[#fafafa]">
            {refundBalanceEth} ETH
          </span>
        </p>
      </div>

      <div className="mt-auto">
        <div className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]">
          <ActionButton
            onClick={handleSubmit}
            disabled={
              !selectedRoundBuyerState || Number(refundBalanceWei) === 0
            }
            text="Refund Now"
          />
        </div>
      </div>
    </div>
  );
};

export default Refund;
