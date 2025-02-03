"use client";
import useMockVault from "@/hooks/mocks/useMockVault";
import useWebSocketVault from "@/hooks/vault_v2/websocket/useWebSocketVault";
import { LiquidityProviderStateType, OptionBuyerStateType, OptionRoundStateType, VaultStateType } from "@/lib/types";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";

/*This is the bridge for any transactions to go through, it's disabled by isTxDisabled if there is data loading or if
  there's a pending transaction. The data loading is enforced to ensure no transaction is done without latest data.
  Add pendingStates from any critical data here and add it in the subsequent hooks
*/
//Possible Updates:
//Make transactions accepted only after 2 confirmations

export type NewContextType = {
  conn: string;
  vaultAddress?: string;
  selectedRound: number;
  setSelectedRound: (roundId: number) => void;
  setVaultAddress: Dispatch<SetStateAction<string | undefined>>;
  wsData: {
    wsVaultState: VaultStateType | undefined;
    wsOptionRoundStates: OptionRoundStateType[];
    wsLiquidityProviderState: LiquidityProviderStateType | undefined;
    wsOptionBuyerStates: OptionBuyerStateType[];
}
};

export const NewContext = createContext<NewContextType>(
  {} as NewContextType,
);
const NewContextProvider = ({ children }: { children: ReactNode }) => {
  const [vaultAddress, setVaultAddress] = useState<string | undefined>();
  const conn = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "rpc";

  const [selectedRound, setSelectedRound] = useState<number>(0);

  const wsData=useWebSocketVault(conn,vaultAddress)
  //Mock States


//   const setRound = useCallback(
//     (roundId: number) => {
//       if (roundId < 1) return;
//       if (
//         vaultState?.currentRoundId &&
//         BigInt(roundId) <= BigInt(vaultState?.currentRoundId)
//       ) {
//         setSelectedRound(roundId);
//       }
//     },
//     [vaultState?.currentRoundId],
//   );

  //Side Effects


  const contextValue = {
    conn,
    vaultAddress,
    setVaultAddress,
    selectedRound,
    setSelectedRound, //: setRound,
    wsData,
  };

  return (
    <NewContext.Provider value={contextValue}>
      {children}
    </NewContext.Provider>
  );
};

export const useNewContext = () => useContext(NewContext);
export default NewContextProvider;
