import { useMemo, useRef, useEffect } from "react";
import { OptionRoundStateType } from "@/lib/types";
import { StatusData } from "@/hooks/fossil/useFossilStatus";

const getRoundState = ({
  selectedRoundState,
  fossilStatus,
  fossilError,
  isPendingTx,
  expectedNextState,
}: {
  selectedRoundState: OptionRoundStateType | undefined;
  fossilStatus: StatusData | null;
  fossilError: string | null;
  isPendingTx: boolean;
  expectedNextState: string | null;
}): string => {
  let currentState = "Pending";
  if (isPendingTx || fossilStatus?.status === "Pending")
    currentState = "Pending";
  else if (!selectedRoundState) currentState = "Settled";
  else {
    currentState = selectedRoundState?.roundState.toString();

    // Is the contract's state the expected next state?
    if (
      currentState === "Open" ||
      currentState === "Auctioning" ||
      currentState === "Settled"
    ) {
      if (expectedNextState && currentState !== expectedNextState)
        currentState = "Pending";
    } else if (currentState === "Running") {
      if (fossilStatus?.status === "Completed") currentState = "Running";
      if (
        fossilError ||
        fossilStatus === null ||
        fossilStatus.status === "Failed"
      )
        currentState = "FossilReady";
    } else {
    }
  }

  return currentState;
};

export const useRoundState = ({
  selectedRoundState,
  fossilStatus,
  fossilError,
  pendingTx,
  expectedNextState,
}: {
  selectedRoundState: OptionRoundStateType | undefined;
  fossilStatus: StatusData | null;
  fossilError: string | null;
  pendingTx: string | undefined;
  expectedNextState: string | null;
}) => {
  const roundState = useMemo(() => {
    return getRoundState({
      selectedRoundState,
      fossilStatus,
      fossilError,
      isPendingTx: pendingTx ? true : false,
      expectedNextState,
    });
  }, [
    selectedRoundState,
    fossilStatus,
    fossilError,
    pendingTx,
    expectedNextState,
  ]);

  // Previous roundState to detect changes
  const prevRoundStateRef = useRef(roundState);

  useEffect(() => {
    prevRoundStateRef.current = roundState;
  }, [roundState]);

  return { roundState, prevRoundState: prevRoundStateRef.current };
};
