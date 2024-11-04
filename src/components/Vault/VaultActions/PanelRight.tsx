import React, { ReactNode, useState, useEffect, ReactElement } from "react";
import Tabs from "./Tabs/Tabs";
import { useTabContent } from "@/hooks/vault/useTabContent";
import ConfirmationModal from "@/components/Vault/Utils/ConfirmationModal";
import SuccessModal from "@/components/Vault/Utils/SuccessModal";
import { useTransactionContext } from "@/context/TransactionProvider";
import { useProtocolContext } from "@/context/ProtocolProvider";
import EditModal from "@/components/Vault/VaultActions/Tabs/Buyer/EditBid";
import { HourglassIcon } from "@/components/Icons";

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
  const { selectedRoundState, selectedRoundBuyerState } = useProtocolContext();
  const [activeTab, setActiveTab] = useState<string>("");
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
    if (tabs.length > 0 && activeTab === "") {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  useEffect(() => {
    if (!(activeTab in tabs)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, selectedRoundState?.roundState]);

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
        onConfirm={() => setIsEditOpen(false)}
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
      <div className="w-[92px] h-[92px] p-6 rounded-2xl bg-icon-gradient border-[1px] border-greyscale-800 flex flex-row justify-center items-center">
        <HourglassIcon classname="" />
      </div>
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
