"use client";
import { Default } from "@/components/HelpBoxComponents/HelpBoxPanel";
import React, { createContext, ReactNode, useContext, useState } from "react";

interface HelpContextProps {
  isHelpBoxOpen: boolean;
  toggleHelpBoxOpen: () => void;

  content: string | null;
  setContent: (val: string | null) => void;

  isHoveringHelpBox: boolean;
  setIsHoveringHelpBox: (val: boolean) => void;
}

const HelpContext = createContext<HelpContextProps | undefined>(undefined);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isHelpBoxOpen, setIsHelpBoxOpen] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [isHoveringHelpBox, setIsHoveringHelpBox] = useState(false);

  const toggleHelpBoxOpen = () => {
    setIsHelpBoxOpen((prev) => !prev);
  };

  return (
    <HelpContext.Provider
      value={{
        isHelpBoxOpen,
        toggleHelpBoxOpen,
        content,
        setContent,
        isHoveringHelpBox,
        setIsHoveringHelpBox,
      }}
    >
      {children}
    </HelpContext.Provider>
  );
};

export const useHelpContext = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error("useHelpContext must be used within a HelpProvider");
  }
  return context;
};
