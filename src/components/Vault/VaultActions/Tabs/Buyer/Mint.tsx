import React, { ReactNode, useEffect } from "react";
import { HammerIcon } from "@/components/Icons";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { useAccount } from "@starknet-react/core";
import { formatNumberText } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useOBState from "@/hooks/vault_v2/states/useOBState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";

interface MintProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const Mint: React.FC<MintProps> = ({ showConfirmation }) => {
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundBuyerState = useOBState(selectedRoundAddress);
  const vaultActions = useVaultActions();
  const { address, account } = useAccount();
  const { pendingTx } = useTransactionContext();

  const handleMintOptions = async (): Promise<void> => {
    address &&
      (await vaultActions?.mintOptions({
        roundAddress: selectedRoundAddress ? selectedRoundAddress : "0x0",
      }));
  };

  const handleSubmit = () => {
    showConfirmation(
      "Mint",
      <>
        mint your
        <br />
        <span className="font-semibold text-[#fafafa]">
          {formatNumberText(
            Number(
              selectedRoundBuyerState
                ? selectedRoundBuyerState.mintableOptions
                : "0",
            ),
          )}
        </span>{" "}
        options
      </>,
      handleMintOptions,
    );
  };

  const isButtonDisabled = (): boolean => {
    if (!account) return true;
    if (pendingTx) return true;
    if (selectedRoundBuyerState?.mintableOptions?.toString() === "0")
      return true;

    return false;
  };

  useEffect(() => {}, [account]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow space-y-6 items-center justify-center">
        <div className="w-[92px] h-[92px] p-6 rounded-2xl bg-icon-gradient border-[1px] border-greyscale-800 flex flex-row justify-center items-center">
          <HammerIcon classname="mint-icon" />
        </div>
        <p className="max-w-[290px] text-[#bfbfbf] text-center">
          Your mintable option balance is
          <br />
          <span className="font-semibold text-[#fafafa]">
            {formatNumberText(
              Number(
                selectedRoundBuyerState?.mintableOptions?.toString() ?? "0",
              ),
            )}
          </span>
        </p>
      </div>

      <div className="mt-auto">
        <Hoverable
          dataId="mintButton"
          className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]"
        >
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled()}
            text="Mint Now"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default Mint;
