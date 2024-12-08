"use client";
import axios from "axios";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useWebSocketVault from "@/hooks/websocket/useWebSocketVault";
import useMockVault from "@/hooks/mocks/useMockVault";
import useVaultState from "@/hooks/vault/useVaultState";
import useVaultActions from "@/hooks/vault/useVaultActions";
import {
  LiquidityProviderStateType,
  OptionBuyerStateType,
  OptionRoundActionsType,
  OptionRoundStateType,
  VaultActionsType,
  VaultStateType,
} from "@/lib/types";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";
import { useBlock, useNetwork } from "@starknet-react/core";

/*This is the bridge for any transactions to go through, it's disabled by isTxDisabled if there is data loading or if
  there's a pending transaction. The data loading is enforced to ensure no transaction is done without latest data.
  Add pendingStates from any critical data here and add it in the subsequent hooks
*/
//Possible Updates:
//Make transactions accepted only after 2 confirmations

export type ProtocolContextType = {
  conn: string;
  vaultAddress?: string;
  vaultActions: VaultActionsType;
  vaultState?: VaultStateType;
  roundActions?: OptionRoundActionsType;
  optionRoundStates?: OptionRoundStateType[];
  optionBuyerStates?: OptionBuyerStateType[];
  lpState?: LiquidityProviderStateType;
  selectedRound: number;
  setSelectedRound: (roundId: number) => void;
  selectedRoundState?: OptionRoundStateType;
  selectedRoundBuyerState?: OptionBuyerStateType;
  setVaultAddress: Dispatch<SetStateAction<string | undefined>>;
  mockTimeForward: () => void;
timestamp:number;
  selectedRoundAddress: string | undefined;
  currentRoundAddress: string | undefined;
};

export const ProtocolContext = createContext<ProtocolContextType>(
  {} as ProtocolContextType,
);
const ProtocolProvider = ({ children }: { children: ReactNode }) => {
  const [vaultAddress, setVaultAddress] = useState<string | undefined>();
  const conn = process.env.NEXT_PUBLIC_ENVIRONMENT??"rpc"
  

  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [mockTimestamp, setMockTimestamp] = useState(0);
  const {data:block} = useBlock({
    refetchInterval:5000,    
  });
  const mockTimeForward = () => {
    if (conn === "mock") setMockTimestamp((prevState) => prevState + 100001);
  };

  const timestamp = useMemo(()=>{
    if(conn==="mock") return mockTimestamp
    else return block?.timestamp??0
  },[mockTimestamp,block?.timestamp])
  //Mock States
  const {
    optionRoundStates: optionRoundStatesMock,
    lpState: lpStateMock,
    vaultState: vaultStateMock,
    vaultActions: vaultActionsMock,
    optionRoundActions: roundActionsMock,
    optionBuyerStates: optionBuyerStatesMock,
  } = useMockVault(selectedRound, mockTimestamp??0,vaultAddress);

  //RPC States
  const {
    lpState: rpcLiquidityProviderState,
    vaultState: rpcVaultState,
    roundActions: roundActionsChain,
    selectedRoundState: selectedRoundStateRPC,
    selectedRoundBuyerState: selectedRoundBuyerStateRPC,
    currentRoundAddress,
  } = useVaultState({
    conn,
    address: vaultAddress,
    selectedRound,
    getRounds: true,
  });

  const vaultActionsChain = useVaultActions(vaultAddress);

  //WS States
  const {
    wsVaultState,
    wsOptionRoundStates,
    wsLiquidityProviderState,
    wsOptionBuyerStates,
  } = useWebSocketVault(conn, vaultAddress);

  //Protocol States
  const vaultState = useMemo(() => {
    if (conn === "rpc") return rpcVaultState;
    if (conn === "ws") return wsVaultState;
    return vaultStateMock;
  }, [conn, rpcVaultState, wsVaultState, vaultStateMock]);

  const lpState = useMemo(() => {
    if (conn === "rpc") return rpcLiquidityProviderState;
    if (conn === "ws") return wsLiquidityProviderState;
    return lpStateMock;
  }, [conn, rpcLiquidityProviderState, wsLiquidityProviderState, lpStateMock]);

  const optionRoundStates = useMemo(() => {
    if (conn === "mock") return optionRoundStatesMock;
    if (conn === "ws") return wsOptionRoundStates;
    return [];
  }, [conn, optionRoundStatesMock, wsOptionRoundStates]);


  const optionBuyerStates = useMemo(() => {
    if (conn === "ws") return wsOptionBuyerStates;
    if (conn === "mock") return optionBuyerStatesMock;
    return [];
  }, [conn, optionBuyerStatesMock, wsOptionBuyerStates]);

  const selectedRoundState = useMemo(() => {
    if (conn !== "rpc") {
      if (selectedRound !== 0) {
        return optionRoundStates[Number(selectedRound) - 1];
      }
      return undefined;
    } else return selectedRoundStateRPC;
  }, [
    conn,
    selectedRound,
    vaultState?.currentRoundId,
    optionRoundStates,
    selectedRoundStateRPC,
  ]);
  const selectedRoundBuyerState = useMemo(() => {
    if (conn === "rpc") return selectedRoundBuyerStateRPC;
    if (conn === "mock")
      return optionBuyerStatesMock[Number(selectedRound) - 1];
       const match = optionBuyerStates.find(state=>{
        return state.roundAddress===selectedRoundState?.address
       })
       return match
  }, [conn, selectedRoundState?.address, optionBuyerStates, selectedRoundBuyerStateRPC]);

  //Protocol actions
  const vaultActions = useMemo(() => {
    if (conn !== "mock") return vaultActionsChain;
    return vaultActionsMock;
  }, [conn, vaultActionsChain, vaultActionsMock]);

  const roundActions = useMemo(() => {
    if (conn === "mock") return roundActionsMock;
    return roundActionsChain;
  }, [conn, selectedRound, roundActionsMock, roundActionsChain]);

  const setRound = useCallback(
    (roundId: number) => {
      if (roundId < 1) return;
      if (
        vaultState?.currentRoundId &&
        BigInt(roundId) <= BigInt(vaultState?.currentRoundId)
      ) {
        setSelectedRound(roundId);
      }
    },
    [vaultState?.currentRoundId],
  );

  //Side Effects
  useEffect(() => {
    setMockTimestamp(Date.now());
  }, []);

  useEffect(() => {
    if (!vaultState) return;
    setSelectedRound(Number(vaultState.currentRoundId));
  }, [vaultState?.currentRoundId]);

  const contextValue = useMemo(
    () => ({
      conn,
      vaultAddress,
      vaultActions,
      vaultState,
      roundActions,
      optionRoundStates,
      optionBuyerStates,
      lpState,
      selectedRound,
      setSelectedRound: setRound,
      selectedRoundState,
      setVaultAddress,
      selectedRoundBuyerState,
      mockTimeForward,
      timestamp,
      selectedRoundAddress: undefined,
      currentRoundAddress,
    }),
    [
      conn,
      vaultAddress,
      vaultActions,
      vaultState,
      roundActions,
      optionRoundStates,
      optionBuyerStates,
      lpState,
      selectedRound,
      setRound,
      setVaultAddress,
      selectedRoundState,
      selectedRoundBuyerState,
      mockTimeForward,
      timestamp,
      currentRoundAddress,
    ],
  );

  return (
    <ProtocolContext.Provider value={contextValue}>
      {children}
    </ProtocolContext.Provider>
  );
};

export const useProtocolContext = () => useContext(ProtocolContext);
export default ProtocolProvider;
