import { useNewContext } from "@/context/NewProvider";
import { useMemo } from "react";
import useLPStateRPC from "../rpc/useLPStateRPC";

const useLPState = () => {
  const { conn, wsData, mockData, vaultAddress } = useNewContext();
  const lpStateRPC = useLPStateRPC({
    vaultAddress:
      conn === "rpc" || conn === "demo"
        ? (vaultAddress as `0x${string}`)
        : undefined,
  });
  const lpStateWS = wsData.wsLiquidityProviderState;
  const lpStateMock = mockData.lpState;

  console.log("lpStateRPC", lpStateRPC);
  console.log("lpStateWS", lpStateWS);
  console.log("lpStateMock", lpStateMock);
  const lpState =
    conn === "mock"
      ? lpStateMock
      : conn === "rpc" || conn === "demo"
      ? lpStateRPC
      : lpStateWS;
  console.log("lpStateFull", lpState);
  return lpState;
};

export default useLPState;
