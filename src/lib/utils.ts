import { poseidonHashSingle } from "@scure/starknet";
import { bytesToNumberBE } from "@noble/curves/abstract/utils";
import { OptionRoundStateType, FossilParams } from "@/lib/types";
import { num } from "starknet";

export const createJobRequestParams = (
  targetTimestamp: number,
  roundDuration: number,
) => {
  return {
    // TWAP duration is 1 x round duration
    twap: [targetTimestamp - roundDuration, targetTimestamp],
    // Volatility duration is 3 x round duration
    volatility: [targetTimestamp - 3 * roundDuration, targetTimestamp],
    // Reserve price duration is 3 x round duration
    reserve_price: [targetTimestamp - 3 * roundDuration, targetTimestamp],
  };
};

export const createJobRequest = ({
  targetTimestamp,
  roundDuration,
  clientAddress,
  vaultAddress,
}: FossilParams): any => {
  if (!targetTimestamp || !roundDuration || !clientAddress || !vaultAddress)
    return;

  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "<REPLACE_ME>",
    },
    body: JSON.stringify({
      identifiers: ["PITCH_LAKE_V1"],
      params: createJobRequestParams(targetTimestamp, roundDuration),
      client_info: {
        client_address: clientAddress,
        vault_address: vaultAddress,
        timestamp: targetTimestamp,
      },
    }),
  };
};

export const createJobId = (
  targetTimestamp: number,
  roundDuration: number,
): string => {
  if (!targetTimestamp || !roundDuration) return "";

  const identifiers = ["PITCH_LAKE_V1"];
  const params = createJobRequestParams(targetTimestamp, roundDuration);

  const input = [
    ...identifiers,
    params.twap[0],
    params.twap[1],
    params.volatility[0],
    params.volatility[1],
    params.reserve_price[0],
    params.reserve_price[1],
  ].join("");

  const bytes: Buffer = Buffer.from(input, "utf-8");
  const asNum = bytesToNumberBE(bytes);

  const hashResult = poseidonHashSingle(asNum);
  return hashResult.toString();
};

export const getTargetTimestampForRound = (
  roundState: OptionRoundStateType | undefined,
): number => {
  if (
    !roundState ||
    !roundState.roundId ||
    !roundState.roundState ||
    !roundState.deploymentDate ||
    !roundState.optionSettleDate
  )
    return 0;

  const state = roundState.roundState.toString();
  const roundId = roundState.roundId.toString();
  const targetTimestamp = Number(
    state === "Open" && roundId === "1"
      ? roundState.deploymentDate
      : roundState.optionSettleDate,
  );

  return Number(targetTimestamp);
};

export const getDurationForRound = (
  roundState: OptionRoundStateType | undefined,
): number => {
  if (!roundState || !roundState.auctionEndDate || !roundState.optionSettleDate)
    return 0;

  let high = Number(roundState.optionSettleDate);
  let low = Number(roundState.auctionEndDate);
  return Number(high - low);
};

export const getPerformanceLP = (
  soldLiquidity: bigint | string | number,
  premiums: bigint | string | number,
  totalPayout: bigint | string | number,
) => {
  const soldLiq = soldLiquidity
    ? num.toBigInt(soldLiquidity.toString())
    : num.toBigInt(0);
  const prem = premiums ? num.toBigInt(premiums.toString()) : num.toBigInt(0);
  const payout = totalPayout
    ? num.toBigInt(totalPayout.toString())
    : num.toBigInt(0);

  if (soldLiq === num.toBigInt(0)) return 0;

  const gainLoss = prem - payout;
  const percentage = Number((Number(gainLoss / soldLiq) * 100).toFixed(2));

  const sign = percentage > 0 ? "+" : "";
  return `${sign}${percentage}`;
};

export const getPerformanceOB = (
  premiums: bigint | string | number,
  totalPayout: bigint | string | number,
) => {
  const prem = premiums ? BigInt(premiums.toString()) : BigInt(0);
  const payout = totalPayout ? BigInt(totalPayout.toString()) : BigInt(0);

  if (prem == BigInt(0)) {
    return 0;
  } else {
    const gainLoss = payout - prem;
    const percentage = Number((Number(gainLoss / prem) * 100).toFixed(2));

    const sign = percentage > 0 ? "+" : "";
    return `${sign}${percentage}`;
  }
};

export const getLocalStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    console.log("Error getting from localStorage", error);
    return "";
  }
};

export const shortenString = (str: string) => {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
};

export const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text);

export const stringToHex = (decimalString?: string): string => {
  if (!decimalString) return "";
  const num = BigInt(decimalString.toString());

  return `0x${num.toString(16)}`;
};

// Utility function to format the number
export const formatNumberText = (number: number) => {
  if (number < 100_000) {
    return number.toLocaleString(); // Return raw number with commas
  } else if (number >= 100_000 && number < 1_000_000) {
    return `${(number / 1_000).toFixed(1)}k`; // Format as '123.45k'
  } else if (number >= 1_000_000 && number < 1_000_000_000) {
    return `${(number / 1_000_000).toFixed(1)}m`; // Format as '123.45m'
  } else {
    return `${(number / 1_000_000_000).toFixed(1)}b`; // Optional for larger numbers like '123.45b'
  }
};

export const timeFromNow = (timestamp: string) => {
  const now = new Date().getTime() / 1000;
  return timeUntilTarget(now.toString(), timestamp);
};

export const timeUntilTarget = (timestamp: string, target: string) => {
  const timestampDate = new Date(Number(timestamp) * 1000);
  const targetDate = new Date(Number(target) * 1000);

  // Calculate the difference in milliseconds
  const diffInMs = targetDate.getTime() - timestampDate.getTime();
  const sign = diffInMs < 0 ? "-" : "";
  const diffInMsAbs = Math.abs(diffInMs);

  // Convert milliseconds to meaningful units
  const msInDay = 24 * 60 * 60 * 1000;
  const msInHour = 60 * 60 * 1000;
  const msInMinute = 60 * 1000;
  const msInSecond = 1000;

  const days = Math.floor(diffInMsAbs / msInDay);
  const hours = Math.floor((diffInMsAbs % msInDay) / msInHour);
  const minutes = Math.floor((diffInMsAbs % msInHour) / msInMinute);
  const seconds = Math.floor((diffInMsAbs % msInMinute) / msInSecond);

  let str = `${sign}`;
  str += days > 0 ? `${days}d ` : "";
  str += hours > 0 ? `${hours}h ` : "";
  str += minutes > 0 ? `${minutes}m ` : "";
  if ((days === 0 && sign === "") || (sign === "-" && days === 0 && hours <= 2))
    str += `${seconds}s `;

  return str;
};

export const timeUntilTargetFormal = (timestamp: string, target: string) => {
  const timestampDate = new Date(Number(timestamp) * 1000);
  const targetDate = new Date(Number(target) * 1000);

  // Calculate the difference in milliseconds
  const diffInMs = targetDate.getTime() - timestampDate.getTime();
  const sign = diffInMs < 0 ? "-" : "";
  const diffInMsAbs = Math.abs(diffInMs);

  // Convert milliseconds to meaningful units
  const msInDay = 24 * 60 * 60 * 1000;
  const msInHour = 60 * 60 * 1000;
  const msInMinute = 60 * 1000;
  const msInSecond = 1000;

  const days = Math.floor(diffInMsAbs / msInDay);
  const hours = Math.floor((diffInMsAbs % msInDay) / msInHour);
  const minutes = Math.floor((diffInMsAbs % msInHour) / msInMinute);
  const seconds = Math.floor((diffInMsAbs % msInMinute) / msInSecond);

  let str = `${sign}`;
  str += days > 0 ? `${days} ${days === 1 ? "Day" : "Days"} ` : "";
  str += hours > 0 ? `${hours} ${hours === 1 ? "Hour" : "Hours"} ` : "";
  str +=
    minutes > 0 ? `${minutes} ${minutes === 1 ? "Minute" : "Minutes"} ` : "";

  if (
    (days === 0 && sign === "" && seconds > 0) ||
    (sign === "-" && days === 0 && hours <= 2)
  )
    str += `${seconds} ${seconds === 1 ? "Second" : "Seconds"}`;

  return str;
};

///   function generateMockData(
///     startDate: string,
///     itemCount: number,
///     stepInSeconds: number,
///   ) {
///     const data = [];
///     const start = new Date(startDate);
///     start.setSeconds(0, 0); // Ensure the date starts at the beginning of the minute
///
///     let previousBaseFee: number | null = null;
///
///     const baseFeeMin = 2;
///     const baseFeeMax = 60;
///
///     for (let i = 0; i < itemCount; i++) {
///       const currentTime = new Date(start.getTime() + i * stepInSeconds * 1000); // Add stepInSeconds seconds
///
///       // Get Unix timestamp in seconds
///       const timestamp = Math.floor(currentTime.getTime() / 1000);
///
///       // BaseFee target with seasonality
///       const baseFeeTarget = 30 + 10 * Math.sin((2 * Math.PI * i) / itemCount); // Seasonality between 20 and 40 gwei
///
///       // BASEFEE calculation
///       let baseFee: number;
///       if (previousBaseFee === null) {
///         baseFee = 15; // Starting BASEFEE
///       } else {
///         // Calculate drift towards target
///         const drift = (baseFeeTarget - previousBaseFee) * 0.05; // 5% of the distance to target
///
///         // Random noise, ±12.5% of previousBaseFee
///         const randomFactor = getRandomNumber(0.875, 1.125);
///
///         baseFee = previousBaseFee * randomFactor + drift;
///
///         // Introduce upward bias if baseFee is too low
///         if (baseFee < 5) {
///           baseFee += getRandomNumber(1, 3); // Add 1 to 3 gwei
///         }
///
///         // Introduce downward bias if baseFee is too high
///         if (baseFee > 55) {
///           baseFee -= getRandomNumber(1, 3); // Subtract 1 to 3 gwei
///         }
///
///         // Ensure baseFee stays within bounds
///         if (baseFee < baseFeeMin) {
///           baseFee = baseFeeMin;
///         } else if (baseFee > baseFeeMax) {
///           baseFee = baseFeeMax;
///         }
///       }
///
///       baseFee = parseFloat(baseFee.toFixed(2));
///
///       // TWAP calculation
///       const TWAP = baseFee + getRandomNumber(-1, 1); // Slight variation
///       const twapValue = parseFloat(TWAP.toFixed(2));
///
///       // Add the data point
///       data.push({
///         timestamp,
///         BASEFEE: baseFee,
///         TWAP: twapValue,
///       });
///
///       // Update previousBaseFee for the next iteration
///       previousBaseFee = baseFee;
///     }
///
///     return data;
///   }
///
///   // Helper function to generate a random number between min and max
///   function getRandomNumber(min: number, max: number): number {
///     return Math.random() * (max - min) + min;
///   }
///
///   const mockData = generateMockData("2024-11-21T01:11:00Z", 10000, 20); // 20 seconds x 10000 steps ~ 2 days
///   console.log(JSON.stringify(mockData, null, 2));
