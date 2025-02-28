import { useEffect, useRef, useState } from "react";

type wsResponseType = {
  vaultAddresses: string[];
};
const useWebsocketChart = ({
  lowerTimestamp,
  upperTimestamp,
  roundDuration,
}: {
  lowerTimestamp: number;
  upperTimestamp: number;
  roundDuration: number;
}) => {
  const ws = useRef<WebSocket | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [confirmedGasData, setConfirmedGasData] = useState<any[]>([]);
  const [unconfirmedGasData, setUnconfirmedGasData] = useState<any[]>([]);
  useEffect(() => {
    if (isLoaded) {
      ws.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}/subscribeGas`,
      );

      ws.current.onopen = () => {
        console.log("lowerTimestamp", lowerTimestamp);
        console.log("upperTimestamp", upperTimestamp);
        console.log("WebSocket connection established");
      };

      ws.current.onmessage = (event) => {
        console.log("Message from server:", event.data);
        const wsResponse: any = JSON.parse(event.data);
        console.log("Websocket response:", wsResponse);
        if(typeof wsResponse.type === "undefined"){
          console.log("REACHED HHERE GAS DATA", wsResponse);
          setConfirmedGasData(wsResponse.confirmedBlocks);
          setUnconfirmedGasData(wsResponse.unconfirmedBlocks);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket connection closed");
      };
    }
    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      ws.current?.close();
    };
  }, [isLoaded]);

  useEffect(() => {
    if(!lowerTimestamp||!upperTimestamp||!roundDuration){
      return;
    }
    ws.current?.send(
      JSON.stringify({
        startTimestamp: lowerTimestamp,
        endTimestamp: upperTimestamp,
        roundDuration: roundDuration,
      })
    );
  }, [lowerTimestamp, upperTimestamp, roundDuration]);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  console.log("confirmedGasData", confirmedGasData);
  console.log("unconfirmedGasData", unconfirmedGasData);
  return {
    confirmedGasData: confirmedGasData,
    unconfirmedGasData: unconfirmedGasData,
  };
};

export default useWebsocketChart;

