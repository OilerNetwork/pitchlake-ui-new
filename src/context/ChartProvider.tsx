"use client";
import React, { createContext, useContext, useMemo, useState } from "react";
import { useFossilGasData } from "@/hooks/chart/useFossilGasData";
import { useUnconfirmedBlocks } from "@/hooks/chart/useUnconfirmedBlocks";
import { FormattedBlockData } from "@/app/api/getFossilGasData/route";
import { getTWAPs } from "@/lib/utils";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useNewContext } from "./NewProvider";
import demoGasData from "@/lib/demo/demo-gas-data.json";
import { DemoRoundDataType, getDemoRoundData } from "@/lib/demo/utils";
import { useDemoTime } from "@/lib/demo/useDemoTime";
import { scaleInRange } from "@/lib/utils";

interface ChartContextProps {
  isExpandedView: boolean;
  setIsExpandedView: (b: boolean) => void;
}

const ChartContext = createContext<ChartContextProps | undefined>(undefined);

export const ChartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  

  /// DEMO ///
// @NOTE: selectedRound & demoNow are only a deps for "demo", is there a better way ?

  return (
    <ChartContext.Provider
      value={{ isExpandedView, setIsExpandedView }}
    >
      {children}
    </ChartContext.Provider>
  );
};

export const useChartContext = () => {
  const context = useContext(ChartContext);
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider");
  }
  return context;
};
