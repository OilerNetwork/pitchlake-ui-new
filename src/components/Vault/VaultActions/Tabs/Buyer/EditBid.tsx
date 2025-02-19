import React, { useState, useMemo, ReactNode, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import ActionButton from "@/components/Vault/Utils/ActionButton";
import InputField from "@/components/Vault/Utils/InputField";
import { EthereumIcon, LayerStackIcon } from "@/components/Icons";
import { formatUnits, parseUnits, formatEther } from "ethers";
import { num, Call } from "starknet";
import useERC20 from "@/hooks/erc20/useERC20";
import { useAccount } from "@starknet-react/core";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useContractWrite, useContract } from "@starknet-react/core";
import { erc20ABI, vaultABI } from "@/lib/abi";
import Hoverable from "@/components/BaseComponents/Hoverable";
import { formatNumber } from "@/lib/utils";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useTimeContext } from "@/context/TimeProvider";

const LOCAL_STORAGE_KEY = "editBidPriceGwei";

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

const EditModal: React.FC<EditModalProps> = ({
  onConfirm,
  onClose,
  showConfirmation,
  bidToEdit,
}) => {
  const { account } = useAccount();
  const { pendingTx, setPendingTx } = useTransactionContext();
  const { timestamp } = useTimeContext();
  const bid = bidToEdit
    ? bidToEdit.item
    : { amount: "0", price: "0", bid_id: "" };
  const bidId = bid.bid_id;

  const oldAmount = num.toBigInt(bid.amount);
  const oldPriceWei = num.toBigInt(bid.price);
  const oldPriceGwei = formatUnits(oldPriceWei, "gwei");
  const { vaultState, selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const [state, setState] = useState({
    newPriceGwei: localStorage.getItem(LOCAL_STORAGE_KEY) || "",
    //isButtonDisabled: true,
    //error: "",
  });
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

  const priceIncreaseWei = useMemo(() => {
    const newPriceWei = stringGweiToWei(state.newPriceGwei);
    if (newPriceWei <= oldPriceWei) return num.toBigInt(0);
    else return num.toBigInt(newPriceWei) - num.toBigInt(oldPriceWei);
  }, [state.newPriceGwei, oldPriceWei]);

  const totalNewCostWei = useMemo((): bigint => {
    return num.toBigInt(oldAmount) * priceIncreaseWei;
  }, [priceIncreaseWei, oldAmount]);

  const totalNewCostEth = useMemo((): string => {
    return formatUnits(totalNewCostWei, "ether");
  }, [totalNewCostWei]);

  const needsApproving = useMemo(() => {
    const cost = num.toBigInt(totalNewCostWei);

    if (num.toBigInt(allowance) < num.toBigInt(cost)) return cost.toString();
    return "0";
  }, [allowance, totalNewCostWei]);

  // Approve and Bid Multicall
  const calls: Call[] = useMemo(() => {
    const calls: Call[] = [];
    if (
      !account ||
      !selectedRoundState?.address ||
      !vaultContract ||
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

    const editBidCall = vaultContract.populateTransaction.update_bid(
      bidId,
      priceIncreaseWei,
    );

    if (
      approveCall &&
      num.toBigInt(allowance) < num.toBigInt(needsApproving)
      //  && totalCostWei < num.toBigInt(balance)
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
    vaultContract,
    ethContract,
    bidId,
  ]);
  const { writeAsync } = useContractWrite({ calls });

  // Send confirmation
  const handleSubmitForMulticall = () => {
    showConfirmation(
      "Update Bid",
      <>
        Update your bid? You will
        <br /> be spending an additional
        <br />
        <span className="font-semibold text-[#fafafa]">
          {formatNumber(Number(totalNewCostEth))} ETH
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
    const data = await writeAsync();
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
  };

  const priceReason: string = useMemo(() => {
    if (!account) return "Connect account";
    else if (timestamp > Number(selectedRoundState?.auctionEndDate))
      return "Auction ended";
    else if (!state.newPriceGwei) return "";
    else if (parseFloat(state.newPriceGwei) <= parseFloat(oldPriceGwei))
      return "Bid price must increase";
    else if (totalNewCostWei > balance)
      return `Exceeds balance (${parseFloat(
        formatEther(balance || "0"),
      ).toFixed(5)} ETH)`;
    else return "";
  }, [
    account,
    timestamp,
    selectedRoundState?.auctionEndDate,
    state.newPriceGwei,
    oldPriceGwei,
    totalNewCostWei,
    balance,
  ]);

  const isButtonDisabled: boolean = useMemo(() => {
    if (pendingTx) return true;
    if (priceReason !== "") return true;
    if (!state.newPriceGwei) return true;
    return false;
  }, [pendingTx, priceReason, state.newPriceGwei]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, state.newPriceGwei);
  }, [state.newPriceGwei]);

  return (
    <div className="bg-[#121212] border border-[#262626] rounded-xl p-0 w-full flex flex-col h-full edit-bid-modal">
      <div className="flex items-center p-4">
        <button
          onClick={onClose}
          className="flex justify-center items-center mr-4 w-[44px] h-[44px] rounded-lg border-[1px] border-[#262626] bg-[#0D0D0D] edit-bid-close"
        >
          <ChevronLeft className="size-[16px] stroke-[4px] text-[#F5EBB8]" />
        </button>
        <h2 className="text-[#FAFAFA] text-[16px] font-medium text-md edit-bid-header">
          Edit Bid
        </h2>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex-grow space-y-6 pt-2 px-4">
          <Hoverable
            dataId="inputUpdateBidAmount"
            className="edit-bid-current-amount"
          >
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
          </Hoverable>
          <Hoverable
            dataId="inputUpdateBidPrice"
            className="edit-bid-new-price"
          >
            <InputField
              type="number"
              value={state.newPriceGwei}
              label="Enter Price"
              label2={`Current: ${oldPriceGwei} GWEI`}
              onChange={handlePriceChange}
              placeholder={`e.g. ${oldPriceGwei}`}
              icon={
                <EthereumIcon classname="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              }
              error={priceReason}
            />
          </Hoverable>
        </div>
      </div>

      <Hoverable
        dataId="updateBidSummary"
        className="flex justify-between text-sm px-6 pb-1 edit-bid-total"
      >
        <span className="text-gray-400">Total</span>
        <span>{formatNumber(parseFloat(totalNewCostEth))} ETH</span>
      </Hoverable>
      <Hoverable
        dataId="placingBidBalance"
        className="flex justify-between text-sm px-6 pb-6 edit-bid-balance"
      >
        <span className="text-gray-400">Balance</span>
        <span>
          {formatNumber(parseFloat(formatEther(num.toBigInt(balance))))} ETH
        </span>
      </Hoverable>
      <div className="mt-auto">
        <Hoverable
          dataId="updateBidButton"
          className="px-6 flex justify-between text-sm mb-6 pt-6 border-t border-[#262626]"
        >
          <ActionButton
            onClick={handleSubmitForMulticall}
            disabled={isButtonDisabled}
            text="Edit Bid"
          />
        </Hoverable>
      </div>
    </div>
  );
};

export default EditModal;
