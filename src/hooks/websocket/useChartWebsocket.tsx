import { useEffect, useRef, useState } from "react";

// Add type definitions
interface Block {
  timestamp: number;
  blockNumber?: number;
  baseFee?: number;
  twap?: number;
}

type wsResponseType = {
  vaultAddresses: string[];
  type?: string;
  confirmedBlocks?: Block[];
  unconfirmedBlocks?: Block[];
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

  const [confirmedGasData, setConfirmedGasData] = useState<Block[]>([]);
  const [unconfirmedGasData, setUnconfirmedGasData] = useState<Block[]>([]);

  useEffect(() => {
    if (isLoaded) {
      ws.current = new WebSocket(
        `${process.env.NEXT_PUBLIC_WS_URL}/subscribeGas`
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
        if (typeof wsResponse.type === "undefined") {
          setConfirmedGasData(wsResponse.confirmedBlocks);
          setUnconfirmedGasData(wsResponse.unconfirmedBlocks);
        } else if (wsResponse.type === "confirmedBlocks") {
          
          const data = wsResponse.blocks as Block[]
          console.log("HERERERERE",wsResponse.blocks,data,lowerTimestamp,upperTimestamp)
          const usableData = data.filter((block: Block) => {
            return block.timestamp >= lowerTimestamp && block.timestamp <= upperTimestamp
          })
          // Update only blocks within the timestamp range
          setConfirmedGasData((prevData) => {
            // Create a map of existing blocks by blockNumber for quick lookup
            if (!prevData || prevData.length === 0) {
              return usableData;
            }
            const newArray = [...prevData, ...usableData].sort(
              (a, b) => a.timestamp - b.timestamp
            );
            console.log("newArray",newArray)
            return newArray;
          });
          //Remove the confirmed blocks from the unconfirmed blocks
          setUnconfirmedGasData((prevData) => {
            //filter the unconfirmed blocks that are in the usableData, match by blockNumber
            return prevData.filter(
              (block) => !usableData.some((usableBlock:any) => usableBlock.blockNumber === block.blockNumber)
            ).sort((a, b) => a.timestamp - b.timestamp);
          });
        } else if (wsResponse.type === "unconfirmedBlocks") {
          console.log("HERERERERE",wsResponse.blocks)
          setUnconfirmedGasData((prevData) => {
            if (!prevData || prevData.length === 0) {
              return wsResponse.blocks || [];
            }
            const newArray = [...prevData, ...wsResponse.blocks].sort(
              (a, b) => a.timestamp - b.timestamp
            );
            return newArray;
          });
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
    if (!lowerTimestamp || !upperTimestamp || !roundDuration) {
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
