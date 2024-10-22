import { useContractRead, UseContractReadProps } from "@starknet-react/core";
import { stat } from "fs";
import { useMemo } from "react";
import { Abi, Result } from "starknet";

const useContractReads = ({
  contractData,
  states,
  watch,
}: {
  contractData: { abi?: Abi; address?: string };
  watch?: boolean;
  states: Array<{ functionName: string; args?: Array<any>; key: string }>;
}) => {
  // Create an object to store results
  const results: { [key: string]: Result | undefined } = {};

  // Iterate over the states array and call useContractRead for each state
  states.forEach((state) => {
    const { data } = useContractRead({
      ...contractData,
      functionName: state.functionName,
      args: state.args ?? [], // Default to an empty array if no args are provided
      watch,
    });

    // Store the data using the state's key
    if (state.key) {
      results[state.key] = data;
    }
  });

  // Use useMemo to memoize the result, but exclude the hook call itself
  return useMemo(() => {
    return { ...results };
  }, [states, contractData, watch]);
};


export default useContractReads;
