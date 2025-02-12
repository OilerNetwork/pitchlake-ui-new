import React, { useMemo, useRef, useCallback } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Tooltip,
} from "recharts";
import { formatUnits } from "ethers";
import { useHelpContext } from "@/context/HelpProvider";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";
import { useChartContext } from "@/context/ChartProvider";
import { FormattedBlockData } from "@/app/api/getFossilGasData/route";
import { useNewContext } from "@/context/NewProvider";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useChart from "@/hooks/chart/useChartData";
import { getDemoRoundId } from "@/lib/demo/utils";
import demoRoundData from "@/lib/demo/demo-round-data.json";

const HOVER_DELAY = 888;

interface GasPriceChartProps {
  activeLines: { [key: string]: boolean };
}

const GasPriceChart: React.FC<GasPriceChartProps> = ({ activeLines }) => {
  // Protocol context
  const { conn, selectedRound } = useNewContext();
  const { vaultState } = useVaultState();
  const selectedRoundState = useRoundState(vaultState?.address);

  // Chart context
  const { isExpandedView, setIsExpandedView, xMax, xMin } = useChartContext();
  const { gasData } = useChart();

  // Help context
  const { setContent, setHeader, isHoveringHelpBox } = useHelpContext();

  // Strike and cap for all possibly displayed rounds
  const { fromRound, toRound } = useMemo(() => {
    if (!selectedRound) return { fromRound: 1, toRound: 1 };

    const toRound =
      conn === "demo" ? getDemoRoundId(selectedRound) : Number(selectedRound);
    const fromRound = !isExpandedView ? toRound : toRound > 4 ? toRound - 4 : 1;

    return { fromRound, toRound };
  }, [selectedRound, isExpandedView]);

  const { vaultData: _historicalData } = useHistoricalRoundParams({
    vaultAddress: vaultState?.address,
    fromRound,
    toRound,
  });

  const historicalData = useMemo(() => {
    if (conn === "demo") {
      return { rounds: demoRoundData };
    } else return _historicalData;
  }, [_historicalData]);

  // Add strike and cap to gas data
  const parsedData: FormattedBlockData[] = useMemo(() => {
    if (!selectedRound || !historicalData || !gasData) return [];

    const dataPoints =
      gasData.length > 0 ? gasData : [{ timestamp: xMin }, { timestamp: xMax }];

    const refined = dataPoints?.map((item: any) => {
      const newItem: any = { ...item };

      // Find the round this gas point falls in
      const roundThisItemIsIn = historicalData.rounds.find((r: any) => {
        const lowerBound = Number(r.deploymentDate);
        const upperBound = Number(r.optionSettleDate);
        return item?.timestamp >= lowerBound && item?.timestamp <= upperBound;
      });

      if (roundThisItemIsIn) {
        const strike = Number(
          formatUnits(roundThisItemIsIn.strikePrice, "gwei"),
        );
        const cap =
          Number(formatUnits(roundThisItemIsIn.strikePrice, "gwei")) *
          (1 + Number(roundThisItemIsIn.capLevel) / 10000);

        newItem.STRIKE = strike;
        newItem.CAP_LEVEL = cap;
      } else {
        newItem.STRIKE = undefined;
        newItem.CAP_LEVEL = undefined;
      }

      return newItem;
    });

    let sorted = refined.sort((a, b) => a.timestamp - b.timestamp);

    return sorted;
  }, [gasData, historicalData]);

  // Compute vertical segments and round areas based on historical data
  const { verticalSegments, roundAreas } = useMemo(() => {
    if (
      !historicalData ||
      !historicalData.rounds ||
      !parsedData ||
      !fromRound ||
      !toRound ||
      !isExpandedView
    )
      return { verticalSegments: [], roundAreas: [] };

    const segments: any = [];
    const areas: any = [];
    const sortedData: any = [...parsedData].sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    // Filter rounds based on fromRoundId and toRoundId
    const filteredRounds = historicalData.rounds.filter(
      (round: any) => round.roundId >= fromRound && round.roundId <= toRound,
    );

    filteredRounds.forEach((round: any) => {
      if (!round || !round.capLevel || !round.strikePrice) return;

      const capLevel = Number(round.capLevel);
      const strikePriceGwei = parseFloat(
        formatUnits(round.strikePrice, "gwei"),
      );
      const deploymentDate = Number(round.deploymentDate);
      const optionSettleDate = Number(round.optionSettleDate);
      const capMultiplier = 1 + capLevel / 10000;
      const cappedStrike = strikePriceGwei * capMultiplier;

      // Find the nearest data points for deploymentDate and optionSettleDate
      const start = sortedData.find((d: any) => d.timestamp >= deploymentDate);
      const end = [...sortedData]
        .reverse()
        .find((d) => d.timestamp <= optionSettleDate);

      if (!start || !end) return;

      // Add deployment date line
      segments.push({
        roundId: round.roundId,
        segment: [
          { x: start.timestamp, y: cappedStrike },
          { x: start.timestamp, y: 0 },
        ],
      });

      // Add settlement date line
      segments.push({
        roundId: round.roundId,
        segment: [
          { x: end.timestamp, y: cappedStrike },
          { x: end.timestamp, y: 0 },
        ],
      });

      // Add round area for interactive region
      areas.push({
        roundId: round.roundId,
        x1: start.timestamp,
        x2: end.timestamp,
        y1: 0,
        y2: cappedStrike,
      });
    });

    return { verticalSegments: segments, roundAreas: areas };
  }, [isExpandedView, historicalData, parsedData, fromRound, toRound]);

  // Hover logic
  const isInChartRef = useRef(false);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  const handleMouseMove = useCallback(
    (state: any) => {
      if (!state?.chartX || !state?.chartY || isHoveringHelpBox) return;

      // In chart
      isInChartRef.current = true;

      // Clear previous timer
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
      }

      hoverTimer.current = setTimeout(() => {
        if (isInChartRef.current && !isHoveringHelpBox) {
          setContent(
            `Hovering at chart coords: ${state.chartX}, ${state.chartY}`,
          );
          setHeader(null);
        }
      }, HOVER_DELAY);
    },
    [isHoveringHelpBox, setContent],
  );

  const handleMouseLeave = useCallback(() => {
    isInChartRef.current = false;
    clearHoverTimer();
  }, [clearHoverTimer]);

  // Compute the maximum Y value based on active lines
  const { yMax, yTicks } = useMemo((): { yMax: number; yTicks: number[] } => {
    if (!parsedData) return { yMax: 0, yTicks: [] };

    // Find the maximum value in the data
    let max = 0;

    parsedData.forEach((item: any) => {
      if (activeLines.TWAP && item.TWAP !== null && item.TWAP > max) {
        max = item.twap;
      }
      if (activeLines.BASEFEE && item.BASEFEE !== null && item.BASEFEE > max) {
        max = item.basefee;
      }
      if (activeLines.STRIKE && item.STRIKE !== null && item.STRIKE > max) {
        max = item.STRIKE;
      }
      if (item.CAP_LEVEL !== null && item.CAP_LEVEL > max) {
        max = item.CAP_LEVEL;
      }
      if (activeLines.BASEFEE && item.basefee && item.basefee > max) {
        max = item.basefee;
      }
      if (
        activeLines.BASEFEE &&
        item.unconfirmedBasefee &&
        item.unconfirmedBasefee > max
      ) {
        max = item.unconfirmedBasefee;
      }
      if (
        activeLines.BASEFEE &&
        item.confirmedBasefee &&
        item.confirmedBasefee > max
      ) {
        max = item.confirmedBasefee;
      }
      if (
        activeLines.TWAP &&
        item.unconfirmedTwap &&
        item.unconfirmedBasefee > max
      ) {
        max = item.unconfirmedTwap;
      }
      if (
        activeLines.TWAP &&
        item.confirmedTwap &&
        item.confirmedBasefee > max
      ) {
        max = item.confirmedTwap;
      }
    });

    const _yMax = max * 1.2; // 20% padding

    if (_yMax === 0) return { yMax: _yMax, yTicks: [] };

    // Define Y-axis ticks
    const step = _yMax / 4;
    const _yTicks = [
      0,
      Number(step.toFixed(1)),
      Number((step * 2).toFixed(1)),
      Number((step * 3).toFixed(1)),
      Number(_yMax.toFixed(1)),
    ];

    return { yMax: _yMax, yTicks: _yTicks };
  }, [parsedData, activeLines]);

  // Compute X-axis ticks and labels based on view
  const { xTicks, xTickLabels } = useMemo(() => {
    let _xTicks: number[] = [];
    let _xTickLabels: {
      [key: number]: { label: string | null; roundId?: number };
    } = {};

    if (!parsedData) return { xTicks: _xTicks, xTickLabels: _xTickLabels };

    if (!historicalData || !historicalData.rounds || !fromRound || !toRound) {
      return { xTicks: _xTicks, xTickLabels: _xTickLabels };
    }

    const sortedData = [...parsedData].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const filteredRounds = historicalData.rounds.filter(
      (round: any) => round.roundId >= fromRound && round.roundId <= toRound,
    );

    // Generate midpoints for round IDs
    filteredRounds.forEach((round: any) => {
      const start = Number(round.deploymentDate);
      const end = Number(round.optionSettleDate);

      const midpoint = (Number(start) + Number(end)) / 2;
      if (
        midpoint >= sortedData[1]?.timestamp &&
        midpoint <= sortedData[sortedData.length - 1]?.timestamp
      ) {
        _xTickLabels[midpoint] = {
          label: `Round ${round.roundId}`,
          roundId: round.roundId,
        };
        _xTicks.push(midpoint);
      }
    });

    // Generate timestamp ticks
    const timestamps = parsedData.map((item: any) => item.timestamp);
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    _xTicks.push(minTimestamp);
    _xTickLabels[minTimestamp] = { label: null }; // Will format in custom tick
    _xTicks.push(maxTimestamp);
    _xTickLabels[maxTimestamp] = { label: null }; // Will format in custom tick

    // Ensure ticks are sorted
    _xTicks.sort((a, b) => a - b);

    return { xTicks: _xTicks, xTickLabels: _xTickLabels };
  }, [parsedData, isExpandedView, historicalData, fromRound, toRound]);

  // Custom X-axis tick component
  const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload } = props;

    const value = payload.value;

    let label = "";
    let color = "#AAA"; // Default color for timestamps
    const tickInfo = xTickLabels[value];

    if (tickInfo && tickInfo.label) {
      // It's a round ID
      label = tickInfo.label || "";
      if (tickInfo.roundId === selectedRound) {
        color = "#ADA478"; // Color for selected round
      } else {
        color = "#524f44"; // color for other rounds
      }
    } else {
      // Format the timestamp
      const date = new Date(value * 1000);
      const range =
        Number(selectedRoundState?.optionSettleDate) -
        Number(selectedRoundState?.deploymentDate);

      label =
        range < 3600 * 24
          ? date.toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : date
              .toLocaleString("en-US", {
                month: "short",
                day: "numeric",
              })
              .replace(",", "");
    }

    return (
      <text x={x} y={y + 15} fill={color} fontSize="12" textAnchor="middle">
        {label}
      </text>
    );
  };

  // Format Y-axis ticks
  const yTickFormatter = useCallback((value: number): string => {
    return value.toFixed(1);
  }, []);

  // Handle Loading State
  if (!parsedData || parsedData.length === 0) {
    return (
      <div className="gas-price-chart-loading w-[100%] h-[665px] bg-black-alt rounded-[12px] flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  const animationDuration = 500;
  const isAnimationActive = !isExpandedView;

  return (
    <ResponsiveContainer
      width="100%"
      maxHeight={665}
      className="pr-4 gas-price-chart-container"
    >
      <ComposedChart
        margin={{ left: -20 }}
        data={parsedData}
        syncId="roundChart"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="capLevelGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--success-700)"
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor="var(--success-700)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="basefeeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--greyscale-600)"
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor="var(--greyscale-600)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="strikeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--warning-300)"
              stopOpacity={0.2}
            />
            <stop
              offset="100%"
              stopColor="var(--success-300)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="twapGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#333"
          horizontal={false}
          syncWithTicks={true}
        />
        <XAxis
          dataKey="timestamp"
          domain={["dataMin", "dataMax"]}
          type="number"
          scale="time"
          stroke="#666"
          ticks={xTicks}
          tickLine={false}
          tick={<CustomizedXAxisTick />}
        />
        <YAxis
          type="number"
          domain={[0, yMax]}
          stroke="#666"
          tickFormatter={yTickFormatter}
          ticks={yTicks}
          tickLine={false}
          allowDataOverflow={false}
          tick={{ fill: "#AAA", fontSize: 12 }}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: "#ADA478",
            strokeWidth: 2,
            strokeDasharray: "5 5",
          }}
        />

        {activeLines.TWAP && (
          <>
            <Area
              height={400}
              type="monotone"
              className="chart-area-twap"
              dataKey="confirmedTwap"
              stroke="var(--error-300)"
              strokeWidth={2}
              fill="url(#twapGradient)"
              fillOpacity={1}
              connectNulls={true}
              dot={false}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
            <Line
              className="chart-area-twap"
              height={400}
              type="monotone"
              dataKey="unconfirmedTwap"
              //stroke="var(--error-300)"
              stroke="#E69EB1"
              strokeWidth={2}
              strokeDasharray="1 0 1"
              //fill="url(#twapGradient)"
              fillOpacity={1}
              connectNulls={true}
              dot={false}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
          </>
        )}
        {activeLines.BASEFEE && (
          <>
            <Area
              type="monotone"
              className="chart-area-basefee"
              dataKey="confirmedBasefee"
              stroke="var(--greyscale)"
              strokeWidth={0.5}
              fill="url(#basefeeGradient)"
              fillOpacity={1}
              connectNulls={true}
              dot={false}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
            <Line
              type="monotone"
              className="chart-area-basefee"
              dataKey="unconfirmedBasefee"
              stroke="#8B8460"
              strokeDasharray="1 0 1"
              strokeWidth={0.5}
              activeDot={true}
              dot={false}
              fill="url(#basefeeGradient)"
              connectNulls={false}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
          </>
        )}
        {activeLines.STRIKE && (
          <Line
            type="monotone"
            dataKey="STRIKE"
            stroke="var(--warning-300)"
            strokeWidth={2}
            activeDot={true}
            dot={false}
            fill="url(#strikeGradient)"
            connectNulls={false}
            isAnimationActive={isAnimationActive}
            animationDuration={animationDuration}
          />
        )}
        {activeLines.CAP_LEVEL && (
          <Area
            type="monotone"
            dataKey="CAP_LEVEL"
            stroke="var(--success)"
            strokeWidth={2}
            label="Cap Level"
            activeDot={true}
            dot={false}
            fill="url(#capLevelGradient)"
            connectNulls={false}
            isAnimationActive={isAnimationActive}
            animationDuration={animationDuration}
          />
        )}
        {
          // Round boundary lines (in expanded view)
          verticalSegments.map((segmentObj: any, index: any) => {
            return (
              <ReferenceLine
                key={`line-${index}`}
                segment={segmentObj.segment}
                stroke={
                  segmentObj.roundId === selectedRound ? "#ADA478" : "#524F44"
                }
                strokeWidth={2}
              />
            );
          })
        }
        {
          // Round boundary areas (in expanded view)
          roundAreas.map((area: any, index: number) => (
            <ReferenceArea
              key={`area-${index}`}
              x1={area.x1}
              x2={area.x2}
              y1={area.y1}
              y2={area.y2}
              stroke={
                activeLines.CAP_LEVEL
                  ? "none"
                  : area.roundId === selectedRound
                    ? "#ADA478"
                    : "#524F44"
              }
              fillOpacity={area.roundId === selectedRound ? 0.07 : 0.03}
              strokeWidth={2}
              onClick={() => {
                setIsExpandedView(false);
              }}
              style={{ cursor: "pointer" }}
              isAnimationActive={isAnimationActive}
              animationDuration={animationDuration}
            />
          ))
        }
      </ComposedChart>
    </ResponsiveContainer>
  );
};

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(Number(label) * 1000);
    const dateString = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Create a map to keep track of unique dataKeys
    const uniqueData = new Map<string, any>();
    payload.forEach((entry: any) => {
      if (!uniqueData.has(entry.name)) {
        uniqueData.set(entry.name, entry);
      }
    });

    return (
      <div className="bg-[#1E1E1E] p-4 rounded-lg shadow-lg">
        <p className="text-white text-sm mb-2">{dateString}</p>
        <div className="space-y-2">
          {Array.from(uniqueData.values()).map((entry: any, index: any) => (
            <div className="space-y-2" key={index}>
              {entry?.name === "basefee" ? (
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2 flex flex-col"
                    style={{ backgroundColor: entry?.color }}
                  ></div>
                  <p className="text-white text-sm">PENDING BLOCK</p>
                </div>
              ) : (
                <></>
              )}

              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2 flex flex-col"
                  style={{ backgroundColor: entry?.color }}
                ></div>
                <p className="text-white text-sm">
                  {entry?.name?.includes("Basefee")
                    ? "BASEFEE"
                    : entry?.name?.includes("Twap")
                      ? "TWAP"
                      : entry?.name.replace("_", " ")}
                  {": "}
                  {entry?.value !== undefined
                    ? Number(entry?.value).toFixed(2)
                    : "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default GasPriceChart;
