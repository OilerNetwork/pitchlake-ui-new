import React, { useState, useEffect, ReactNode, useMemo } from "react";
import InputField from "@/components/Vault/Utils/InputField";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { formatEther, parseEther } from "ethers";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useAccount } from "@starknet-react/core";
import Hoverable from "@/components/BaseComponents/Hoverable";
import { formatNumber } from "@/lib/utils";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import useLPState from "@/hooks/vault_v2/states/useLPState";
import { EthereumIcon } from "@/components/Icons";

const LOCAL_STORAGE_KEY = "withdrawAmount";

interface WithdrawLiquidityProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const WithdrawLiquidity: React.FC<WithdrawLiquidityProps> = ({
  showConfirmation,
}) => {
  const lpState = useLPState();
  const vaultActions = useVaultActions();
  const [state, setState] = useState({
    amount: localStorage.getItem(LOCAL_STORAGE_KEY) || "",
  });
  const { pendingTx } = useTransactionContext();
  const { account } = useAccount();

  const updateState = (updates: Partial<typeof state>) => {
    setState((prevState: typeof state) => ({ ...prevState, ...updates }));
  };

  const liquidityWithdraw = async (): Promise<void> => {
    await vaultActions.withdrawLiquidity({ amount: parseEther(state.amount) });
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const handleSubmit = () => {
    showConfirmation(
      "Liquidity Withdraw",
      <>
        withdraw
        <br />
        <span className="font-semibold text-[#fafafa]">
          {formatNumber(Number(state.amount))} ETH
        </span>{" "}
        from your unlocked balance
      </>,
      liquidityWithdraw,
    );
  };

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, state.amount);
  }, [state.amount]);

  const amountReason: string = useMemo(() => {
    if (!account) return "Connect account";
    else if (state.amount == "") {
      return "";
    } else if (Number(state.amount) <= 0)
      return "Amount must be greater than 0";
    else if (parseEther(state.amount) > BigInt(lpState?.unlockedBalance || "0"))
      return `Exceeds balance (${parseFloat(
        formatEther(lpState?.unlockedBalance?.toString() || "0"),
      ).toFixed(5)} ETH)`;
    else return "";
  }, [state.amount, lpState?.unlockedBalance, account]);

  const isButtonDisabled = useMemo(() => {
    if (pendingTx || amountReason !== "" || state.amount === "") return true;
    return false;
  }, [pendingTx, amountReason, state.amount]);

  return (
    <>
      <div
        className={`flex flex-row px-6 items-start ${lpState?.unlockedBalance == 0 ? "" : "gap-2"}`}
      >
        <Hoverable
          dataId="inputWithdrawalAmount"
          className={`flex flex-col space-y-5 mb-[auto] ${lpState?.unlockedBalance == 0 ? "w-[100%]" : ""}`}
        >
          <InputField
            type="number"
            value={state.amount || ""}
            label="Enter Amount"
            onChange={(e) => {
              const value = e.target.value;
              const formattedValue = value.includes(".")
                ? value.slice(0, value.indexOf(".") + 19)
                : value;

              updateState({ amount: formattedValue });
              localStorage?.setItem(LOCAL_STORAGE_KEY, e.target.value);
            }}
            placeholder="e.g. 5.0"
            icon={
              <EthereumIcon classname="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            }
            error={amountReason}
          />
        </Hoverable>
        {lpState?.unlockedBalance == 0 ? null : (
          <Hoverable dataId="maxButton">
            <button
              className="mt-[22px] border border-[1.5px] border-[#454545] w-[56px] h-[44px] rounded-lg text-[#F5EBB8] hover-zoom-small"
              onClick={() => {
                updateState({
                  amount: formatEther(lpState?.unlockedBalance || "0"),
                });
              }}
            >
              MAX
            </button>
          </Hoverable>
        )}
      </div>

      <div className="flex flex-col h-[full] mt-[auto]">
        <Hoverable
          dataId="lpActionUnlockedBalance"
          className="px-6 flex justify-between text-sm mb-6 mt-auto"
        >
          <span className="text-gray-400 balance-label">Unlocked Balance</span>
          <span className="text-white balance-amount">
            {formatNumber(
              parseFloat(
                formatEther(lpState?.unlockedBalance?.toString() || "0"),
              ),
            )}{" "}
            ETH
          </span>
        </Hoverable>
        <Hoverable
          dataId="withdrawButton"
          className="mt-[auto] flex justify-between text-sm border-t border-[#262626] p-6"
        >
          <ActionButton
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            text="Withdraw"
          />
        </Hoverable>
      </div>
    </>
  );
};

export default WithdrawLiquidity;
