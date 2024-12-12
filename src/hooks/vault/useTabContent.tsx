import React, { useMemo } from "react";
import {
  VaultUserRole,
  RoundState,
  ProviderTabs,
  BuyerTabs,
  CommonTabs,
  VaultStateType,
  LiquidityProviderStateType,
  VaultActionsType,
  OptionRoundActionsType,
  OptionRoundStateType,
} from "@/lib/types";
import DepositContent from "@/components/Vault/VaultActions/Tabs/Provider/Deposit";
import Withdraw from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/Withdraw";
import PlaceBid from "@/components/Vault/VaultActions/Tabs/Buyer/PlaceBid";
import Mint from "@/components/Vault/VaultActions/Tabs/Buyer/Mint";
import History from "@/components/Vault/VaultActions/Tabs/Buyer/History";
import Exercise from "@/components/Vault/VaultActions/Tabs/Buyer/Exercise";
import Refund from "@/components/Vault/VaultActions/Tabs/Buyer/Refund";
import MyInfo from "@/components/Vault/VaultActions/Tabs/Provider/MyInfo";
import { useTransactionContext } from "@/context/TransactionProvider";

export const useTabContent = (
  userType: string,
  activeTab: string,
  selectedRoundState: OptionRoundStateType | undefined,
  isTabsHidden: boolean,
  bidToEdit: any,
  userBids: any,
  setIsTabsHidden: (open: boolean) => void,
  setBidToEdit: (bid: any) => void,
) => {
  const { pendingTx } = useTransactionContext();
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT;

  // @NOTE: For now we are hiding this panel, eventually we need to show it in WS mode and possibly RPC mode as well
  //const commonTabs = env === "ws" || env === "rpc" ? [] : [CommonTabs.MyInfo];
  const commonTabs: any = [];
  const tabs = useMemo(() => {
    if (userType === "lp") {
      return [...Object.values(ProviderTabs), ...commonTabs];
    } else {
      switch (selectedRoundState?.roundState) {
        case "Open":
          return [];
        case "Auctioning":
          return [BuyerTabs.PlaceBid, BuyerTabs.History, ...commonTabs];
        case "Running":
          return [
            BuyerTabs.Mint,
            BuyerTabs.Refund,
            BuyerTabs.History,
            ...commonTabs,
          ];
        case "Settled":
          return [
            BuyerTabs.Exercise,
            BuyerTabs.Refund,
            BuyerTabs.History,
            ...commonTabs,
          ];
        default:
          return [];
      }
    }
  }, [userType, selectedRoundState?.roundState]);

  const tabContent = useMemo(() => {
    switch (activeTab) {
      case ProviderTabs.Deposit:
        return <DepositContent showConfirmation={(amount, action) => {}} />;
      case ProviderTabs.Withdraw:
        return <Withdraw showConfirmation={(amount, action) => {}} />;
      case BuyerTabs.PlaceBid:
        return <PlaceBid showConfirmation={(amount, action) => {}} />;
      case BuyerTabs.History:
        return (
          <History
            items={userBids}
            bidToEdit={bidToEdit}
            isTabsHidden={isTabsHidden}
            setIsTabsHidden={setIsTabsHidden}
            setBidToEdit={setBidToEdit}
          />
        );
      case BuyerTabs.Refund:
        return <Refund showConfirmation={(amount, action) => {}} />;
      case BuyerTabs.Mint:
        return <Mint showConfirmation={(amount, action) => {}} />;
      case BuyerTabs.Exercise:
        return <Exercise showConfirmation={(amount, action) => {}} />;
      case CommonTabs.MyInfo:
        return <MyInfo />;
      default:
        if (userType === "ob") {
        } else if (userType === "lp") {
          return <DepositContent showConfirmation={(amount, action) => {}} />;
        }
    }
  }, [
    userType,
    activeTab,
    selectedRoundState?.roundState,
    pendingTx,
    userBids,
  ]);

  return { tabs, tabContent };
};
