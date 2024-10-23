import React, { useState } from "react";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import useERC20 from "@/hooks/erc20/useERC20";
import {
  DepositArgs,
  LiquidityProviderStateType,
  VaultStateType,
} from "@/lib/types";
import InputField from "@/components/Vault/Utils/InputField";
import { ChevronDown, User } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import ButtonTabs from "../../ButtonTabs";
import { parseEther, formatEther } from "ethers";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { getDevAccount } from "@/lib/constants";
import { RpcProvider, Call } from "starknet";

interface DepositProps {
  showConfirmation: (
    modalHeader: string,
    action: string,
    onConfirm: () => Promise<void>,
  ) => void;
}

interface DepositState {
  amount: string;
  isDepositAsBeneficiary: boolean;
  beneficiaryAddress: string;
  activeWithdrawTab: "For Myself" | "As Beneficiary";
}

const Deposit: React.FC<DepositProps> = ({ showConfirmation }) => {
  const { vaultState, lpState, vaultActions } = useProtocolContext();
  const [state, setState] = useState<DepositState>({
    amount: "0",
    isDepositAsBeneficiary: false,
    beneficiaryAddress: "",
    activeWithdrawTab: "For Myself",
  });

  const account = getDevAccount(
    new RpcProvider({ nodeUrl: "http://localhost:5050/rpc" }),
  );
  console.log("AAA ACCOUNT", account);

  const updateState = (updates: Partial<DepositState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const { balance, allowance, increaseAllowance } = useERC20(
    vaultState?.address,
    vaultState?.ethAddress,
  );

  console.log("BALANCE", balance);
  console.log("ALLOWANCE", allowance);

  const handleDeposit = async (): Promise<void> => {
    console.log("Current allowance:", allowance);
    if (Number(allowance) < Number(state.amount)) {
      let difference = Number(state.amount) - Number(allowance);
      console.log("Increasing allowance by: ", difference);
      await increaseAllowance({
        amount: parseEther(state.amount),
        spender: vaultState ? vaultState.address.toString() : "",
      });
    }

    console.log("Depositing", state.amount);
    await vaultActions.depositLiquidity({
      amount: parseEther(state.amount),
      beneficiary:
        "0x127fd5f1fe78a71f8bcd1fec63e3fe2f0486b6ecd5c86a0466c3a21fa5cfcec", //state.beneficiaryAddress,
    });
  };

  const handleSubmit = () => {
    console.log("Deposit confirmation");
    showConfirmation(
      "Deposit",
      `deposit ${state.amount} ETH to this round?`,
      handleDeposit,
    );
  };

  const isDepositDisabled = (): boolean => {
    // No negatives
    if (Number(state.amount) <= Number(0)) {
      return true;
    }

    // If no address is entered
    if (state.isDepositAsBeneficiary) {
      if (state.beneficiaryAddress.trim() === "") {
        return true;
      }
    }

    return false;
  };

  console.log("LPSTATE", lpState);
  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6">
        <ButtonTabs
          tabs={["For Myself", "As Beneficiary"]}
          activeTab={state.activeWithdrawTab}
          setActiveTab={(tab) => {
            updateState({
              activeWithdrawTab: tab as "For Myself" | "As Beneficiary",
              isDepositAsBeneficiary: tab === "As Beneficiary",
            });
          }}
        />

        {state.isDepositAsBeneficiary && (
          <div>
            <InputField
              type="text"
              value={state.beneficiaryAddress}
              label="Enter Address"
              onChange={(e) => {
                updateState({ beneficiaryAddress: e.target.value });
                // TODO: Check address regex
              }}
              placeholder="Depositor's Address"
              icon={
                <User className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              }
            />
          </div>
        )}

        <div>
          <InputField
            type="number"
            value={state.amount}
            label="Enter Amount"
            onChange={(e) => updateState({ amount: e.target.value })}
            placeholder="e.g. 5.0"
            //icon={
            //  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            //}
          />
        </div>
      </div>
      <div className="mt-auto">
        <div className="flex justify-between text-sm mb-4 pt-4">
          <span className="text-gray-400">Unlocked Balance</span>
          <span className="text-white">
            {formatEther(
              lpState?.unlockedBalance ? lpState.unlockedBalance.toString() : 0,
            ).toString()}{" "}
            ETH
          </span>
        </div>
        <div className="flex justify-between text-sm mb-4 pt-4 border-t border-[#262626]">
          <ActionButton
            onClick={handleSubmit}
            disabled={isDepositDisabled()}
            text="Deposit"
          />
        </div>
      </div>
    </div>
  );
};

export default Deposit;
