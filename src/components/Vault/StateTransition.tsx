import { useProtocolContext } from "@/context/ProtocolProvider";
import { useAccount } from "@starknet-react/core";
import { useMemo, useState, useEffect } from "react";
import useFossilStatus from "@/hooks/fossil/useFossilStatus";
import { getDurationForRound, getTargetTimestampForRound } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useRoundState } from "@/hooks/stateTransition/useRoundState";
import { getIconByRoundState } from "@/hooks/stateTransition/getIconByRoundState";
import { useRoundPermissions } from "@/hooks/stateTransition/useRoundPermissions";

const StateTransition = ({
  isPanelOpen,
  setModalState,
}: {
  isPanelOpen: boolean;
  setModalState: any;
}) => {
  const {
    vaultState,
    vaultActions,
    selectedRoundState,
    timestamp: timestampRaw,
    conn,
  } = useProtocolContext();
  const { pendingTx,lastBlock } = useTransactionContext();
  const { account } = useAccount();
  const timestamp = timestampRaw ? timestampRaw : "0";
  const {
    status: fossilStatus,
    error: fossilError,
    setStatusData: setFossilStatus,
  } = useFossilStatus();

  const [isAwaitingRoundStateUpdate, setIsAwaitingRoundStateUpdate] =
    useState(false);
  const [expectedNextState, setExpectedNextState] = useState<string | null>(
    null,
  );

  const { roundState, prevRoundState } = useRoundState({
    selectedRoundState,
    fossilStatus,
    fossilError,
    pendingTx,
    expectedNextState,
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
      if (conn !== "mock") {
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
          setExpectedNextState("Running");
        }
      }
    } else if (roundState === "Open") {
      await vaultActions.startAuction();
      setExpectedNextState("Auctioning");
    } else if (roundState === "Auctioning") {
      await vaultActions.endAuction();
      setExpectedNextState("Running");
    } else if (roundState === "Running") {
      await vaultActions.settleOptionRound();
      // Not settled because the current round being displayed will refresh
      setExpectedNextState("Open");
    }

    setIsAwaitingRoundStateUpdate(true);

    if(roundState!=="FossilReady")
    setCheck(true)
    setModalState((prev: any) => ({
      ...prev,
      show: false,
    }));
  };

  const isDisabled = useMemo(() => {
    if (!account) return true;
    if (pendingTx) return true;
    if (isAwaitingRoundStateUpdate) return true;

    if (roundState === "FossilReady" && !canSendFossilRequest) return true;
    if (roundState === "Open" && !canAuctionStart) return true;
    if (roundState === "Auctioning" && !canAuctionEnd) return true;
    if (roundState === "Running" && !canRoundSettle) return true;

    return false;
  }, [
    account,
    pendingTx,
    isAwaitingRoundStateUpdate,
    roundState,
    canSendFossilRequest,
    canAuctionStart,
    canAuctionEnd,
    canRoundSettle,
  ]);


 


  const [check,setCheck]= useState(false)
  const icon = getIconByRoundState(roundState, isDisabled||check, isPanelOpen);

  useEffect(()=>{
    setCheck(false)
  },[selectedRoundState?.roundState])
  useEffect(() => {
    if (expectedNextState && roundState === expectedNextState) {
      setIsAwaitingRoundStateUpdate(false);
      setExpectedNextState(null);
    }
  }, [roundState, expectedNextState]);

  if (!vaultState?.currentRoundId || !selectedRoundState || !vaultActions) {
    return null;
  }

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
          : "border border-transparent border-t-[#262626]"
      } flex flex-col w-full mx-auto mt-auto mb-4 ${isPanelOpen ? "" : "items-center justify-center"}`}
    >
      <div className={`${isPanelOpen ? "px-6" : ""}`}>
        <button
          disabled={isDisabled||check}
          className={`flex ${!isPanelOpen && !isDisabled ? "hover-zoom-small" : ""} ${
            roundState === "Settled" ? "hidden" : ""
          } ${isPanelOpen ? "p-2" : "w-[44px] h-[44px]"} border border-greyscale-700 text-primary disabled:text-greyscale rounded-md mt-4 justify-center items-center min-w-[44px] min-h-[44px] w-full`}
          onClick={() => {
            setModalState({
              show: true,
              action: actions[roundState],
              onConfirm: handleAction,
            });
          }}
        >
          <p className={`${isPanelOpen ? "" : "hidden"}`}>
            {prevRoundState !== roundState ? "Pending" : actions[roundState]}
          </p>
          {icon}
        </button>
      </div>
    </div>
  );
};

export default StateTransition;
