"use server";

import { NextResponse } from "next/server";
import { formatUnits } from "ethers";
import { Pool } from "pg";

const MAX_RETURN_BLOCKS = 100;

interface RawBlockData {
  block_number?: number;
  base_fee_per_gas?: string;
  timestamp: number;
}

interface ProcessedBlockData {
  block_number?: number;
  base_fee_per_gas?: bigint;
  timestamp: number;
}

// Helper to fetch data from the database
async function fetchBlockData(
  pool: Pool,
  bucketCount: number,
  fromTs: number,
  toTs: number,
): Promise<RawBlockData[]> {
  const query = `
    WITH selected_blocks AS (
      SELECT DISTINCT ON (bucket) number, base_fee_per_gas, timestamp
      FROM (
        SELECT number, base_fee_per_gas, timestamp,
              NTILE($1) OVER (ORDER BY timestamp ASC) AS bucket
        FROM blockheaders
        WHERE timestamp BETWEEN $2 AND $3
      ) AS sub
      ORDER BY bucket, timestamp DESC
    )
    SELECT number AS block_number, base_fee_per_gas, timestamp
    FROM selected_blocks
    ORDER BY timestamp ASC;
  `;
  const values = [bucketCount, fromTs, toTs];
  const result = await pool.query(query, values);
  return result.rows.map((r: any) => ({
    block_number: r.block_number || undefined,
    base_fee_per_gas: r.base_fee_per_gas || undefined,
    timestamp: Number(r.timestamp),
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timestampFrom = searchParams.get("from_timestamp");
  const timestampTo = searchParams.get("to_timestamp");
  const twapRangeParam = searchParams.get("twap_range");
  const roundStart = searchParams.get("round_start");

  if (!timestampFrom || !timestampTo || !twapRangeParam || !roundStart) {
    return NextResponse.json(
      {
        error:
          "Missing from_timestamp, to_timestamp, twap_range, or round_start parameter",
      },
      { status: 400 },
    );
  }

  const fromTimestamp = parseInt(timestampFrom, 10);
  const toTimestamp = parseInt(timestampTo, 10);
  const twapRange = parseInt(twapRangeParam, 10);

  const timestampRange = toTimestamp - fromTimestamp;

  // Limit checks
  if (timestampRange > 121 * 24 * 60 * 60) {
    return NextResponse.json(
      { error: "Invalid timestamp range; maximum 120 days allowed." },
      { status: 400 },
    );
  }
  if (twapRange < 0 || twapRange > 31 * 24 * 60 * 60) {
    return NextResponse.json(
      {
        error: "Invalid twap_range; must be between 0 and 30 days in seconds.",
      },
      { status: 400 },
    );
  }

  // We need historical data prior to fromTimestamp to correctly calculate TWAP at fromTimestamp.
  // So let's fetch data starting from (fromTimestamp - twapRange) if twapRange > 0.
  const historicalStart =
    twapRange > 0 ? fromTimestamp - twapRange : fromTimestamp;
  const adjustedHistoricalStart = Math.max(historicalStart, 0); // Ensure not negative

  try {
    const pool = new Pool({
      connectionString: process.env.FOSSIL_DB_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Fetch historical data (to ensure we have enough data for TWAP at the first requested point)
    const historicalData = await fetchBlockData(
      pool,
      MAX_RETURN_BLOCKS,
      adjustedHistoricalStart,
      fromTimestamp,
    );

    // Fetch main data
    const mainData = await fetchBlockData(
      pool,
      MAX_RETURN_BLOCKS,
      fromTimestamp,
      toTimestamp,
    );

    await pool.end();

    let combinedData = [...historicalData, ...mainData];

    // If no data returned, fallback to a placeholder
    if (combinedData.length === 0) {
      combinedData.push({
        block_number: undefined,
        base_fee_per_gas: undefined,
        timestamp: toTimestamp,
      });
      combinedData.push({
        block_number: undefined,
        base_fee_per_gas: undefined,
        timestamp: fromTimestamp,
      });
    }

    // Ensure sorted by timestamp
    combinedData = combinedData.sort((a, b) => a.timestamp - b.timestamp);

    // Convert base_fee_per_gas to bigint for arithmetic
    const sortedData: ProcessedBlockData[] = combinedData.map((r) => ({
      block_number: r.block_number,
      timestamp: r.timestamp,
      base_fee_per_gas: r.base_fee_per_gas
        ? BigInt(r.base_fee_per_gas)
        : undefined,
    }));

    // We will maintain a sliding window of data points for TWAP calculation.
    // The window includes all points within [current_timestamp - twapRange, current_timestamp].
    // We'll also need to "extend" each known data point forward until the next data point, using its base fee.
    // That way we can compute a time-weighted average over a continuous period.

    const dataWithTwap = sortedData.map((currentPoint, index) => {
      const currentTime = currentPoint.timestamp;
      const windowStart = currentTime - twapRange;

      // Build a list of segments that cover [windowStart, currentTime]
      // We'll use the sortedData array and also interpolate if needed.

      // Find relevant data points within the window or just before it
      // We need to find:
      // - The last data point before or at windowStart (for interpolation)
      // - All data points within (windowStart, currentTime]

      // Find the start index for the window
      // This could be optimized with a binary search, but we'll keep it simple here.
      let windowData: { timestamp: number; baseFee: bigint }[] = [];

      // To handle interpolation:
      // 1. Find the last known base fee at or before windowStart.
      let lastKnownBaseFee: bigint | undefined;
      for (let i = index; i >= 0; i--) {
        if (
          sortedData[i].base_fee_per_gas !== undefined &&
          sortedData[i].timestamp <= currentTime
        ) {
          if (sortedData[i].timestamp <= windowStart) {
            lastKnownBaseFee = sortedData[i].base_fee_per_gas;
            break;
          } else {
            lastKnownBaseFee = sortedData[i].base_fee_per_gas;
            // Keep going back to see if we can find an earlier data point at or before windowStart
          }
        }
      }

      // If we didn't find a point at or before windowStart, we can still use the earliest known base fee.
      if (lastKnownBaseFee === undefined) {
        // If there's no known base fee at all, TWAP is undefined.
        // This would mean all points are undefined, which is unusual.
        // We'll just return undefined in that case.
        const anyKnown = sortedData.some(
          (d) => d.base_fee_per_gas !== undefined,
        );
        if (!anyKnown) {
          return { ...currentPoint, twap: undefined };
        }

        // If we found data after the window start, use the earliest known base fee.
        for (let i = 0; i <= index; i++) {
          if (sortedData[i].base_fee_per_gas !== undefined) {
            lastKnownBaseFee = sortedData[i].base_fee_per_gas;
            break;
          }
        }
      }

      // Now we have a starting base fee at or before windowStart (or at least the earliest known).
      // Collect all points that occur after windowStart and up to currentTime.
      // We'll break the interval [windowStart, currentTime] into segments.
      let prevTs = windowStart;
      let prevFee = lastKnownBaseFee!;
      for (let i = 0; i <= index; i++) {
        const dp = sortedData[i];
        if (
          dp.base_fee_per_gas !== undefined &&
          dp.timestamp >= windowStart &&
          dp.timestamp <= currentTime
        ) {
          // We have a known data point in the window.
          // Create a segment from prevTs to dp.timestamp with prevFee.
          if (dp.timestamp > prevTs) {
            windowData.push({ timestamp: prevTs, baseFee: prevFee });
          }
          // Advance prevTs and prevFee
          prevTs = dp.timestamp;
          prevFee = dp.base_fee_per_gas;
        }
      }

      // After processing all known points in the window, we still have the tail segment from prevTs to currentTime.
      if (currentTime > prevTs) {
        windowData.push({ timestamp: prevTs, baseFee: prevFee });
      }

      // Now calculate the time-weighted average from windowData.
      // windowData is a set of (timestamp, baseFee) points indicating that from that timestamp forward
      // until the next point (or the end of the window), the baseFee applied.
      let weightedSum = BigInt(0);
      let totalDelta = 0;

      for (let i = 0; i < windowData.length; i++) {
        const startSegment = windowData[i].timestamp;
        const endSegment =
          i < windowData.length - 1 ? windowData[i + 1].timestamp : currentTime;
        const delta = endSegment - startSegment;
        if (delta > 0) {
          weightedSum += windowData[i].baseFee * BigInt(delta);
          totalDelta += delta;
        }
      }

      let twapValue: number | undefined;
      if (totalDelta > 0) {
        twapValue = Number(weightedSum / BigInt(totalDelta));
      } else {
        // If no delta, just use the last known fee
        twapValue = Number(lastKnownBaseFee);
      }

      return { ...currentPoint, twap: twapValue };
    });

    const data: any[] = dataWithTwap
      // Filter out any points before fromTimestamp if desired
      .filter(
        (row) => row.timestamp >= fromTimestamp && row.timestamp <= toTimestamp,
      )
      .map((row) => ({
        block_number: row.block_number,
        timestamp: row.timestamp,
        BASEFEE: row.base_fee_per_gas
          ? formatUnits(row.base_fee_per_gas.toString(), "gwei")
          : undefined,
        TWAP:
          row.twap !== undefined
            ? formatUnits(Math.floor(row.twap).toString(), "gwei")
            : undefined,
      }));
    if (data.length == 0) {
      data.push({
        block_number: undefined,
        base_fee_per_gas: undefined,
        timestamp: toTimestamp,
      });
      data.push({
        block_number: undefined,
        base_fee_per_gas: undefined,
        timestamp: fromTimestamp,
      });
    }

    if (data.length >= 1 && data[data.length - 1].timestamp <= toTimestamp) {
      const lastKnownTimestamp = parseInt(data[data.length - 1].timestamp);
      if (lastKnownTimestamp <= Number(roundStart)) {
        data.push({
          block_number: undefined,
          base_fee_per_gas: undefined,
          timestamp: Number(roundStart),
        });
      }

      if (
        lastKnownTimestamp <=
        toTimestamp -
          12 -
          Math.floor((toTimestamp - fromTimestamp) / MAX_RETURN_BLOCKS)
      ) {
        data.push({
          block_number: undefined,
          base_fee_per_gas: undefined,
          timestamp: toTimestamp,
        });
      }
    }

    const sortedDataAgain = data.sort((a, b) => a.timestamp - b.timestamp);
    if (sortedDataAgain.length <= 8) {
      const midpoint =
        (Number(sortedDataAgain[0].timestamp) +
          Number(sortedDataAgain[sortedDataAgain.length - 1].timestamp)) /
        2;
      sortedDataAgain.push({
        timestamp: midpoint,
      });
    }
    const finalData = sortedDataAgain.sort((a, b) => a.timestamp - b.timestamp);

    return NextResponse.json(finalData, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching data", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.FOSSIL_DB_URL ?? "Error",
      },
      { status: 500 },
    );
  }
}
