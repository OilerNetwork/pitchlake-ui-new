import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FormattedBlockData } from "@/app/api/getFossilGasData/route";

// Define the fetch function
const fetchFeeHistory = async (): Promise<FormattedBlockData[]> => {
  const response = await axios.post("/api/getUnconfirmedBlocks");
  return response.data;
};

export const useUnconfirmedBlocks = (
  xMin: number,
  xMax: number,
): {
  feeHistory: FormattedBlockData[];
  isLoading: boolean;
  isError: boolean;
  error: any;
} => {
  // Fefetch data every 15 seconds
  const now = new Date();
  const queryKey = [
    `${xMin}-${xMax}`,
    parseInt((now.getTime() / 15000).toString()),
  ];

  // Use React Query's useQuery
  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () => fetchFeeHistory(),
    enabled: xMin != 0 || xMax != 0,
  });

  const feeHistory: FormattedBlockData[] = data ? data : [];

  return {
    feeHistory,
    isLoading,
    isError,
    error,
  };
};
