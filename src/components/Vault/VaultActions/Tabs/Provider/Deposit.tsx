import React, { useState, ReactNode, useMemo, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { parseEther, formatEther } from "ethers";
import { useProtocolContext } from "@/context/ProtocolProvider";
import InputField from "@/components/Vault/Utils/InputField";
import { User } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import ButtonTabs from "../ButtonTabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { num, Call } from "starknet";
import { useContractWrite, useContract } from "@starknet-react/core";
import { erc20ABI, vaultABI } from "@/lib/abi";
import useERC20 from "@/hooks/erc20/useERC20";
import { shortenString } from "@/lib/utils";

interface DepositProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

function isValidHex64(input: string): boolean {
  const regex = /^0x[a-fA-F0-9]{64}$/;
  return regex.test(input);
}

const LOCAL_STORAGE_KEY = "depositAmountWei";

interface DepositState {
  amount: string;
  isDepositAsBeneficiary: boolean;
  beneficiaryAddress: string;
  activeWithdrawTab: "For Me" | "For Someone Else";
  isButtonDisabled: boolean;
  isAmountOk: string;
  isBeneficiaryOk: string;
}

const Deposit: React.FC<DepositProps> = ({ showConfirmation }) => {
  const { vaultState, lpState } = useProtocolContext();
  const [state, setState] = useState<DepositState>({
    amount: localStorage.getItem(LOCAL_STORAGE_KEY) || "",
    isDepositAsBeneficiary: false,
    beneficiaryAddress: "",
    activeWithdrawTab: "For Me",
    isButtonDisabled: true,
    isAmountOk: "",
    isBeneficiaryOk: "",
  });
  const { account } = useAccount();
  const { pendingTx, setPendingTx } = useTransactionContext();
  const { allowance, balance } = useERC20(
    vaultState?.ethAddress,
    vaultState?.address,
  );

  const updateState = (updates: Partial<DepositState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  // Vault Contract
  const { contract: vaultContractRaw } = useContract({
    abi: vaultABI,
    address: vaultState?.address,
  });
  const vaultContract = useMemo(() => {
    if (!vaultContractRaw) return;
    const typedContract = vaultContractRaw.typedv2(vaultABI);
    if (account) typedContract.connect(account);
    return typedContract;
  }, [vaultContractRaw, account]);

  // ETH Contract
  const { contract: ethContractRaw } = useContract({
    abi: erc20ABI,
    address: vaultState?.ethAddress,
  });
  const ethContract = useMemo(() => {
    if (!ethContractRaw) return;
    const typedContract = ethContractRaw.typedv2(erc20ABI);
    if (account) typedContract.connect(account);
    return typedContract;
  }, [ethContractRaw, account]);

  // Approve and Deposit Multicall
  const calls: Call[] = useMemo(() => {
    const calls: Call[] = [];
    if (
      !vaultState ||
      !state?.amount ||
      !ethContract ||
      !vaultContract ||
      !account ||
      (state.isDepositAsBeneficiary &&
        !isValidHex64(state.beneficiaryAddress)) ||
      Number(state.amount) <= 0
    ) {
      return calls;
    }

    const amountWei = parseEther(state.amount);
    const beneficiaryAddress = state.isDepositAsBeneficiary
      ? state.beneficiaryAddress
      : account.address;

    const approveCall = ethContract.populateTransaction.approve(
      vaultState.address,
      num.toBigInt(amountWei),
    );
    const depositCall = vaultContract.populateTransaction.deposit(
      num.toBigInt(amountWei),
      beneficiaryAddress,
    );

    if (approveCall && num.toBigInt(allowance) < amountWei)
      calls.push(approveCall);
    if (depositCall) calls.push(depositCall);

    return calls;
  }, [
    state.amount,
    state.beneficiaryAddress,
    account,
    ethContract,
    vaultContract,
  ]);
  const { writeAsync } = useContractWrite({ calls });

  // Send confirmation
  const handleSubmitForMulticall = () => {
    showConfirmation(
      "Deposit",
      <>
        <br />
        deposit{" "}
        <span className="font-semibold text-[#fafafa]">{state.amount} ETH</span>
        {state.isDepositAsBeneficiary && (
          <>
            <br />
            for{" "}
            <span className="font-semibold text-[#fafafa]">
              {shortenString(state.beneficiaryAddress)}
            </span>
          </>
        )}{" "}
        {
          // into this round
        }
      </>,
      async () => {
        await handleMulticall();
        setState((prevState) => ({ ...prevState, amount: "" }));
      },
    );
  };

  // Open wallet
  const handleMulticall = async () => {
    const data = await writeAsync();
    setPendingTx(data?.transaction_hash);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  useEffect(() => {
    // Check amount
    let amountReason = "";
    if (!account) {
      amountReason = "Connect account";
    } else if (state.amount == "") {
      //amountReason = "Enter amount";
    } else if (Number(state.amount) < 0) {
      amountReason = "Amount must be positive";
    } else if (Number(state.amount) === 0) {
      amountReason = "Amount must be greater than 0";
    } else if (parseEther(state.amount) > balance) {
      amountReason = `Exceeds balance (${parseFloat(formatEther(balance.toString())).toFixed(4)} ETH)`;
    }

    // Check beneficiary
    let beneficiaryReason = "";
    if (state.isDepositAsBeneficiary) {
      if (state.beneficiaryAddress == "") {
        beneficiaryReason = "Enter address";
      } else if (!isValidHex64(state.beneficiaryAddress)) {
        beneficiaryReason = "Invalid address";
      }
    }

    const isButtonDisabled = (): boolean => {
      //if (!account) return true;
      if (pendingTx) return true;
      if (amountReason !== "" || state.amount === "") return true;
      if (beneficiaryReason !== "") return true;
      return false;
    };

    setState((prevState) => ({
      ...prevState,
      isButtonDisabled: isButtonDisabled(),
      isAmountOk: amountReason,
      isBeneficiaryOk: beneficiaryReason,
    }));
  }, [state.amount, state.isBeneficiaryOk, state.beneficiaryAddress, balance]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6 p-6">
        <ButtonTabs
          tabs={["For Me", "For Someone Else"]}
          activeTab={state.activeWithdrawTab}
          setActiveTab={(tab) =>
            updateState({
              activeWithdrawTab: tab as "For Me" | "For Someone Else",
              isDepositAsBeneficiary: tab === "For Someone Else",
            })
          }
        />
        {state.isDepositAsBeneficiary && (
          <InputField
            type="text"
            value={state.beneficiaryAddress}
            label="Enter Address"
            onChange={(e) =>
              updateState({ beneficiaryAddress: e.target.value })
            }
            placeholder="Depositor's Address"
            icon={
              <User className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            }
            error={state.isBeneficiaryOk}
          />
        )}
        <InputField
          type="number"
          value={state.amount}
          label="Enter Amount"
          onChange={(e) => {
            updateState({
              amount: e.target.value.slice(0, e.target.value.indexOf(".") + 19),
            });
            localStorage.setItem(LOCAL_STORAGE_KEY, e.target.value);
          }}
          placeholder="e.g. 5.0"
          error={state.isAmountOk}
          icon={
            <FontAwesomeIcon
              icon={faEthereum}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pr-2"
            />
          }
        />
      </div>

      <div className="mt-auto">
        {state.activeWithdrawTab === "For Me" && (
          <div className="px-6 flex justify-between text-sm mb-6 pt-6">
            <span className="text-gray-400">Unlocked Balance</span>
            <span className="text-white">
              {parseFloat(
                formatEther(
                  BigInt(lpState?.unlockedBalance?.toString() || "0"),
                ),
              ).toFixed(3)}{" "}
              ETH
            </span>
          </div>
        )}
        <div className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]">
          <ActionButton
            onClick={handleSubmitForMulticall}
            disabled={state.isButtonDisabled}
            text={pendingTx ? "Pending" : "Deposit"}
          />
        </div>
      </div>
    </div>
  );
};

export default Deposit;
