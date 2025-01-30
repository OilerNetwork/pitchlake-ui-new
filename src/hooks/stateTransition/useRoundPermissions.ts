import { useMemo } from "react";
import { num } from "starknet";
import { OptionRoundStateType } from "@/lib/types";

export const useRoundPermissions = (
  timestamp: number,
  selectedRoundState: OptionRoundStateType | undefined,
  FOSSIL_DELAY: number,
) => {
  const canAuctionStart = useMemo(() => {
    return BigInt(timestamp) >= Number(selectedRoundState?.auctionStartDate);
  }, [timestamp, selectedRoundState]);

  const canAuctionEnd = useMemo(() => {
    return BigInt(timestamp) >= Number(selectedRoundState?.auctionEndDate);
  }, [timestamp, selectedRoundState]);

  const canRoundSettle = useMemo(() => {
    return (
      BigInt(timestamp) >=
      Number(selectedRoundState?.optionSettleDate) + FOSSIL_DELAY
    );
  }, [timestamp, selectedRoundState]);

  // will rm
  const canSendFossilRequest = useMemo(() => {
    // account for fossil delay
    return (
      BigInt(timestamp) >=
      Number(selectedRoundState?.optionSettleDate) + FOSSIL_DELAY
    );
  }, [timestamp, selectedRoundState]);

  return {
    canAuctionStart,
    canAuctionEnd,
    canRoundSettle,
    // will rm
    canSendFossilRequest,
  };
};
