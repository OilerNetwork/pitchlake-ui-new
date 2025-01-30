import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { FormattedBlockData } from "@/app/api/getFossilGasData/route";

// Define the hook parameters
interface UseGasDataParams {
  lowerTimestamp: number;
  upperTimestamp: number;
  blocksToFetch: number;
}

// Define the API response type
type GetGasDataResponse = FormattedBlockData[];

// Define the fetch function
const fetchGasData = async (
  fromTimestamp: number,
  toTimestamp: number,
  blocksToFetch: number,
): Promise<GetGasDataResponse> => {
  const response = await axios.get("/api/getFossilGasData", {
    params: {
      from_timestamp: fromTimestamp,
      to_timestamp: toTimestamp,
      blocks_to_fetch: blocksToFetch,

      // You can add maxReturnBlocks and twapBlockLimit as query params if your API supports them
    },
  });
  return response.data;
};

export const useFossilGasData = ({
  lowerTimestamp,
  upperTimestamp,
  blocksToFetch,
}: UseGasDataParams): {
  gasData: FormattedBlockData[];
  isLoading: boolean;
  isError: boolean;
  error: any;
} => {
  // Define a unique query key based on parameters
  const step = parseInt((new Date().getTime() / (30 * 1000)).toString());
  const queryKey = [
    "gasData",
    lowerTimestamp,
    upperTimestamp,
    blocksToFetch,
    step,
  ];

  // Use React Query's useQuery
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchGasData(lowerTimestamp, upperTimestamp, blocksToFetch),
    //refetchInterval: 30 * 1000,
    enabled:
      typeof lowerTimestamp === "number" &&
      typeof upperTimestamp === "number" &&
      typeof blocksToFetch === "number" &&
      lowerTimestamp > 0 &&
      upperTimestamp > 0 &&
      blocksToFetch > 0,
    placeholderData: (prev) => prev,
  });

  return {
    gasData: data ? data : [],
    isLoading,
    isError,
    error,
  };
};
