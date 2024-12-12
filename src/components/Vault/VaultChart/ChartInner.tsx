import React, { useMemo, useEffect, useCallback } from "react";
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
import { useProtocolContext } from "@/context/ProtocolProvider";

interface GasPriceChartProps {
  data: any[] | undefined;
  activeLines: { [key: string]: boolean };
  historicalData: any;
  fromRound: number;
  toRound: number;
  isExpandedView: boolean;
  selectedRound: number;
  setIsExpandedView: (value: boolean) => void;
}

const GasPriceChart: React.FC<GasPriceChartProps> = ({
  data,
  historicalData,
  activeLines,
  fromRound,
  toRound,
  isExpandedView,
  selectedRound,
  setIsExpandedView,
}) => {
  const { setSelectedRound, selectedRoundState } = useProtocolContext();
  // Compute vertical segments and round areas based on historical data
  const { verticalSegments, roundAreas } = useMemo(() => {
    if (
      !historicalData ||
      !historicalData.rounds ||
      !data ||
      !fromRound ||
      !toRound ||
      !isExpandedView
    )
      return { verticalSegments: [], roundAreas: [] };

    const segments: any = [];
    const areas: any = [];
    const sortedData: any = [...data].sort((a, b) => a.timestamp - b.timestamp);

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

      if (!start || !end) {
        return;
      }

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
  }, [isExpandedView, historicalData, data, fromRound, toRound]);

  // Compute the maximum Y value based on active lines
  const yMax = useMemo(() => {
    if (!data) return 0;
    let max = 0;
    data.forEach((item) => {
      if (activeLines.TWAP && item.TWAP !== null && item.TWAP > max) {
        max = item.TWAP;
      }
      if (activeLines.BASEFEE && item.BASEFEE !== null && item.BASEFEE > max) {
        max = item.BASEFEE;
      }
      if (activeLines.STRIKE && item.STRIKE !== null && item.STRIKE > max) {
        max = item.STRIKE;
      }
      if (item.CAP_LEVEL !== null && item.CAP_LEVEL > max) {
        max = item.CAP_LEVEL;
      }
    });
    // Optionally, add some padding to yMax
    return max * 1.2; // 20% padding
  }, [data, activeLines]);

  // Define Y-axis ticks
  const yTicks = useMemo(() => {
    if (yMax === 0) return [0];
    const step = yMax / 4;
    return [
      0,
      parseFloat(step.toFixed(2)),
      parseFloat((step * 2).toFixed(2)),
      parseFloat((step * 3).toFixed(2)),
      parseFloat(yMax.toFixed(2)),
    ];
  }, [yMax]);

  const desiredXTickCount = 5;

  // Compute X-axis ticks and labels based on view
  const { xTicks, xTickLabels } = useMemo(() => {
    if (!data) return { xTicks: [], xTickLabels: {} };

    const ticks: number[] = [];
    const labels: {
      [key: number]: { label: string | null; roundId?: number };
    } = {};

    if (!historicalData || !historicalData.rounds || !fromRound || !toRound) {
      return { xTicks: ticks, xTickLabels: labels };
    }

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const filteredRounds = historicalData.rounds.filter(
      (round: any) => round.roundId >= fromRound && round.roundId <= toRound,
    );

    // Generate midpoints for round IDs
    filteredRounds.forEach((round: any) => {
      const deploymentDate = Number(round.deploymentDate);
      const optionSettleDate = Number(round.optionSettleDate);
      const start = sortedData.find((d) => d.timestamp >= deploymentDate);
      const end = [...sortedData]
        .reverse()
        .find((d) => d.timestamp <= optionSettleDate);

      if (!start || !end) {
        console.warn(
          `Could not find matching data points for roundId ${round.roundId}`,
        );
        return;
      }

      const midpoint = (Number(start.timestamp) + Number(end.timestamp)) / 2;
      ticks.push(midpoint);
      labels[midpoint] = {
        label: `Round ${round.roundId}`,
        roundId: round.roundId,
      };
    });

    // Generate timestamp ticks
    const timestamps = data.map((item) => item.timestamp);
    const minTimestamp = Math.min(...timestamps);
    const maxTimestamp = Math.max(...timestamps);

    let timestampTickCount = desiredXTickCount;
    if (isExpandedView) {
      timestampTickCount = 0; // Fewer ticks in expanded view
    }

    const step = Math.floor(
      (maxTimestamp - minTimestamp) / (timestampTickCount - 1),
    );

    for (let i = 0; i < timestampTickCount; i++) {
      const tickValue = minTimestamp + step * i;
      ticks.push(tickValue);
      labels[tickValue] = { label: null }; // Will format in custom tick
    }

    // Ensure ticks are sorted
    ticks.sort((a, b) => a - b);

    return { xTicks: ticks, xTickLabels: labels };
  }, [
    data,
    isExpandedView,
    historicalData,
    fromRound,
    toRound,
    desiredXTickCount,
  ]);

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
              <div key={index} className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: entry?.color }}
                ></div>
                <p className="text-white text-sm">
                  {entry?.name.replace("_", " ")}:{" "}
                  {entry?.value !== undefined
                    ? Number(entry?.value).toFixed(2)
                    : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle Loading State
  if (!data || data.length === 0) {
    return (
      <div className="w-[100%] h-[665px] bg-black-alt rounded-[12px] flex flex-col items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" maxHeight={665} className="pr-4">
      <ComposedChart margin={{ left: -20 }} data={data} syncId="roundChart">
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
          <Area
            height={400}
            type="monotone"
            dataKey="TWAP"
            stroke="var(--error-300)"
            strokeWidth={2}
            fill="url(#twapGradient)"
            fillOpacity={1}
            connectNulls={true}
            dot={false}
            isAnimationActive={true}
          />
        )}
        {activeLines.BASEFEE && (
          <Area
            type="monotone"
            dataKey="BASEFEE"
            stroke="var(--greyscale)"
            strokeWidth={0.5}
            fill="url(#basefeeGradient)"
            fillOpacity={1}
            connectNulls={true}
            dot={false}
            isAnimationActive={true}
          />
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
            isAnimationActive={true}
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
            isAnimationActive={true}
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
                setSelectedRound(area.roundId);
                setIsExpandedView(false);
              }}
              style={{ cursor: "pointer" }}
            />
          ))
        }
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default GasPriceChart;
