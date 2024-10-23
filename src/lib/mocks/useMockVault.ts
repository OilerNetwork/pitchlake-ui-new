import { useAccount } from "@starknet-react/core";
import {
  DepositArgs,
  LiquidityProviderStateType,
  VaultActionsType,
  VaultStateType,
  WithdrawLiquidityArgs,
  QueueArgs,
} from "@/lib/types";
import { useState } from "react";
import useMockOptionRound from "./useMockOptionRound";
import useMockOptionRounds from "./useMockOptionRounds";

const useMockVault = (selectedRound: number, address?: string) => {
  const { address: accountAddress } = useAccount();
  //Read States
  const [vaultState, setVaultState] = useState<VaultStateType>({
    ethAddress: "0x00",
    address: address ?? "0x1",
    vaultType: "ITM",
    lockedBalance: "0",
    unlockedBalance: "123456789123456789123",
    stashedBalance: "112233445566778899",
    currentRoundId: 1,
    alpha: "5555",
    strikeLevel: "-1111",
    queuedBps: "0",
  });
  //States without a param

  //Wallet states
  const [lpState, setLPState] = useState<LiquidityProviderStateType>({
    address: accountAddress ?? "0x1",
    lockedBalance: "12800000000000000000",
    unlockedBalance: "1500000000000000000",
    stashedBalance: "123000000000000000",
    queuedBps: "1234",
  });

  const { rounds, setRounds, buyerStates,setBuyerStates, roundActions } =
    useMockOptionRounds(selectedRound);

  // Function to update a specific field in the LP state
  const currentRoundAddress = "";
  //Round Addresses and States
  const depositLiquidity = async (depositArgs: DepositArgs) => {
    // setLPState((prevState) => {
    //   return {
    //     ...prevState,
    //     unlockedBalance: (
    //       BigInt(prevState.unlockedBalance) + BigInt(depositArgs.amount)
    //     ).toString(),
    //   };
    // });
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const withdrawLiquidity = async (withdrawArgs: WithdrawLiquidityArgs) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const withdrawStash = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const queueWithdrawal = async (queueArgs: QueueArgs) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  };

  const startAuction = async () => {
    if (rounds[selectedRound - 1].roundState === "Open")
      setRounds((prevState) => {
        const newState = [...prevState];
        newState[selectedRound - 1].roundState = "Auctioning";
        return prevState;
      });
  };
  const endAuction = async () => {
    if (rounds[selectedRound - 1].roundState === "Auctioning")
      setRounds((prevState) => {
        const newState = [...prevState];
        newState[selectedRound - 1].roundState = "Running";
        return prevState;
      });
  };

  const settleOptionRound = async () => {
    if (rounds[selectedRound - 1].roundState === "Running")
      setRounds((prevState) => {
        const newState = [...prevState];
        newState[selectedRound - 1].roundState = "Settled";
        newState.push({
          roundId: BigInt(vaultState.currentRoundId) + BigInt(1),
          clearingPrice: "0",
          strikePrice: "10000000000",
          address: "0x1",
          capLevel: "2480",
          startingLiquidity: "",
          availableOptions: "",
          settlementPrice: "",
          optionsSold: "",
          roundState: "Open",
          premiums: "",
          payoutPerOption: "",
          vaultAddress: "",
          reservePrice: "2000000000",
          auctionStartDate: 200000+Number(newState[selectedRound - 1].auctionEndDate),
          auctionEndDate: 400000+Number(newState[selectedRound - 1].auctionEndDate),
          optionSettleDate: 600000+ Number(newState[selectedRound - 1].auctionEndDate),
          deploymentDate: "",
          soldLiquidity: "",
          unsoldLiquidity: "",
          optionSold: "",
          totalPayout: "",
          treeNonce: "",
          // Add other fields as necessary
        });
        return newState;
      });

    setBuyerStates((prevState) => {
      return [
        ...prevState,
        {
          address: address??"0x1",
          roundId: BigInt(vaultState.currentRoundId) + BigInt(1),
          tokenizableOptions: "",
          refundableBalance: "",
          bids: [],
        },
      ];
    });

    setVaultState((prevState) => {
      return {
        ...prevState,
        currentRoundId: BigInt(prevState.currentRoundId) + BigInt(1),
      };
    });
  };


  const vaultActions: VaultActionsType = {
    // User actions
    depositLiquidity,
    withdrawLiquidity,
    withdrawStash,
    queueWithdrawal,
    startAuction,
    endAuction,
    settleOptionRound,
  };

  return {
    vaultState,
    lpState,
    currentRoundAddress,
    vaultActions,
    optionRoundStates: rounds,
    optionRoundActions:roundActions,
    optionBuyerStates: buyerStates,
    roundActions: roundActions,
  };
};

export default useMockVault;
