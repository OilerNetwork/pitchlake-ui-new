import { useNewContext } from "@/context/NewProvider";
import useOptionRoundStateRPC from "../rpc/useOptionRoundStateRPC";
import { useMemo } from "react";

const useRoundState = (address: string) => {
  const { conn, vaultAddress, wsData, mockData } =
    useNewContext();

  const roundStateRPC = useOptionRoundStateRPC(conn, vaultAddress);
  const roundStateWS = useMemo(() => {
    return wsData.wsOptionRoundStates.find(
      (round) => round.address === address
    );
  }, [wsData, address]);

  const roundState = useMemo(() => {
    if (conn === "mock") {
      return mockData.optionRoundStates.find(
        (round) => round.address === address
      );
    }
    if (conn === "rpc") {
      return roundStateRPC;
    }
    return roundStateWS;
  }, [conn, address]);

  return roundState;
};

export default useRoundState;
