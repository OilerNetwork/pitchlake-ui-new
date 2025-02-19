import React, { useState, ReactNode, useMemo, useEffect } from "react";
import InputField from "@/components/Vault/Utils/InputField";
import { Layers3 } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import { formatUnits, parseUnits, formatEther, parseEther } from "ethers";
import { useAccount, useContractWrite } from "@starknet-react/core";
import useERC20 from "@/hooks/erc20/useERC20";
import { num, Call } from "starknet";
import { formatNumber, formatNumberText } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useContract } from "@starknet-react/core";
import { erc20ABI, vaultABI } from "@/lib/abi";
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useTimeContext } from "@/context/TimeProvider";
import { EthereumIcon } from "@/components/Icons";

const LOCAL_STORAGE_KEY1 = "bidAmount";
const LOCAL_STORAGE_KEY2 = "bidPriceGwei";

interface PlaceBidProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const PlaceBid: React.FC<PlaceBidProps> = ({ showConfirmation }) => {
  const { vaultState, selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const [state, setState] = useState({
    bidAmount: localStorage.getItem(LOCAL_STORAGE_KEY1) || "",
    bidPrice: localStorage.getItem(LOCAL_STORAGE_KEY2) || "",
  });

  const { account } = useAccount();
  const { pendingTx, setPendingTx } = useTransactionContext();
  const { timestamp } = useTimeContext();

  const { allowance, balance } = useERC20(
    vaultState?.ethAddress as `0x${string}`,
    selectedRoundState?.address,
  );
  //const [needsApproving, setNeedsApproving] = useState<string>("0");

  // Vault Contract
  const { contract: vaultContractRaw } = useContract({
    abi: vaultABI,
    address: vaultState?.address as `0x${string}`,
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

  const needsApproving = useMemo(() => {
    const priceWei = num.toBigInt(
      parseUnits(state.bidPrice ? state.bidPrice : "0", "gwei"),
    );
    const amount = num.toBigInt(state.bidAmount ? state.bidAmount : "0");
    const totalWei = priceWei * amount;

    if (num.toBigInt(allowance) < num.toBigInt(totalWei))
      return totalWei.toString();
    else return "0";
  }, [state.bidPrice, state.bidAmount, allowance]);

  // Approve and Bid Multicall
  const calls: Call[] = useMemo(() => {
    const calls: Call[] = [];
    if (
      !account ||
      !selectedRoundState?.address ||
      !vaultContract ||
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
    const bidCall = vaultContract.populateTransaction.place_bid(
      BigInt(state.bidAmount),
      parseUnits(state.bidPrice, "gwei"),
    );

    if (approveCall && BigInt(allowance) < BigInt(needsApproving))
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
        <span className="font-semibold text-[#fafafa]">
          {formatNumber(bidTotalEth)} ETH
        </span>
        ?
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
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const formattedValue = value.includes(".")
      ? value.slice(0, value.indexOf(".") + 10)
      : value;
    updateState({ bidPrice: formattedValue });
  };

  const bidPriceWei = parseUnits(state.bidPrice ? state.bidPrice : "0", "gwei");
  const bidPriceEth = formatEther(bidPriceWei);
  const bidPriceGwei = formatUnits(bidPriceWei, "gwei");
  const bidAmount = state.bidAmount ? state.bidAmount : "0";
  const bidTotalEth = Number(bidPriceEth) * Number(bidAmount);

  const amountReason: string = useMemo(() => {
    if (!account) return "Connect account";
    else if (timestamp > Number(selectedRoundState?.auctionEndDate))
      return "Auction ended";
    else if (state.bidAmount == "") return "";
    else if (Number(state.bidAmount) <= 0)
      return "Amount must be greater than 0";
    else return "";
  }, [
    account,
    timestamp,
    selectedRoundState?.auctionEndDate,
    state.bidAmount,
    balance,
  ]);

  const priceReason: string = useMemo(() => {
    const reservePriceWei = selectedRoundState?.reservePrice
      ? selectedRoundState.reservePrice
      : 0;
    const reservePriceGwei = formatUnits(reservePriceWei, "gwei");
    if (!account) return "Connect account";
    else if (timestamp > Number(selectedRoundState?.auctionEndDate))
      return "Auction ended";
    else if (state.bidPrice == "") return "";
    else if (Number(state.bidPrice) < Number(reservePriceGwei))
      return `Price must be at least the reserve price (${Number(reservePriceGwei).toFixed(5)} GWEI)`;
    else if (BigInt(BigInt(bidPriceWei) * BigInt(bidAmount)) > BigInt(balance))
      return `Exceeds balance (${parseFloat(
        formatEther(balance || "0"),
      ).toFixed(5)} ETH)`;
    else return "";
  }, [
    account,
    timestamp,
    selectedRoundState?.auctionEndDate,
    selectedRoundState?.reservePrice,
    state.bidPrice,
    balance,
  ]);

  const isButtonDisabled: boolean = useMemo(() => {
    if (pendingTx) return true;
    if (priceReason !== "" || amountReason !== "") return true;
    if (!state.bidAmount || !state.bidPrice) return true;
    return false;
  }, [pendingTx, priceReason, amountReason, state.bidAmount, state.bidPrice]);

  useEffect(() => {
    localStorage?.setItem(LOCAL_STORAGE_KEY1, state.bidAmount);
  }, [state.bidAmount]);

  useEffect(() => {
    localStorage?.setItem(LOCAL_STORAGE_KEY2, state.bidPrice);
  }, [state.bidPrice]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow space-y-6 p-6">
        <Hoverable dataId="inputBidAmount" className="place-bid-container">
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
            error={amountReason}
          />
        </Hoverable>
        <Hoverable dataId="inputBidPrice">
          <InputField
            label="Enter Price (GWEI)"
            type="number"
            value={state.bidPrice}
            onChange={handlePriceChange}
            placeholder="e.g. 0.3"
            icon={
              <EthereumIcon classname="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            }
            error={priceReason}
          />
        </Hoverable>
      </div>
      <Hoverable dataId="newBidSummary" className="flex flex-col h-[full]">
        <div className="flex justify-between text-sm px-6 pb-1">
          <span className="text-gray-400 place-bid-total">Total</span>
          <span>{formatNumber(bidTotalEth)} ETH</span>
        </div>
      </Hoverable>
      <Hoverable dataId="placingBidBalance" className="flex flex-col h-[full]">
        <div className="flex justify-between text-sm px-6 pb-6">
          <span className="text-gray-400">Balance</span>
          <span>
            {formatNumber(parseFloat(formatEther(BigInt(balance))))} ETH
          </span>
        </div>
      </Hoverable>
      <div className="mt-auto">
        <Hoverable
          dataId="placeBidButton"
          className="place-bid-action-button px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]"
        >
          <ActionButton
            onClick={handleSubmitForMulticall}
            disabled={isButtonDisabled}
            text="Place Bid"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default PlaceBid;
