import { OptionRoundStateType, VaultStateType } from "@/lib/types";
import Countdown from "./Countdown";
import ProgressBar from "./ProgressBar";
import ManualButtons from "./ManualButtons";
import { useProgressEstimates } from "@/hooks/stateTransition/useProgressEstimates";
import { useDemoTime } from "@/lib/demo/useDemoTime";

type StateTransitionProps = {
  vaultState: VaultStateType | undefined;
  selectedRoundState: OptionRoundStateType | undefined;
  isPanelOpen: boolean;
  setModalState?: any;
};

type StateTransitionComponentType =
  | "Countdown"
  | "ProgressBar"
  | "ManualButtons";

const StateTransition = ({
  vaultState,
  selectedRoundState,
  isPanelOpen,
  setModalState,
}: StateTransitionProps) => {
  const { demoNow: now } = useDemoTime(true, true, 1000);
  const { txnEstimate, fossilEstimate, errorEstimate } = useProgressEstimates();

  if (!vaultState) return null;
  if (!selectedRoundState) return null;

  const { roundState, targetTimestamp } =
    getRoundStateAndTargetDate(selectedRoundState);

  const timeEstimate =
    roundState === "Open" || roundState === "Auctioning"
      ? txnEstimate
      : fossilEstimate;

  const componentType = (): StateTransitionComponentType => {
    const _now = Number(now);
    const _target = Number(targetTimestamp);

    if (roundState === "Settled" || _now < _target) return "Countdown";
    else if (
      roundState !== "Settled" &&
      _now < _target + txnEstimate + errorEstimate
    )
      return "ProgressBar";
    else return "ManualButtons";
  };

  if (
    !isPanelOpen &&
    (componentType() === "Countdown" || componentType() === "ProgressBar")
  )
    return null;
  else
    return (
      <div className="w-full border border-transparent border-t-[#262626] p-4">
        {componentType() === "Countdown" ? (
          <Countdown
            roundState={roundState}
            now={now}
            targetTimestamp={Number(targetTimestamp)}
            isPanelOpen={isPanelOpen}
          />
        ) : componentType() === "ProgressBar" ? (
          <ProgressBar
            roundState={roundState}
            now={now}
            progressStart={Number(targetTimestamp)}
            timeEstimate={timeEstimate}
            isPanelOpen={isPanelOpen}
          />
        ) : (
          <ManualButtons
            isPanelOpen={isPanelOpen}
            setModalState={setModalState}
          />
        )}
      </div>
    );
};

const getRoundStateAndTargetDate = (
  round: OptionRoundStateType,
): { roundState: string; targetTimestamp: string } => {
  const { roundState, auctionStartDate, auctionEndDate, optionSettleDate } =
    round;

  if (roundState === "Open")
    return { roundState, targetTimestamp: auctionStartDate.toString() };
  else if (roundState === "Auctioning")
    return { roundState, targetTimestamp: auctionEndDate.toString() };
  else return { roundState, targetTimestamp: optionSettleDate.toString() };
};

export default StateTransition;
