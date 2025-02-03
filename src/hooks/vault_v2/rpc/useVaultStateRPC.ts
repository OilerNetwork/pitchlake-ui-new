import { useAccount, useContractRead } from "@starknet-react/core";
import { optionRoundABI, vaultABI } from "@/lib/abi";
import { VaultStateType } from "@/lib/types";
import { stringToHex } from "@/lib/utils";
import { useMemo } from "react";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";
import { useNewContext } from "@/context/NewProvider";
import { BlockTag } from "starknet";
const useVaultStateRPC = () => {
  const { conn, vaultAddress:address, selectedRound } = useNewContext()
  const contractData = useMemo(() => {
    console.log("RENRENCONDAT")
    return {
      abi: vaultABI,
      address: conn === "rpc" ? (address as `0x${string}`) : undefined,
    };
  }, [address, conn]);


  console.log("RENRENCONVAUHOO")
  //Read States

  //States without a param
  
  const {data:alpha}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_alpha",
    args:[],
    watch: true,
    
  })
  const {data:strikeLevel}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_strike_level",
    args:[],
    watch: true,
    
  })
  const {data:ethAddress}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_eth_address",
    args:[],
    watch: true,
    
  })      
  const {data:fossilClientAddress}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_fossil_client_address",
    args:[],
    watch: true,
    
  })  
  const {data:currentRoundId}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_current_round_id",
    args:[],
    watch: true,
    
  })
  const {data:lockedBalance}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_vault_locked_balance",
    args:[],
    watch: true,
    
  })
  const {data:unlockedBalance}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_vault_unlocked_balance",
    args:[],
    watch: true,
    
  })
  const {data:stashedBalance}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_vault_stashed_balance",
    args:[],
    watch: true,
    
  })
  const {data:queuedBps}= useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_vault_queued_bps",
    args:[],
    watch: true,
    
  })

  const { data: round1Address } = useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_round_address",
    args: [1],
    watch: false,
  });

  const { data: deploymentDate } = useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    abi: optionRoundABI,
    functionName: "get_deployment_date",
    args: [],
    watch: true,
    
  });

  const { data: selectedRoundAddress } = useContractRead({
    ...contractData,
blockIdentifier:BlockTag.PENDING,
    functionName: "get_round_address",
    args:
      selectedRound && selectedRound !== 0
        ? [Number(selectedRound.toString())]
        : undefined,
    watch: true,
  });

  const usableString = useMemo(() => {
    return stringToHex(selectedRoundAddress?.toString());
  }, [selectedRoundAddress]);

  const k = useMemo(() => strikeLevel ? Number(strikeLevel.toString()) : 0, [strikeLevel]);
  const vaultType = useMemo(() => k > 0 ? "OTM" : k == 0 ? "ATM" : "ITM", [k]);

  return {
    vaultState: {
      address,
      alpha: alpha ? alpha.toString() : 0,
      strikeLevel: strikeLevel ? strikeLevel.toString() : 0,
      ethAddress: ethAddress ? stringToHex(ethAddress?.toString()) : "",
      fossilClientAddress: fossilClientAddress
        ? stringToHex(fossilClientAddress.toString())
        : "",
      currentRoundId: currentRoundId ? currentRoundId.toString() : 0,
      lockedBalance: lockedBalance ? lockedBalance.toString() : 0,
      unlockedBalance: unlockedBalance ? unlockedBalance.toString() : 0,
      stashedBalance: stashedBalance ? stashedBalance.toString() : 0,
      queuedBps: queuedBps ? queuedBps.toString() : 0,
      vaultType,
      deploymentDate: deploymentDate ? deploymentDate.toString() : 0,
      currentRoundAddress: usableString,
    } as VaultStateType,
    selectedRoundAddress:usableString,
  };
};

export default useVaultStateRPC;
