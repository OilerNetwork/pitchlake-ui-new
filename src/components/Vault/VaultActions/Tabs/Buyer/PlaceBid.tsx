import React, { useState, ReactNode, useMemo, useEffect } from "react";
import InputField from "@/components/Vault/Utils/InputField";
import { Layers3, Currency } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { PlaceBidArgs } from "@/lib/types";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { formatUnits, parseUnits, parseEther, formatEther } from "ethers";
import { useAccount } from "@starknet-react/core";
import useERC20 from "@/hooks/erc20/useERC20";
import { num, Call } from "starknet";
import { formatNumberText } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import useLatestTimetamp from "@/hooks/chain/useLatestTimestamp";
import { useProvider } from "@starknet-react/core";
import { useContractWrite, useContract } from "@starknet-react/core";
import { erc20ABI, optionRoundABI } from "@/lib/abi";

interface PlaceBidProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const LOCAL_STORAGE_KEY1 = "bidAmount";
const LOCAL_STORAGE_KEY2 = "bidPriceGwei";

const PlaceBid: React.FC<PlaceBidProps> = ({ showConfirmation }) => {
  const { vaultState, roundActions, selectedRoundState } = useProtocolContext();
  const [state, setState] = useState({
    bidAmount: localStorage.getItem(LOCAL_STORAGE_KEY1) || "",
    bidPrice: localStorage.getItem(LOCAL_STORAGE_KEY2) || "",
    isButtonDisabled: true,
    isAmountOk: "",
    isPriceOk: "",
  });

  const { account } = useAccount();
  const { pendingTx, setPendingTx } = useTransactionContext();
  const { provider } = useProvider();
  const { timestamp } = useLatestTimetamp(provider);

  const { allowance, balance } = useERC20(
    vaultState?.ethAddress,
    selectedRoundState?.address
  );
  const [needsApproving, setNeedsApproving] = useState<string>("0");

  // Option Round Contract
  const { contract: optionRoundContractRaw } = useContract({
    abi: optionRoundABI,
    address: selectedRoundState?.address,
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
    address: vaultState?.ethAddress,
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

  // Approve and Bid Multicall
  const calls: Call[] = useMemo(() => {
    const calls: Call[] = [];
    if (
      !account ||
      !selectedRoundState?.address ||
      !optionRoundContract ||
      !ethContract ||
      !state.bidPrice ||
      !state.bidAmount ||
      Number(state.bidAmount) <= 0 ||
      Number(state.bidPrice) <= 0
    ) {
      return calls;
    }

    const priceWei = num.toBigInt(parseUnits(state.bidPrice, "gwei"));
    const amount = num.toBigInt(state.bidAmount);
    const totalWei = priceWei * amount;

    const approveCall = ethContract.populateTransaction.approve(
      selectedRoundState.address.toString(),
      num.toBigInt(totalWei),
    );
    const bidCall = optionRoundContract.populateTransaction.place_bid(
      BigInt(state.bidAmount),
      parseUnits(state.bidPrice, "gwei"),
    );

    if (
      approveCall &&
      num.toBigInt(allowance) < num.toBigInt(needsApproving) &&
      totalWei < num.toBigInt(balance)
    )
      calls.push(approveCall);
    if (bidCall) calls.push(bidCall);

    return calls;
  }, [
    state.bidPrice,
    state.bidAmount,
    selectedRoundState?.address,
    account,
    balance,
    allowance,
    needsApproving,
  ]);
  const { writeAsync } = useContractWrite({ calls });

  // Send confirmation
  const handleSubmitForMulticall = () => {
    showConfirmation(
      "Bid",
      <>
        bid
        <br />
        <span className="font-semibold text-[#fafafa]">
          {bidPriceGwei} GWEI{" "}
        </span>{" "}
        per
        <br />
        <span className="font-semibold text-[#fafafa]">
          {formatNumberText(Number(bidAmount))} options
        </span>
        , totaling
        <br />
        <span className="font-semibold text-[#fafafa]">{bidTotalEth} ETH</span>?
      </>,
      async () => {
        await handleMulticall();
        setState((prevState) => ({ ...prevState, bidAmount: "" }));
      },
    );
  };

  // Open wallet
  const handleMulticall = async () => {
    const data = await writeAsync();
    setPendingTx(data?.transaction_hash);
    localStorage.removeItem(LOCAL_STORAGE_KEY1);
    localStorage.removeItem(LOCAL_STORAGE_KEY2);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      updateState({ bidAmount: value });
    }
    localStorage.setItem(LOCAL_STORAGE_KEY1, value);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const formattedValue = value.includes(".")
      ? value.slice(0, value.indexOf(".") + 10)
      : value;
    updateState({ bidPrice: formattedValue });
    localStorage.setItem(LOCAL_STORAGE_KEY2, value);
  };

  const bidPriceWei = parseUnits(state.bidPrice ? state.bidPrice : "0", "gwei");
  const bidPriceEth = formatEther(bidPriceWei);
  const bidPriceGwei = formatUnits(bidPriceWei, "gwei");
  const bidAmount = state.bidAmount ? state.bidAmount : "0";
  const bidTotalEth = Number(bidPriceEth) * Number(bidAmount);

  useEffect(() => {
    // Check amount
    let amountReason = "";
    if (timestamp > Number(selectedRoundState?.auctionEndDate)) {
      amountReason = "Auction ended";
    } else if (!account) {
      amountReason = "Connect account";
    } else if (state.bidAmount == "") {
      // amountReason = "Enter amount";
    } else if (Number(state.bidAmount) < 0) {
      amountReason = "Amount must be positive";
    } else if (Number(state.bidAmount) == 0) {
      amountReason = "Amount must be greater than 0";
    } else if (
      BigInt(state.bidAmount) >
      BigInt(selectedRoundState?.availableOptions?.toString() || "0")
    ) {
      amountReason = "Amount is more than total available";
    }

    // Check price
    let priceReason = "";
    const reservePriceGwei = formatUnits(
      selectedRoundState ? selectedRoundState.reservePrice : 0,
      "gwei",
    );
    if (timestamp > Number(selectedRoundState?.auctionEndDate)) {
      priceReason = "Auction ended";
    } else if (!account) {
      priceReason = "Connect account";
    } else if (state.bidPrice == "") {
      // priceReason = "Enter price";
    } else if (Number(state.bidPrice) < 0) {
      priceReason = "Price must be positive";
    } else if (Number(state.bidPrice) < Number(reservePriceGwei)) {
      priceReason = "Price must be at least the reserve price";
    }

    const isButtonDisabled = (): boolean => {
      if (pendingTx) return true;
      if (priceReason !== "" || amountReason !== "") return true;
      if (!state.bidAmount || !state.bidPrice) return true;
      return false;
    };

    setState((prevState) => ({
      ...prevState,
      isButtonDisabled: isButtonDisabled(),
      isAmountOk: amountReason,
      isPriceOk: priceReason,
    }));

    const priceWei = num.toBigInt(
      parseUnits(state.bidPrice ? state.bidPrice : "0", "gwei"),
    );
    const amount = num.toBigInt(state.bidAmount ? state.bidAmount : "0");
    const totalWei = priceWei * amount;

    setNeedsApproving(
      num.toBigInt(allowance) < num.toBigInt(totalWei)
        ? totalWei.toString()
        : "0",
    );
  }, [
    account,
    timestamp,
    state.bidAmount,
    state.bidPrice,
    allowance,
    selectedRoundState?.availableOptions,
    selectedRoundState?.reservePrice,
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6 p-6">
        <InputField
          label="Enter Amount"
          type="integer"
          //value={state.bidAmount}
          value={state.bidAmount}
          onChange={handleAmountChange}
          placeholder="e.g. 5000"
          icon={
            <Layers3
              size="20px"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 stroke-[1px]"
            />
          }
          error={state.isAmountOk}
        />
        <InputField
          label="Enter Price (GWEI)"
          type="number"
          value={state.bidPrice}
          onChange={handlePriceChange}
          placeholder="e.g. 0.3"
          icon={
            <FontAwesomeIcon
              icon={faEthereum}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pr-2"
            />
          }
          error={state.isPriceOk}
        />
      </div>
      <div className="flex justify-between text-sm px-6 pb-1">
        <span className="text-gray-400">Total</span>
        <span>{bidTotalEth.toFixed(2)} ETH</span>
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
            text="Place Bid"
          />
        </div>
      </div>
    </div>
  );
};

export default PlaceBid;
