import { useAccount, useContractRead } from "@starknet-react/core";
import { vaultABI } from "@/abi";
import { LiquidityProviderStateType, VaultStateType } from "@/lib/types";
import { stringToHex } from "@/lib/utils";
import { useMemo } from "react";
import useContractReads from "../../lib/useContractReads";
import useOptionRoundActions from "../optionRound/useOptionRoundActions";
import { CairoCustomEnum } from "starknet";
import useOptionRoundState from "../optionRound/useOptionRoundState";

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
  const contractData = {
    abi: vaultABI,
    address:
      "0x078c96c4238c1d0294b6cfacfbfdba1cc289e978685231284a3bd2ae00dd3f56",
  };

  const { address: accountAddress } = {
    address: "0x8ef103ecee8d069b10ccdb8658e9dbced4da8160b51c37e517510d86ea21d9",
  };
  //Read States

  //States without a param

  const { data: vaultType } = useContractRead({
    ...contractData,
    functionName: "get_vault_type",
    args: [],
    watch: true,
  });
  const { data: alpha } = useContractRead({
    ...contractData,
    functionName: "get_alpha",
    args: [],
    watch: true,
  });

  const { data: strikeLevel } = useContractRead({
    ...contractData,
    functionName: "get_strike_level",
    args: [],
    watch: true,
  });

  const { data: ethAddress } = useContractRead({
    ...contractData,
    functionName: "get_eth_address",
    args: [],
    watch: true,
  });

  const { data: currentRoundId } = useContractRead({
    ...contractData,
    functionName: "get_current_round_id",
    args: [],
    watch: true,
  });

  const { data: lockedBalance } = useContractRead({
    ...contractData,
    functionName: "get_vault_locked_balance",
    args: [],
    watch: true,
  });

  const { data: unlockedBalance } = useContractRead({
    ...contractData,
    functionName: "get_vault_unlocked_balance",
    args: [],
    watch: true,
  });

  const { data: stashedBalance } = useContractRead({
    ...contractData,
    functionName: "get_vault_stashed_balance",
    args: [],
    watch: true,
  });

  const { data: queuedBps } = useContractRead({
    ...contractData,
    functionName: "get_vault_queued_bps",
    args: [],
    watch: true,
  });

  //Wallet states
  const { data: lockedBalanceLP } = useContractRead({
    ...contractData,
    functionName: "get_account_locked_balance",
    args: [accountAddress as string],
    watch: true,
  });

  const { data: unlockedBalanceLP } = useContractRead({
    ...contractData,
    functionName: "get_account_unlocked_balance",
    args: [accountAddress as string],
    watch: true,
  });

  const { data: stashedBalanceLP } = useContractRead({
    ...contractData,
    functionName: "get_account_stashed_balance",
    args: [accountAddress as string],
    watch: true,
  });

  const { data: queuedBpsLP } = useContractRead({
    ...contractData,
    functionName: "get_account_queued_bps",
    args: [accountAddress as string],
    watch: true,
  });

  const { data: currentRoundAddress } = useContractRead({
    ...contractData,
    functionName: "get_round_address",
    args: currentRoundId ? [currentRoundId.toString()] : [],
  });
  console.log("selectedRound", selectedRound);
  const { data: selectedRoundAddress } = useContractRead({
    ...contractData,
    functionName: "get_round_address",
    args:
      selectedRound && selectedRound !== 0 ? [selectedRound.toString()] : [],
  });
  const usableString = useMemo(() => {
    if (selectedRound === 0) return "";
    return stringToHex(selectedRoundAddress?.toString());
  }, [selectedRoundAddress]);
  const { optionRoundState, optionBuyerState } =
    useOptionRoundState(usableString);

  const roundAction = useOptionRoundActions(usableString);

  const lpState = useMemo(() => {
    return {
      address: accountAddress,
      lockedBalance: lockedBalanceLP,
      unlockedBalance: unlockedBalanceLP,
      stashedBalance: stashedBalanceLP,
      queuedBps: queuedBpsLP,
    } as LiquidityProviderStateType;
  }, [lockedBalanceLP, unlockedBalanceLP, stashedBalanceLP, queuedBpsLP]);

  // Memoize the states and actions
  const selectedRoundState = useMemo(
    () => optionRoundState,
    [optionRoundState]
  );
  const selectedRoundBuyerState = useMemo(
    () => optionBuyerState,
    [optionBuyerState]
  );
  const roundActions = useMemo(() => roundAction, [roundAction]);


  console.log("VAULT STATE TEST: ", {
    address,
    vaultType,
    alpha,
    strikeLevel,
    ethAddress,
    currentRoundId,
    lockedBalance,
    unlockedBalance,
    stashedBalance,
    queuedBps,
    lpState,
    currentRoundAddress,
    roundActions,
    selectedRoundState,
    selectedRoundBuyerState,
  });

  return {
    vaultState: {
      address,
      alpha: alpha ? alpha.toString() : 0,
      strikeLevel: strikeLevel ? strikeLevel.toString() : 0,
      ethAddress: ethAddress ? stringToHex(ethAddress?.toString()) : "",
      currentRoundId: currentRoundId ? currentRoundId.toString() : 0,
      lockedBalance: lockedBalance ? lockedBalance.toString() : 0,
      unlockedBalance: unlockedBalance ? unlockedBalance.toString() : 0,
      stashedBalance: stashedBalance ? stashedBalance.toString() : 0,
      queuedBps: queuedBps ? queuedBps.toString() : 0,
      vaultType: vaultType
        ? (vaultType as CairoCustomEnum).activeVariant()
        : "",
    } as VaultStateType,
    lpState,
    currentRoundAddress,
    roundActions: getRounds ? roundActions : undefined,
    selectedRoundState,
    selectedRoundBuyerState,
  };
};

export default useVaultState;
