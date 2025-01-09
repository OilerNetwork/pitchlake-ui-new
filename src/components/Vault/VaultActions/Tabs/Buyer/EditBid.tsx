import React, { useState, useMemo, ReactNode, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import InputField from "@/components/Vault/Utils/InputField";
import { LayerStackIcon } from "@/components/Icons";
import { formatUnits, parseUnits, formatEther } from "ethers";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { num, Call } from "starknet";
import useERC20 from "@/hooks/erc20/useERC20";
import { useAccount } from "@starknet-react/core";
import useLatestTimetamp from "@/hooks/chain/useLatestTimestamp";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useProvider } from "@starknet-react/core";
import {
  useSendTransaction,
  useContract,
} from "@starknet-react/core";
import { erc20ABI, optionRoundABI } from "@/lib/abi";

interface EditModalProps {
  onConfirm: () => void;
  onClose: () => void;
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
  bidToEdit: any;
}

function stringGweiToWei(gwei: string): bigint {
  return parseUnits(gwei ? gwei : "0", "gwei");
}

const LOCAL_STORAGE_KEY = "editBidPriceGwei";

const EditModal: React.FC<EditModalProps> = ({
  onConfirm,
  onClose,
  showConfirmation,
  bidToEdit,
}) => {
  const { account } = useAccount();
  const { pendingTx, setPendingTx } = useTransactionContext();
  const { provider } = useProvider();
  const { timestamp } = useLatestTimetamp(provider);
  const bid = bidToEdit
    ? bidToEdit.item
    : { amount: "0", price: "0", bid_id: "" };
  const bidId = bid.bid_id;

  const oldAmount = num.toBigInt(bid.amount);
  const oldPriceWei = num.toBigInt(bid.price);
  const oldPriceGwei = formatUnits(oldPriceWei, "gwei");
  const { vaultState, selectedRoundState } = useProtocolContext();
  const [state, setState] = useState({
    newPriceGwei: localStorage.getItem(LOCAL_STORAGE_KEY) || "",
    isButtonDisabled: true,
    error: "",
  });
  const { allowance, balance } = useERC20(
    vaultState?.ethAddress as `0x${string}`,
    selectedRoundState?.address,
  );

  const [needsApproving, setNeedsApproving] = useState<string>("0");
  // Option Round Contract
  const { contract: optionRoundContractRaw } = useContract({
    abi: optionRoundABI,
    address: selectedRoundState?.address as `0x${string}`,
  });
  const optionRoundContract = useMemo(() => {
    if (!optionRoundContractRaw) return;
    const typedContract = optionRoundContractRaw.typedv2(optionRoundABI);
    if (account) typedContract.connect(account);
    return typedContract;
  }, [optionRoundContractRaw, account]);
  // ETH Contract
  const { contract: ethContractRaw } = useContract({
    abi: erc20ABI,
    address: vaultState?.ethAddress as `0x${string}`,
  });
  const ethContract = useMemo(() => {
    if (!ethContractRaw) return;
    const typedContract = ethContractRaw.typedv2(erc20ABI);
    if (account) typedContract.connect(account);
    return typedContract;
  }, [ethContractRaw, account]);

  const updateState = (updates: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const priceIncreaseWei = useMemo(() => {
    const newPriceWei = stringGweiToWei(state.newPriceGwei);
    if (newPriceWei <= oldPriceWei) return num.toBigInt(0);
    else return newPriceWei - oldPriceWei;
  }, [state.newPriceGwei, oldPriceWei]);

  const totalNewCostWei = useMemo((): bigint => {
    return num.toBigInt(oldAmount) * priceIncreaseWei;
  }, [priceIncreaseWei, oldAmount]);

  const totalNewCostEth = useMemo((): string => {
    return formatUnits(totalNewCostWei, "ether");
  }, [totalNewCostWei]);

  // Approve and Bid Multicall
  const calls: Call[] = useMemo(() => {
    const calls: Call[] = [];
    if (
      !account ||
      !selectedRoundState?.address ||
      !optionRoundContract ||
      !ethContract ||
      priceIncreaseWei <= 0
    ) {
      return calls;
    }

    const totalCostWei = num.toBigInt(totalNewCostWei);

    const approveCall = ethContract.populateTransaction.approve(
      selectedRoundState.address.toString(),
      num.toBigInt(totalCostWei),
    );
    const editBidCall = optionRoundContract.populateTransaction.update_bid(
      bidId,
      priceIncreaseWei,
    );

    if (
      approveCall &&
      num.toBigInt(allowance) < num.toBigInt(needsApproving) &&
      totalCostWei < num.toBigInt(balance)
    )
      calls.push(approveCall);
    if (editBidCall) calls.push(editBidCall);

    return calls;
  }, [
    needsApproving,
    selectedRoundState?.address,
    account,
    balance,
    allowance,
    optionRoundContract,
    ethContract,
    bidId,
  ]);
  const { sendAsync} = useSendTransaction({ calls });

  // Send confirmation
  const handleSubmitForMulticall = () => {
    showConfirmation(
      "Update Bid",
      <>
        Update your bid? You will
        <br /> be spending an additional
        <br />
        <span className="font-semibold text-[#fafafa]">
          {totalNewCostEth} ETH
        </span>
      </>,
      async () => {
        await handleMulticall();
        onClose();
      },
    );
  };

  // Open wallet
  const handleMulticall = async () => {
    const data = await sendAsync();
    setPendingTx(data?.transaction_hash);
    setState((prevState) => ({ ...prevState, newPriceGwei: "" }));
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    onClose();
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const formattedValue = value.includes(".")
      ? value.slice(0, value.indexOf(".") + 10)
      : value;
    updateState({ newPriceGwei: formattedValue });
    localStorage.setItem(LOCAL_STORAGE_KEY, formattedValue);
  };

  useEffect(() => {
    let error = "";
    const newPriceGwei = state.newPriceGwei;
    if (timestamp > Number(selectedRoundState?.auctionEndDate)) {
      error = "Auction ended";
    } else if (!account) {
      error = "Connect account";
    } else if (!state.newPriceGwei) {
      // error = "Enter price";
    } else if (parseFloat(newPriceGwei) <= parseFloat(oldPriceGwei)) {
      error = "Bid price must increase";
    }

    const isButtonDisabled = (): boolean => {
      if (pendingTx) return true;
      if (error !== "") return true;
      if (!state.newPriceGwei) return true;
      return false;
    };

    const cost = num.toBigInt(totalNewCostWei);

    updateState({ error, isButtonDisabled: isButtonDisabled() });
    setNeedsApproving(
      num.toBigInt(allowance) < num.toBigInt(cost) ? cost.toString() : "0",
    );
  }, [
    timestamp,
    state.newPriceGwei,
    oldPriceGwei,
    account,
    allowance,
    selectedRoundState?.address,
    pendingTx,
  ]);

  return (
    <div className="bg-[#121212] border border-[#262626] rounded-xl p-0 w-full flex flex-col h-full">
      <div className="flex items-center p-4">
        <button
          onClick={onClose}
          className="flex justify-center items-center mr-4 w-[44px] h-[44px] rounded-lg border-[1px] border-[#262626] bg-[#0D0D0D]"
        >
          <ChevronLeft className="size-[16px] stroke-[4px] text-[#F5EBB8]" />
        </button>
        <h2 className="text-[#FAFAFA] text-[16px] font-medium text-md">
          Edit Bid
        </h2>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-6 pt-2 px-4">
          <div>
            <InputField
              type="number"
              value={""}
              label="Current Amount"
              onChange={(_e) => {}}
              placeholder={oldAmount.toString()}
              disabled={true}
              className="text-[#8c8c8c] bg-[#161616] border-[#262626]"
              icon={
                <LayerStackIcon
                  stroke="#8C8C8C"
                  fill="transparent"
                  classname="absolute right-2 top-1/2 -translate-y-1/2"
                />
              }
            />
          </div>
          <div>
            <InputField
              type="number"
              value={state.newPriceGwei}
              label="Enter Price"
              label2={`Current: ${oldPriceGwei} GWEI`}
              onChange={handlePriceChange}
              placeholder={`e.g. ${oldPriceGwei}`}
              icon={
                <FontAwesomeIcon
                  icon={faEthereum}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                />
              }
              error={state.error}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm px-6 pb-1">
        <span className="text-gray-400">Total</span>
        <span>{parseFloat(totalNewCostEth).toFixed(6)} ETH</span>
      </div>
      <div className="flex justify-between text-sm px-6 pb-6">
        <span className="text-gray-400">Balance</span>
        <span>
          {parseFloat(formatEther(num.toBigInt(balance))).toFixed(3)} ETH
        </span>
      </div>
      <div className="mt-auto">
        <div className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]">
          <ActionButton
            onClick={handleSubmitForMulticall}
            disabled={state.isButtonDisabled}
            text="Edit Bid"
          />
        </div>
      </div>
    </div>
  );
};

export default EditModal;
