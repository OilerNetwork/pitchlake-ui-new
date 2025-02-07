import { useNewContext } from "@/context/NewProvider";
import { useMemo } from "react";
import useLPStateRPC from "../rpc/useLPStateRPC";

const useLPState = () => {
  const { conn, wsData, mockData } = useNewContext();
  const lpStateRPC = useLPStateRPC();
  const lpStateWS = wsData.wsLiquidityProviderState;
  const lpStateMock = mockData.lpState;

  const lpState = useMemo(() => {
    if (conn === "mock") {
      return lpStateMock;
    }
    if (conn === "rpc" || conn === "demo") {
      return lpStateRPC;
    }
    return lpStateWS;
  }, [conn]);

  return lpState;
};

export default useLPState;

