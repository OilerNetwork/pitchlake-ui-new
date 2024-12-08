import { useEffect, useRef, useState } from "react";
import {
  VaultStateType,
  OptionRoundStateType,
  LiquidityProviderStateType,
  OptionBuyerStateType,
} from "@/lib/types";
import { useAccount } from "@starknet-react/core";
import { getPerformanceLP, getPerformanceOB } from "@/lib/utils";

type wsResponseType = {
  payloadType: string;
  liquidityProviderState?: LiquidityProviderStateType;
  optionBuyerStates?: OptionBuyerStateType[];
  vaultState: VaultStateType;
  optionRoundStates?: OptionRoundStateType[];
};

const useWebSocketVault = (conn: string, vaultAddress?: string) => {
  const [wsVaultState, setWsVaultState] = useState<
    VaultStateType | undefined
  >();
  const [wsOptionRoundStates, setWsOptionRoundStates] = useState<
    OptionRoundStateType[]
  >([]);
  const [wsLiquidityProviderState, setWsLiquidityProviderState] = useState<
    LiquidityProviderStateType | undefined
  >();
  const [wsOptionBuyerStates, setWsOptionBuyerStates] = useState<
    OptionBuyerStateType[] | null
  >(null);
  const ws = useRef<WebSocket | null>(null);
const {address:accountAddress} = useAccount()
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (conn === "ws" && isLoaded && vaultAddress) {
      ws.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}/subscribeVault`
      );

      ws.current.onopen = () => {
        console.log("WebSocket connection established");
        ws.current?.send(
          JSON.stringify({
            address: accountAddress,
            userType: "ob", // Adjust based on your logic
            vaultAddress: vaultAddress,
          })
        );
      };

      ws.current.onmessage = (event: MessageEvent) => {
        const wsResponse: wsResponseType = JSON.parse(event.data);
        if (wsResponse.payloadType === "initial") {
          setWsVaultState(wsResponse.vaultState);
          const roundStates = wsResponse.optionRoundStates?.map((state) => {
            return {
              ...state,
              performanceLP: getPerformanceLP(
                state.soldLiquidity,
                state.premiums,
                state.totalPayout
              ),
              performanceOB: getPerformanceOB(
                state.premiums,
                state.totalPayout
              ),
            } as OptionRoundStateType;
          });
          setWsOptionRoundStates(roundStates ?? []);
          setWsLiquidityProviderState(wsResponse.liquidityProviderState?.address?wsResponse.liquidityProviderState:undefined);
          setWsOptionBuyerStates(wsResponse.optionBuyerStates ?? []);
        } else if (wsResponse.payloadType === "account_update") {
          if (wsResponse.liquidityProviderState?.address)
            setWsLiquidityProviderState(wsResponse.liquidityProviderState);
          else {
            setWsLiquidityProviderState(undefined)
          }
          if (wsResponse.optionBuyerStates?.length)
            setWsOptionBuyerStates(wsResponse.optionBuyerStates);
          else {
            setWsOptionBuyerStates([])
          }
        } else if (
          wsResponse.payloadType === "lp_update" &&
          wsResponse.liquidityProviderState
        ) {
          setWsLiquidityProviderState(wsResponse.liquidityProviderState);
        } else if (
          wsResponse.payloadType === "or_update" &&
          wsResponse.optionRoundStates
        ) {
          setWsOptionRoundStates((prevStates) => {
            const newStates = [...prevStates];
            if (
              wsResponse.optionRoundStates &&
              wsResponse.optionRoundStates.length > 0
            ) {
              const updatedRound = wsResponse.optionRoundStates[0];
              const updatedRoundIndex = Number(updatedRound.roundId) - 1;
              newStates[updatedRoundIndex] = updatedRound;
            }
            return newStates;
          });
        } else if (
          wsResponse.payloadType === "ob_update" &&
          wsResponse.optionBuyerStates
        ) {
          setWsOptionBuyerStates(wsResponse.optionBuyerStates);
        } else if (
          wsResponse.payloadType === "vault_update" &&
          wsResponse.vaultState
        ) {
          setWsVaultState(wsResponse.vaultState);
        }
      };

      ws.current.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    } else {
      ws.current = null;
    }

    return () => {
      ws.current?.close();
    };
  }, [conn, isLoaded,vaultAddress]);

  useEffect(() => {
    if(ws.current?.readyState===1)
    try {
      ws.current?.send(
        JSON.stringify({
          updatedField: "address",
          updatedValue: accountAddress,
        })
      );
    } catch (err) {
      console.log(err);
    }
  }, [accountAddress]);

  return {
    wsVaultState,
    wsOptionRoundStates,
    wsLiquidityProviderState,
    wsOptionBuyerStates: wsOptionBuyerStates ?? [],
  };
};

export default useWebSocketVault;
