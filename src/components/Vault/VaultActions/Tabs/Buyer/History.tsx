import React, { useEffect, useMemo, useState } from "react";
import { SquarePen } from "lucide-react";
import { useExplorer, Explorer } from "@starknet-react/core";
import { formatNumber, formatNumberText } from "@/lib/utils";
import { formatUnits } from "ethers";
import { useTransactionContext } from "@/context/TransactionProvider";
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { ExclamationIcon } from "@/components/Icons";

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
          {formatNumber(
            Number(formatUnits(item.price, "ether")) * Number(item.amount),
          )}{" "}
          ETH
        </p>
      </div>
      {roundState === "Auctioning" && (
        <Hoverable
          dataId="openUpdateBidPanel"
          className="edit-button flex flex-row items-center justify-center bg-[#0D0D0D] border border-[1px] border-[#262626] p-2 rounded-lg cursor-pointer w-[40px] h-[40px]"
        >
          <button
            className="edit-button flex flex-row items-center justify-center "
            aria-label="edit bid"
            onClick={() => {
              setBidToEdit({ item });
              setIsTabsHidden(true);
            }}
          >
            <SquarePen size={20} className="text-[#E2E2E2]" stroke="#F5EBB8" />
          </button>
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
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);

  if (items.length === 0) {
    return (
      <div className="py-4 px-4 space-y-6 h-full flex flex-col justify-center items-center gap-">
        <ExclamationIcon />

        <p className="text-[#fafafa] font-regular text-[14px] text-sm">
          You have not placed any bids.
        </p>
      </div>
    );
  }

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
