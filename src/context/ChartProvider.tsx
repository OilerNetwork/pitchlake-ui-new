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
  gasData: FormattedBlockData[];
  isExpandedView: boolean;
  setIsExpandedView: (b: boolean) => void;
  xMax: number;
  xMin: number;
}

const ChartContext = createContext<ChartContextProps | undefined>(undefined);

export const ChartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const { conn, selectedRound } = useNewContext();

  const { xMin, xMax } = useMemo(() => {
    if (!selectedRoundState) return { xMin: 0, xMax: 0 };

    const xMax = Number(selectedRoundState.optionSettleDate);

    if (!isExpandedView) {
      const xMin = Number(selectedRoundState.deploymentDate);
      return {
        xMin,
        xMax,
      };
    } else {
      const roundOpenDate = Number(selectedRoundState.deploymentDate);
      const roundDuration = xMax - roundOpenDate;
      const expandedChartRange = 4 * roundDuration;
      const xMin = xMax - expandedChartRange;

      return {
        xMin,
        xMax,
      };
    }
  }, [
    selectedRoundState?.deploymentDate,
    selectedRoundState?.optionSettleDate,
    isExpandedView,
  ]);

  const { roundDuration, twapXMin } = useMemo(() => {
    if (!selectedRoundState || xMin === 0 || xMax === 0)
      return { twapXMin: 0, roundDuration: 0 };

    const roundOpenDate = Number(selectedRoundState.deploymentDate);
    const roundDuration = xMax - roundOpenDate;
    const twapXMin = xMin - roundDuration;

    return { roundDuration, twapXMin };
  }, [selectedRoundState?.deploymentDate, xMin, xMax]);

  const { gasData: historicGasData } = useFossilGasData({
    lowerTimestamp: twapXMin,
    upperTimestamp: xMin,
    blocksToFetch: 100,
  });

  const { gasData: fossilGasData } = useFossilGasData({
    lowerTimestamp: xMin,
    upperTimestamp: xMax,
    blocksToFetch: 300,
  });

  const { feeHistory } = useUnconfirmedBlocks(xMin, xMax);

  const { combinedGasData } = useMemo(() => {
    if (!historicGasData || !fossilGasData || !feeHistory || conn === "demo")
      return { combinedGasData: [] };

    // Remove all unconfirmed blocks if timestamp < last fossil block
    let filteredFeeHistory = feeHistory.filter((block) => {
      return block.timestamp <= xMax + 30;
    });

    if (fossilGasData.length >= 1) {
      const lastFossilBlockTimestamp =
        fossilGasData[fossilGasData.length - 1].timestamp;
      filteredFeeHistory = feeHistory.filter((block) => {
        return block.timestamp >= lastFossilBlockTimestamp;
      });
    }

    const allGasData: FormattedBlockData[] = [
      ...historicGasData,
      ...fossilGasData,
      ...filteredFeeHistory,
    ];

    if (allGasData[allGasData.length - 1]?.timestamp < xMax)
      allGasData.push({
        blockNumber: undefined,
        timestamp: xMax,
        basefee: undefined,
      });

    if (isExpandedView)
      allGasData.push({
        blockNumber: undefined,
        timestamp: xMax - roundDuration,
        basefee: undefined,
      });

    return {
      combinedGasData: allGasData
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((d) => {
          return d.timestamp <= xMax;
        }),
    };
  }, [historicGasData, fossilGasData, feeHistory]);

  /// DEMO ///
  const demoNow = conn === "demo" ? useDemoTime(true) : undefined;

  const { gasData } = useMemo(() => {
    if (conn === "ws" || conn === "rpc") {
      return {
        gasData: getTWAPs(combinedGasData, xMin, roundDuration),
      };
    }
    /// DEMO ///
    else {
      if (!demoNow) return { gasData: [] };
      const demoRoundData: DemoRoundDataType = getDemoRoundData(selectedRound);
      const roundStart = Number(demoRoundData.deploymentDate);
      const demoXMax = Number(demoRoundData.optionSettleDate);
      const demoData = demoGasData.filter((d) => d.timestamp <= demoXMax);

      const roundDuration = demoXMax - Number(demoRoundData.deploymentDate);

      const demoXMin = isExpandedView
        ? roundStart - 4 * roundDuration
        : roundStart;

      const allDemoGasData = getTWAPs(demoData, demoXMin, roundDuration);

      const scaledDemoNow = scaleInRange(
        demoNow,
        [xMin, xMax],
        [demoXMin, demoXMax],
      );

      const filteredDemoData = allDemoGasData.filter(
        (d) => d.timestamp <= scaledDemoNow,
      );

      if (
        filteredDemoData[filteredDemoData.length - 1]?.timestamp + 12 <=
        demoXMax
      )
        filteredDemoData.push({ timestamp: demoXMax });

      return { gasData: filteredDemoData };
    }
  }, [combinedGasData, selectedRound, demoNow]); // @NOTE: selectedRound & demoNow are only a deps for "demo", is there a better way ?

  return (
    <ChartContext.Provider
      value={{ gasData, isExpandedView, setIsExpandedView, xMax, xMin }}
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
