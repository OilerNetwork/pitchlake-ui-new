import React from "react";

interface ActionButtonProps {
  onClick: () => void;
  disabled: boolean;
  text: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  disabled,
  text,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`action-button w-full font-semibold text-[14px] py-3 rounded-md ${
      disabled
        ? "bg-[#373632] text-[#8C8C8C] cursor-not-allowed"
        : "bg-[#F5EBB8] text-[#121212]"
    }`}
  >
    {text}
  </button>
);

export default ActionButton;

