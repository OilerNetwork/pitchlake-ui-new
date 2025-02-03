import useVaultStateRPC from "../rpc/useVaultStateRPC";
import { useNewContext } from "@/context/NewProvider";
import useMockVault from "../mock/useMockVault";

const useVaultState = () => {
  const { conn, selectedRound, vaultAddress, wsData } = useNewContext();


  const vaultStateRPC = useVaultStateRPC({
    conn,
    address: vaultAddress,
    selectedRound,
  });

  const { vaultState: vaultStateMock } = useMockVault({
    selectedRound,
    address: vaultAddress,
  });
  const vaultState =
    conn === "rpc"
      ? vaultStateRPC
      : conn === "ws"
      ? wsData.wsVaultState
      : vaultStateMock;

      return vaultState
  //Read States

  //States without a param
};

export default useVaultState;
