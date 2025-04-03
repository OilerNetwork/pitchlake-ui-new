import { useMemo } from "react";
import { useNewContext } from "@/context/NewProvider";
import useVaultState from "../vault_v2/states/useVaultState";
import useRoundState from "../vault_v2/states/useRoundState";

export const useProgressEstimates = () => {
  const { conn } = useNewContext();
  const vaultState = useVaultState();
  const selectedRoundState = useRoundState(vaultState?.selectedRoundAddress);

  const { txnEstimate, fossilEstimate, errorEstimate } = useMemo(() => {
    if (
      !selectedRoundState?.auctionEndDate ||
      !selectedRoundState?.optionSettleDate
    ) {
      return { txnEstimate: 0, fossilEstimate: 0, errorEstimate: 0 };
    }

    const { auctionEndDate, optionSettleDate } = selectedRoundState;
    const roundDuration = Number(optionSettleDate) - Number(auctionEndDate);

    let txnEstimate = 0;
    let fossilEstimate = 0;
    let errorEstimate = 0;

    if (conn === "demo") {
      txnEstimate = 30;
      fossilEstimate = 30;
      errorEstimate = 0;
    } else {
      txnEstimate = 90;
      errorEstimate = 30;
      // Rounds < 5 hours should settle in 15 min or less
      // Rounds > 5 hours should settle in 2 hours or less
      if (roundDuration <= 60 * 60 * 5) {
        fossilEstimate = 60 * 15;
      } else {
        fossilEstimate = 60 * 60 * 2;
      }
    }

    return { txnEstimate, fossilEstimate, errorEstimate };
  }, [
    conn,
    selectedRoundState?.auctionEndDate,
    selectedRoundState?.optionSettleDate,
  ]);

  return {
    txnEstimate,
    fossilEstimate,
    errorEstimate,
  };
};
