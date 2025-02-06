import useVaultStateRPC from "../rpc/useVaultStateRPC";
import { useNewContext } from "@/context/NewProvider";
import { useEffect, useMemo } from "react";

const useVaultState = () => {
  const {
    conn,
    selectedRound,
    setSelectedRound,
    vaultAddress,
    wsData,
    mockData,
  } = useNewContext();

  const {
    vaultState: vaultStateRPC,
    selectedRoundAddress: selectedRoundAddressRPC,
  } = useVaultStateRPC();

  console.log("R2D@");
  const vaultState = useMemo(() => {
    return conn === "rpc" || conn === "demo"
      ? vaultStateRPC
      : conn === "ws"
        ? wsData.wsVaultState
        : mockData.vaultState;
  }, [conn, vaultStateRPC, wsData.wsVaultState, mockData.vaultState]);

  console.log("selectedRoundAddressRPC", selectedRoundAddressRPC);
  const selectedRoundAddress = useMemo(() => {
    if (conn === "mock") {
      return mockData.optionRoundStates[selectedRound].address;
    }
    return selectedRoundAddressRPC;
  }, [conn, mockData.optionRoundStates, selectedRoundAddressRPC]);

  console.log("vaultState", vaultState);
  useEffect(() => {
    console.log("vaultState?.currentRoundId", vaultState?.currentRoundId);
    if (selectedRound) return;
    if (vaultState?.currentRoundId) {
      setSelectedRound(Number(vaultState?.currentRoundId));
    }
  }, [vaultState?.currentRoundId, selectedRound, setSelectedRound]);
  return {
    vaultState,
    selectedRoundAddress,
  };
  //States without a param
};

export default useVaultState;
