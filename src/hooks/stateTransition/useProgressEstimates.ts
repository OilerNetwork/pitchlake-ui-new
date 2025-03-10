import { useMemo } from "react";
import { num } from "starknet";
import { OptionRoundStateType } from "@/lib/types";
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

    let txnEstimate = 0; //90;
    let fossilEstimate = 0;
    let errorEstimate = 0;

    if (conn === "demo") {
      txnEstimate = 15;
      fossilEstimate = 15;
      errorEstimate = 5;
    } else {
      txnEstimate = 90;
      errorEstimate = 30;
      // Rounds < 15 minutes should settle in 20 min or less
      // Rounds < 5 hours should settle in 30 min or less
      // Rounds > 5 hours should settle in 2 hours or less
      if (roundDuration <= 60 * 15) {
        fossilEstimate = 60 * 20;
      } else if (roundDuration <= 60 * 60 * 5) {
        fossilEstimate = 60 * 30;
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

  //const canAuctionStart = useMemo(() => {
  //  return BigInt(timestamp) >= Number(selectedRoundState?.auctionStartDate);
  //}, [timestamp, selectedRoundState]);

  //const canAuctionEnd = useMemo(() => {
  //  return BigInt(timestamp) >= Number(selectedRoundState?.auctionEndDate);
  //}, [timestamp, selectedRoundState]);

  //const canRoundSettle = useMemo(() => {
  //  const roundSettleDate =
  //    Number(selectedRoundState?.optionSettleDate) + conn === "demo"
  //      ? 0
  //      : FOSSIL_DELAY;

  //  return BigInt(timestamp) >= roundSettleDate;
  //}, [timestamp, selectedRoundState]);

  //// will rm
  //const canSendFossilRequest = useMemo(() => {
  //  const roundSettleDate =
  //    Number(selectedRoundState?.optionSettleDate) + conn === "demo"
  //      ? 0
  //      : FOSSIL_DELAY;

  //  return BigInt(timestamp) >= roundSettleDate;
  //}, [timestamp, selectedRoundState]);

  return {
    txnEstimate,
    fossilEstimate,
    errorEstimate,
  };
};
