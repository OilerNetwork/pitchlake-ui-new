import { useProtocolContext } from "@/context/ProtocolProvider";
import { useProvider, useAccount } from "@starknet-react/core";
import { useMemo, useState, useEffect } from "react";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { getDurationForRound, getTargetTimestampForRound } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useRoundState } from "@/hooks/stateTransition/useRoundState";
import { useIsDisabled } from "@/hooks/stateTransition/useIsDisabled";
import { getIconByRoundState } from "@/hooks/stateTransition/getIconByRoundState";
import { useRoundPermissions } from "@/hooks/stateTransition/useRoundPermissions";

const StateTransition = ({
  isPanelOpen,
  setModalState,
}: {
  isPanelOpen: boolean;
  setModalState: any;
}) => {
  const { vaultState, vaultActions, selectedRoundState,timestamp:timestampRaw,conn } = useProtocolContext();
  const { pendingTx } = useTransactionContext();
  const { account } = useAccount();
  const { provider } = useProvider();
  const timestamp = timestampRaw ? timestampRaw : "0";
  const {
    status: fossilStatus,
    error: fossilError,
    setStatusData: setFossilStatus,
  } = useFossilStatus();

  const [isAwaitingRoundStateUpdate, setIsAwaitingRoundStateUpdate] =
    useState(false);

  const { roundState, prevRoundState } = useRoundState({
    selectedRoundState,
    fossilStatus,
    fossilError,
    pendingTx,
    isAwaitingRoundStateUpdate,
  });

  const FOSSIL_DELAY = 15 * 60;

  const {
    canAuctionStart,
    canAuctionEnd,
    canRoundSettle,
    canSendFossilRequest,
  } = useRoundPermissions(
    timestamp.toString(),
    selectedRoundState,
    FOSSIL_DELAY,
  );
  

  const actions: Record<string, string> = useMemo(
    () => ({
      Open: "Start Auction",
      Auctioning: "End Auction",
      FossilReady: "Request Fossil",
      Running: "Settle Round",
      Pending: "Pending",
    }),
    [],
  );

  const handleAction = async () => {
    if (roundState === "FossilReady") {
      if(conn!=="mock"){
        
      
      const response = await fetch("/api/sendFossilRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetTimestamp: getTargetTimestampForRound(selectedRoundState),
          roundDuration: getDurationForRound(selectedRoundState),
          clientAddress: vaultState?.fossilClientAddress,
          vaultAddress: vaultState?.address,
        }),
      });

      const data = await response.json();
      console.log("Fossil response:", data);

      if (!response.ok) {
        setFossilStatus({ status: "Error", error: data.error });
      } else {
        setFossilStatus({ status: "Pending", error: undefined });
      }
    }
    } else if (roundState === "Open") {
      await vaultActions.startAuction();
    } else if (roundState === "Auctioning") {
      await vaultActions.endAuction();
    } else if (roundState === "Running") {
      await vaultActions.settleOptionRound();
    }
    setIsAwaitingRoundStateUpdate(true);

    setModalState((prev: any) => ({
      ...prev,
      show: false,
    }));
  };

  const isDisabled = useIsDisabled({
    account,
    pendingTx,
    isAwaitingRoundStateUpdate,
    roundState,
    prevRoundState,
    canSendFossilRequest,
    canAuctionStart,
    canAuctionEnd,
    canRoundSettle,
  });

  const icon = getIconByRoundState(roundState, isDisabled);

  useEffect(() => {
    if (prevRoundState !== roundState) {
      setIsAwaitingRoundStateUpdate(false);
    }
  }, [roundState, prevRoundState]);

  if (!vaultState?.currentRoundId || !selectedRoundState || !vaultActions)
   
   
   {
    console.log("FAIL HERE")
     return null;}

  if (
    roundState === "Settled" ||
    Number(vaultState.currentRoundId) !== Number(selectedRoundState.roundId)
  ) {
    return null;
  }

  return (
    <div
      className={`${
        isPanelOpen && roundState !== "Settled"
          ? "border border-transparent border-t-[#262626]"
          : ""
      } flex flex-col w-full mx-auto mt-auto mb-4`}
    >
      <div className="px-6">
        <button
          disabled={isDisabled}
          className={`${isPanelOpen ? "flex" : "hidden"} ${
            roundState === "Settled" ? "hidden" : ""
          } border border-greyscale-700 text-primary disabled:text-greyscale rounded-md mt-4 p-2 w-full justify-center items-center`}
          onClick={() => {
            setModalState({
              show: true,
              action: actions[roundState],
              onConfirm: handleAction,
            });
          }}
        >
          <p>
            {prevRoundState !== roundState ? "Pending" : actions[roundState]}
          </p>
          {icon}
        </button>
      </div>
    </div>
  );
};

export default StateTransition;
