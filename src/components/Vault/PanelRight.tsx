import React, { ReactNode, useState, useEffect, ReactElement } from "react";
import Tabs from "./VaultActions/Tabs/Tabs";
import { useTabContent } from "@/hooks/vault/useTabContent";
import ConfirmationModal from "@/components/Vault/Utils/ConfirmationModal";
import SuccessModal from "@/components/Vault/Utils/SuccessModal";
import { useTransactionContext } from "@/context/TransactionProvider";
import EditModal from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";
import { HourglassIcon } from "@/components/Icons";
import { useAccount } from "@starknet-react/core";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useOBState from "@/hooks/vault_v2/states/useOBState";

interface VaultDetailsProps {
  userType: string;
  isEditOpen: boolean;
  setIsEditOpen: (open: boolean) => void;
}

interface TabContentProps {
  showConfirmation: (
    amount: string,
    action: string,
    onConfirm: () => Promise<void>,
  ) => void;
}

const PanelRight: React.FC<VaultDetailsProps> = ({
  userType,
  isEditOpen,
  setIsEditOpen,
}) => {
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const selectedRoundBuyerState = useOBState(selectedRoundAddress);
  const [activeTab, setActiveTab] = useState<string>("");
  const { account } = useAccount();
  const [bidToEdit, setBidToEdit] = useState({});
  const [modalState, setModalState] = useState<{
    show: boolean;
    type: "confirmation" | "pending" | "success" | "failure";
    modalHeader: string;
    action: ReactNode;
    onConfirm: () => Promise<void>;
  }>({
    show: false,
    type: "confirmation",
    modalHeader: "",
    action: "",
    onConfirm: async () => {},
  });
  const userBids = selectedRoundBuyerState ? selectedRoundBuyerState.bids : [];

  const { tabs, tabContent } = useTabContent(
    userType,
    activeTab,
    selectedRoundState,
    isEditOpen,
    bidToEdit,
    userBids,
    setIsEditOpen,
    setBidToEdit,
  );
  const { pendingTx, status } = useTransactionContext();

  useEffect(() => {
    if (tabs.length === 0) {
    } else if (activeTab === "") {
      setActiveTab(tabs[0]);
    } else if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab, selectedRoundState?.roundState]);

  useEffect(() => {
    if (modalState.type === "pending") {
      if (!pendingTx && status === "success") {
        setModalState((prevState) => ({ ...prevState, type: "success" }));
      } else if (!pendingTx && status === "error") {
        setModalState((prevState) => ({ ...prevState, type: "failure" }));
      } else if (!pendingTx && !status) {
        setModalState((prevState) => ({ ...prevState, type: "success" }));
      }
    }
  }, [pendingTx, modalState.type, status]);
  const handleTabChange = (tab: string) => {
    setIsEditOpen(false);
    setActiveTab(tab);
  };

  const showConfirmation = (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => {
    setModalState({
      show: true,
      type: "confirmation",
      modalHeader,
      action,
      onConfirm,
    });
    setIsEditOpen(false);
  };

  const hideModal = () => {
    setModalState({
      show: false,
      type: "confirmation",
      modalHeader: "",
      action: "",
      onConfirm: async () => {},
    });
  };

  const handleConfirm = async () => {
    await modalState.onConfirm();
    setModalState((prev) => ({ ...prev, type: "pending" }));
  };

  const renderTabContent = () => {
    tabContent;
    if (!tabContent) {
      return null;
    }
    return React.isValidElement(tabContent)
      ? React.cloneElement(tabContent as ReactElement<TabContentProps>, {
          showConfirmation,
        })
      : tabContent;
  };

  if (isEditOpen) {
    return (
      <EditModal
        //modalHeader={`${modalState.modalHeader} Confirmation`}
        //action={modalState.action}
        onConfirm={() => setIsEditOpen(true)}
        onClose={() => setIsEditOpen(false)}
        showConfirmation={showConfirmation}
        bidToEdit={bidToEdit}
      />
    );
  }

  if (modalState.show) {
    if (modalState.type === "confirmation") {
      return (
        <ConfirmationModal
          modalHeader={`${modalState.modalHeader} Confirmation`}
          action={modalState.action}
          onConfirm={handleConfirm}
          onClose={hideModal}
        />
      );
    } else if (modalState.type === "pending") {
    } else if (modalState.type === "success") {
      return (
        <SuccessModal
          activeTab={`${modalState.modalHeader} Successful`}
          action={modalState.action}
          onClose={hideModal}
        />
      );
    } else if (modalState.type === "failure") {
    }
  }

  if (!isEditOpen) {
    return (
      <div className="bg-[#121212] border border-[#262626] rounded-lg w-full flex flex-col h-full justify-center">
        {tabs.length > 0 ? (
          <>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={handleTabChange}
            />
            <div className="flex flex-col flex-grow h-[max]">
              {renderTabContent()}
            </div>
          </>
        ) : (
          <NotStartedYet />
          //<div className="text-white">Round hasn&apos;t started yet</div>
        )}
      </div>
    );
  }
};

const NotStartedYet = () => {
  return (
    <div className="flex flex-col flex-grow items-center justify-center text-center p-6">
      <HourglassIcon />
      <p className="text-[16px] font-medium text-[#FAFAFA] text-center mt-4 mb-3">
        Round In Process
      </p>
      <p className="max-w-[290px] font-regular text-[14px] text-[#BFBFBF] pt-0">
        This round has not started yet. To place a bid, please wait until the
        round&#39;s auction starts.
      </p>
    </div>
  );
};

export default PanelRight;
