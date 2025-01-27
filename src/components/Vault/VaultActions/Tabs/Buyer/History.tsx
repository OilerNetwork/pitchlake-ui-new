import React, { useEffect, useState } from "react";
import { SquarePen, SquareArrowOutUpRight, ChevronLeft } from "lucide-react";
import { useProvider, useExplorer, Explorer } from "@starknet-react/core";
import { Provider } from "starknet";
import { formatNumberText } from "@/lib/utils";
import { formatUnits } from "ethers";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useProtocolContext } from "@/context/ProtocolProvider";
import Hoverable from "@/components/BaseComponents/Hoverable";

interface HistoryItem {
  bid_id: string;
  amount: string | number | bigint;
  price: string | number | bigint;
  roundState: string;
}

interface HistoryProps {
  items: HistoryItem[];
  bidToEdit: any;
  isTabsHidden: boolean;
  setBidToEdit: (bid: any) => void;
  setIsTabsHidden: (open: boolean) => void;
  //setIsTabsHidden: (open: boolean) => void;
}

const HistoryItem: React.FC<{
  item: HistoryItem;
  isLast: boolean;
  explorer: Explorer;
  setIsTabsHidden: (open: boolean) => void;
  setBidToEdit: (bid: any) => void;
  isTabsHidden: boolean;
  roundState: string;
}> = ({
  item,
  isLast,
  explorer,
  isTabsHidden,
  setIsTabsHidden,
  setBidToEdit,
  roundState,
}) => {
  return (
    <div
      className={`py-4 px-4 flex flex-row justify-between items-center ${!isLast ? "border-b border-[#262626]" : ""} m-0`}
    >
      <div className="flex align-center flex-col gap-1">
        <p className="text-[#fafafa] font-regular text-[14px] text-sm">
          {formatNumberText(Number(item.amount))} options at{" "}
          {formatUnits(item.price, "gwei")} GWEI each
        </p>
        <p className="text-[12px] text-[var(--buttongrey)] font-regular">
          Total:{" "}
          {Number(formatUnits(item.price, "ether")) * Number(item.amount)} ETH
        </p>
      </div>
      {roundState === "Auctioning" && (
        <Hoverable
          dataId="openUpdateBidPanel"
          className="edit-button bg-[#262626] p-2 rounded-lg cursor-pointer"
        >
          <SquarePen
            onClick={() => {
              setBidToEdit({ item });
              setIsTabsHidden(!isTabsHidden);
            }}
            size={20}
            className="text-[#E2E2E2]"
          />
        </Hoverable>
      )}
    </div>
  );
};

const History: React.FC<HistoryProps> = ({
  items,
  bidToEdit,
  isTabsHidden,
  setIsTabsHidden,
  setBidToEdit,
}) => {
  const explorer = useExplorer();
  const { pendingTx } = useTransactionContext();
  const { selectedRoundState } = useProtocolContext();

  const [modalState, setModalState] = useState<{
    show: boolean;
    onConfirm: () => Promise<void>;
  }>({
    show: false,
    onConfirm: async () => {},
  });

  const showEditModal = async (onConfirm: () => Promise<void>) => {
    setModalState({
      show: true,
      onConfirm,
    });
  };
  const hideEditModal = async (onConfirm: () => Promise<void>) => {
    setModalState({
      show: false,
      onConfirm,
    });
  };

  useEffect(() => {}, [items, pendingTx]);

  return (
    <div className="">
      {items.map((item, index) => (
        <HistoryItem
          key={index}
          item={item}
          isLast={index === items.length - 1}
          explorer={explorer}
          isTabsHidden={isTabsHidden}
          setIsTabsHidden={() => {
            setIsTabsHidden(!isTabsHidden);
            // also need to now show edit modal
          }}
          setBidToEdit={setBidToEdit}
          roundState={
            selectedRoundState?.roundState ? selectedRoundState.roundState : ""
          }
        />
      ))}
    </div>
  );
};

export default History;
