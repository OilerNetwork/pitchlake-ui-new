import React, { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

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
}) => (
  <div className="bg-[#121212] border border-[#262626] rounded-lg p-4 w-full flex flex-col h-full confirmation-modal">
    <div className="flex items-center mb-4 confirmation-modal-header">
      <button
        onClick={onClose}
        className="flex justify-center items-center mr-4 w-[40px] h-[40px] rounded-lg border-[1px] border-[#262626] bg-[#0D0D0D] confirmation-modal-back"
      >
        <ChevronLeft className="size-[16px] text-[#F5EBB8]" />
      </button>
      <h2 className="text-[#FAFAFA] text-[14px] font-medium text-md font-semibold confirmation-modal-title">
        {modalHeader}
      </h2>
    </div>
    <div className="flex-grow flex flex-col items-center justify-center confirmation-modal-content">
      <div className="p-6 w-full">
        <div className="bg-[#F5EBB8] rounded-full w-[48px] h-[48px] flex items-center justify-center mx-auto mb-6 border-[8px] border-[#524F44] confirmation-modal-icon">
          <span className="text-black text-2xl font-bold">!</span>
        </div>
        <p className="text-center text-[#bfbfbf] font-regular text-[14px] text-sm mb-8 confirmation-modal-message">
          Are you sure you want to {action}?
        </p>
      </div>
    </div>
    <div className="flex space-x-6 mt-4 confirmation-modal-actions">
      <button
        onClick={onClose}
        className="flex-1 bg-[#121212] border border-[#595959] text-[#FFFFFF] py-3 rounded-lg text-md font-medium confirmation-modal-cancel"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        className="flex-1 bg-[#F5EBB8] text-[#111111] py-3 rounded-lg text-md font-semibold confirmation-modal-confirm"
      >
        Confirm
      </button>
    </div>
  </div>
);

export default ConfirmationModal;
