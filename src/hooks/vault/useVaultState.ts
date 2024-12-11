import { useAccount, useContractRead, useNetwork } from "@starknet-react/core";
import { vaultABI } from "@/lib/abi";
import { LiquidityProviderStateType, VaultStateType } from "@/lib/types";
import { stringToHex } from "@/lib/utils";
import { useMemo } from "react";
import useContractReads from "../../lib/useContractReads";
import useOptionRoundActions from "../optionRound/useOptionRoundActions";
import useOptionRoundState from "../optionRound/useOptionRoundState";
import useTimestamps from "../optionRound/state/useTimestamps";

const useVaultState = ({
  conn,
  address,
  selectedRound,
  getRounds,
}: {
  conn: string;
  address?: string;
  selectedRound?: number | string;
  getRounds: boolean;
}) => {
  const contractData = useMemo(() => {
    return {
      abi: vaultABI,
      address: conn === "rpc" ? address : undefined,
    };
  }, [address, conn]);

  const actionsContractData = useMemo(() => {
    return {
      abi: vaultABI,
      address: address,
    };
  }, [address]);
  const { account } = useAccount();

  //Read States

  //States without a param
  const {
    alpha,
    strikeLevel,
    ethAddress,
    fossilClientAddress,
    currentRoundId,
    lockedBalance,
    unlockedBalance,
    stashedBalance,
    queuedBps,
  } = useContractReads({
    contractData,
    states: [
      //{ functionName: "get_vault_type", key: "vaultType" }, // will rm
      {
        functionName: "get_alpha",
        key: "alpha",
      },
      {
        functionName: "get_strike_level",
        key: "strikeLevel",
      },
      { functionName: "get_eth_address", key: "ethAddress" },
      { functionName: "get_fossil_client_address", key: "fossilClientAddress" },
      // fossil client address
      {
        functionName: "get_current_round_id",
        key: "currentRoundId",
      },
      // round addresses ?
      {
        functionName: "get_vault_locked_balance",
        key: "lockedBalance",
      },
      {
        functionName: "get_vault_unlocked_balance",
        key: "unlockedBalance",
      },
      {
        functionName: "get_vault_stashed_balance",
        key: "stashedBalance",
      },
      { functionName: "get_vault_queued_bps", key: "queuedBps" },
    ],
    watch: true,
  });

  //Wallet states
  const lpState = useContractReads({
    contractData,
    states: [
      {
        functionName: "get_account_locked_balance",
        args: [account?.address as string],
        key: "lockedBalance",
      },
      {
        functionName: "get_account_unlocked_balance",
        args: [account?.address as string],
        key: "unlockedBalance",
      },
      {
        functionName: "get_account_stashed_balance",
        args: [account?.address as string],
        key: "stashedBalance",
      },
      {
        functionName: "get_account_queued_bps",
        args: [account?.address as string],
        key: "queuedBps",
      },
    ],
    watch: true,
  }) as unknown as LiquidityProviderStateType;

  const { data: round1Address } = useContractRead({
    ...contractData,
    functionName: "get_round_address",
    args: [1],
    watch: false,
  });

  const { deploymentDate } = useTimestamps(
    stringToHex(round1Address ? round1Address.toString() : ""),
  );

  const { data: currentRoundAddress } = useContractRead({
    ...contractData,
    functionName: "get_round_address",
    args: currentRoundId ? [currentRoundId.toString()] : [],
    watch: true,
  });

  const { data: selectedRoundAddress } = useContractRead({
    ...actionsContractData,
    functionName: "get_round_address",
    args:
      selectedRound && selectedRound !== 0
        ? [selectedRound.toString()]
        : undefined,
    watch: true,
  });

  const usableString = useMemo(() => {
    return stringToHex(selectedRoundAddress?.toString());
  }, [selectedRoundAddress]);
  const {
    optionRoundState: selectedRoundState,
    optionBuyerState: selectedRoundBuyerState,
  } = useOptionRoundState(usableString);
  const roundActions = useOptionRoundActions(usableString);

  const k = strikeLevel ? Number(strikeLevel.toString()) : 0;
  const vaultType = k > 0 ? "OTM" : k == 0 ? "ATM" : "ITM";

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
      deploymentDate,
    } as VaultStateType,
    lpState,
    currentRoundAddress: currentRoundAddress
      ? stringToHex(currentRoundAddress?.toString())
      : "",
    roundActions: getRounds ? roundActions : undefined,
    selectedRoundState,
    selectedRoundBuyerState,
  };
};

export default useVaultState;
