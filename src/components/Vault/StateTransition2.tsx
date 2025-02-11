import { useAccount } from "@starknet-react/core";
import { useMemo, useState, useCallback } from "react";
import { useTransactionContext } from "@/context/TransactionProvider";
import { getIconByRoundState } from "@/hooks/stateTransition/getIconByRoundState";
import Hoverable from "../BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultActions from "@/hooks/vault_v2/actions/useVaultActions";
import { useDemoTime } from "@/lib/demo/useDemoTime";
import { DemoFossilCallParams } from "@/app/api/sendMockFossilCallback/route";

// Will only be for demo in near future, cron job will take care of this otherwise
const StateTransition2 = ({
  isPanelOpen,
  setModalState,
}: {
  isPanelOpen: boolean;
  setModalState: any;
}) => {
  const { vaultState, selectedRoundAddress } = useVaultState();
  const vaultActions = useVaultActions();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const { pendingTx } = useTransactionContext();
  const { account } = useAccount();
  const demoNow = useDemoTime(true, true, 3_000);

  const {
    isDisabled,
    roundState,
  }: { isDisabled: boolean; roundState: string } = useMemo(() => {
    if (!account || pendingTx || !selectedRoundState || !demoNow)
      return { isDisabled: true, roundState: "Settled" };

    const { roundState, auctionStartDate, auctionEndDate, optionSettleDate } =
      selectedRoundState;

    // Exit early if round settled
    if (roundState === "Settled") return { isDisabled: true, roundState };

    // Is now >= targetTimestamp
    const targetTimestamp =
      roundState === "Open"
        ? auctionStartDate
        : roundState === "Auctioning"
          ? auctionEndDate
          : optionSettleDate;

    if (Number(demoNow) < Number(targetTimestamp))
      return { isDisabled: true, roundState };

    return { isDisabled: false, roundState };
  }, [account, pendingTx, selectedRoundState, demoNow]);

  const handleAction = useCallback(async () => {
    if (!account || !vaultState || !selectedRoundState) return;

    if (roundState === "Open") {
      await vaultActions.startAuction();
    } else if (roundState === "Auctioning") {
      await vaultActions.endAuction();
    } else if (roundState === "Running") {
      const vaultAddress = vaultState.address;

      const body: DemoFossilCallParams = {
        vaultAddress,
        roundId: selectedRoundState.roundId.toString(),
        toTimestamp: selectedRoundState.optionSettleDate.toString(),
      };

      try {
        const response = await fetch("/api/sendMockFossilCallback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          alert("Txn failed to send, try again in a couple seconds");
          throw new Error(
            `Failed to send mocked Fossil request from client side: ${response.status}`,
          );
        } else {
          const resp = await response.json();
          alert("Txn sent: " + resp.tx_hash);
        }
      } catch (error) {
        console.error(
          "Failed to send mocked Fossil request from client side",
          error,
        );
      }

      //      await vaultActions.settleOptionRound();
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

  const [isAwaitingRoundStateUpdate, setIsAwaitingRoundStateUpdate] =
    useState(false);
  const [expectedNextState, setExpectedNextState] = useState<string | null>(
    null,
  );

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

  // Show nothing
  if (!vaultState || !selectedRoundState || roundState === "Settled")
    return null;
  if (Number(vaultState.currentRoundId) !== Number(selectedRoundState.roundId))
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
              {pendingTx ? "Pending" : actions[roundState]}
            </p>
            {icon}
          </button>
        </div>
      </Hoverable>
    </div>
  );
};

export default StateTransition2;
