"use client";
import { useMemo, useState } from "react";
import { useFossilGasData } from "@/hooks/chart/useFossilGasData";
import { useUnconfirmedBlocks } from "@/hooks/chart/useUnconfirmedBlocks";
import { FormattedBlockData } from "@/app/api/getFossilGasData/route";
import { getTWAPs, scaleInRange } from "@/lib/utils";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { useChartContext } from "@/context/ChartProvider";
import { useNewContext } from "@/context/NewProvider";
import { useDemoTime } from "@/lib/demo/useDemoTime";
import {
  DemoFossilCallbackDataType,
  DemoRoundDataType,
  getDemoFossilCallbackData,
  getDemoRoundData,
} from "@/lib/demo/utils";
import demoGasData from "@/lib/demo/demo-gas-data.json";

export const useChart = () => {
  //const [isExpandedView, setIsExpandedView] = useState<boolean>(false);
  const { conn, selectedRound } = useNewContext();
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const { xMin, xMax, isExpandedView } = useChartContext();

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

    if (fossilGasData.length === 0) {
      fossilGasData.push({ timestamp: xMin }, { timestamp: xMax });
    } else if (fossilGasData.length > 2) {
      const cutoff =
        Math.max(fossilGasData[fossilGasData.length - 2].timestamp, xMin) - 30;
      filteredFeeHistory = filteredFeeHistory.filter((block) => {
        return block.timestamp >= cutoff;
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
  const { demoNow } = useDemoTime(true, conn === "demo");

  const { gasData } = useMemo(() => {
    if (conn === "ws" || conn === "rpc") {
      return {
        gasData: getTWAPs(combinedGasData, xMin, roundDuration),
      };
    }
    /// DEMO ///
    else {
      if (!demoNow) return { gasData: [] };
      const demoRoundData: DemoFossilCallbackDataType =
        getDemoFossilCallbackData(selectedRound);
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
  }, [combinedGasData, selectedRound, demoNow]);

  return { gasData };
};

export default useChart;
