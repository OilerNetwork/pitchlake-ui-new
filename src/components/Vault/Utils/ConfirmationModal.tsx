import React, { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { ExclamationIcon } from "@/components/Icons";

interface ConfirmationModalProps {
  modalHeader: string;
  action: ReactNode | string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  modalHeader,
  action,
  onConfirm,
  onClose,
}) => {
  return (
    <div className="bg-[#121212] border border-[#262626] rounded-lg  w-full flex flex-col h-full confirmation-modal">
      <div className="flex items-center mb-4 confirmation-modal-header p-6">
        <button
          onClick={onClose}
          className="flex justify-center items-center mr-4 w-[40px] h-[40px] rounded-lg border-[1px] border-[#262626] bg-[#0D0D0D] confirmation-modal-back"
        >
          <ChevronLeft className="size-[16px] text-[#F5EBB8]" />
        </button>
        <h2 className="text-[#FAFAFA] text-[14px] font-medium confirmation-modal-title">
          {modalHeader}
        </h2>
      </div>
      <div className="flex-grow flex flex-row items-center justify-center confirmation-modal-content">
        <div className="p-6 flex flex-col justify-center items-center space-y-6">
          <ExclamationIcon />
          <p className="text-center text-[#bfbfbf] font-regular text-[14px] text-sm confirmation-modal-message">
            Are you sure you want to {action}?
          </p>
        </div>
      </div>
      <div className="flex space-x-6 p-6 confirmation-modal-actions border-t border-[#262626] ">
        <button
          onClick={onClose}
          className="flex-1 h-[44px] bg-[#121212] border border-[#595959] text-[#FFFFFF] py-2 rounded-lg text-md font-medium confirmation-modal-cancel"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 h-[44px] bg-[#F5EBB8] text-[#111111] py-2 rounded-lg text-md font-semibold confirmation-modal-confirm"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
