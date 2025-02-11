import { useAccount } from "@starknet-react/core";
import { useMemo, useState, useCallback, useEffect } from "react";
import { useTransactionContext } from "@/context/TransactionProvider";
import { getIconByRoundState } from "@/hooks/stateTransition/getIconByRoundState";
import Hoverable from "../BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useDemoTime } from "@/lib/demo/useDemoTime";
import { useNewContext } from "@/context/NewProvider";

// Will only be for demo in near future, cron job will take care of this otherwise
const NewStateTransition = ({
  isPanelOpen,
  setModalState,
  fossilDelay,
}: {
  isPanelOpen: boolean;
  setModalState: any;
  fossilDelay: number;
}) => {
  const { vaultState, selectedRoundAddress } = useVaultState();
  const vaultActions = useVaultActions();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const { pendingTx } = useTransactionContext();
  const { account } = useAccount();
  const { demoNow } = useDemoTime(true, true, 3_000);
  const { conn } = useNewContext();

  const [expectedNextState, setExpectedNextState] = useState<string | null>(
    null,
  );

  const {
    isDisabled,
    roundState,
  }: { isDisabled: boolean; roundState: string } = useMemo(() => {
    if (!selectedRoundState || !demoNow)
      return { isDisabled: true, roundState: "Settled" };

    if (pendingTx) return { isDisabled: true, roundState: "Pending" };

    if (
      expectedNextState &&
      expectedNextState !== selectedRoundState.roundState
    ) {
      return { isDisabled: true, roundState: "Pending" };
    }

    const { roundState, auctionStartDate, auctionEndDate, optionSettleDate } =
      selectedRoundState;

    if (!account) return { isDisabled: true, roundState };

    // Exit early if round settled
    if (roundState === "Settled") return { isDisabled: true, roundState };

    // Is now >= targetTimestamp
    const targetTimestamp =
      roundState === "Open"
        ? auctionStartDate
        : roundState === "Auctioning"
          ? auctionEndDate
          : conn !== "demo"
            ? Number(optionSettleDate) + fossilDelay
            : optionSettleDate;

    if (Number(demoNow) < Number(targetTimestamp))
      return { isDisabled: true, roundState };

    return { isDisabled: false, roundState };
  }, [account, pendingTx, selectedRoundState, demoNow, expectedNextState]);

  const handleAction = useCallback(async () => {
    if (!account || !vaultState || !selectedRoundState) return;

    if (roundState === "Open") {
      try {
        await vaultActions.startAuction();
        setExpectedNextState("Auctioning");
      } catch (error) {
        console.error(error);
        setExpectedNextState(null);
      }
    } else if (roundState === "Auctioning") {
      try {
        await vaultActions.endAuction();
        setExpectedNextState("Running");
      } catch (error) {
        console.error(error);
        setExpectedNextState(null);
      }
    } else if (roundState === "Running") {
      try {
        // Do demo fossil_client_callback
        if (conn === "demo") {
          const result = await vaultActions.demoFossilCallback({
            vaultAddress: vaultState.address,
            roundId: selectedRoundState.roundId.toString(),
            toTimestamp: selectedRoundState.optionSettleDate.toString(),
          });

          result ? setExpectedNextState("Settled") : setExpectedNextState(null);
        } // Do standard fossil request
        else {
          await vaultActions.sendFossilRequest({
            targetTimestamp: Number(selectedRoundState.optionSettleDate),
            vaultAddress: vaultState.address,
            clientAddress: vaultState.fossilClientAddress,
            roundDuration:
              Number(selectedRoundState.optionSettleDate) -
              Number(selectedRoundState.auctionEndDate),
          });
          setExpectedNextState("Settled");
        }
      } catch (error) {
        console.error(error);
        setExpectedNextState(null);
      }
    }

    setModalState((prev: any) => ({
      ...prev,
      show: false,
    }));
  }, [
    account,
    vaultState?.address,
    selectedRoundState?.auctionStartDate,
    selectedRoundState?.roundState,
    selectedRoundState?.roundId,
    selectedRoundState?.auctionEndDate,
    selectedRoundState?.optionSettleDate,
    vaultActions,
  ]);

  const actions: Record<string, string> = useMemo(
    () => ({
      Open: "Start Auction",
      Auctioning: "End Auction",
      Running: "Settle Round",
      Pending: "Pending",
    }),
    [],
  );

  const icon = getIconByRoundState(roundState, isDisabled, isPanelOpen);

  useEffect(() => {
    if (expectedNextState && roundState === expectedNextState) {
      setExpectedNextState(null);
    }
  }, [roundState, expectedNextState]);

  if (
    !vaultState ||
    !selectedRoundState ||
    !roundState ||
    roundState === "Settled"
  )
    return null;

  return (
    <div
      className={`${
        isPanelOpen && roundState !== "Settled"
          ? "border border-transparent border-t-[#262626]"
          : "border border-transparent border-t-[#262626]"
      } flex flex-col w-full mx-auto mt-auto mb-4 ${isPanelOpen ? "" : "items-center justify-center"}`}
    >
      <Hoverable dataId={`leftPanelStateTransitionButton_${roundState}`}>
        <div className={`${isPanelOpen ? "px-6" : ""}`}>
          <button
            disabled={isDisabled}
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
              {actions[roundState]}
            </p>
            {icon}
          </button>
        </div>
      </Hoverable>
    </div>
  );
};

export default NewStateTransition;
