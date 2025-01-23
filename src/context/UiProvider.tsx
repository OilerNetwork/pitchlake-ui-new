"use client";
import React, { createContext, useContext, useState } from "react";

interface UiContextProps {
  isBlurOpen: boolean;
  setBlurOpen: (b: boolean) => void;
  toggleBlurOpen: () => void;
}

const UiContext = createContext<UiContextProps | undefined>(undefined);

export const UiProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBlurOpen, setIsBlurOpen] = useState<boolean>(false);

  const toggleBlurOpen = () => {
    setIsBlurOpen((prev) => !prev);
  };

  const setBlurOpen = (b: boolean) => {
    setIsBlurOpen(b);
  };

  return (
    <UiContext.Provider
      value={{
        isBlurOpen,
        setBlurOpen,
        toggleBlurOpen,
      }}
    >
      {children}
    </UiContext.Provider>
  );
};

export const useUiContext = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error("useUiContext must be used within a UiProvider");
  }
  return context;
};
