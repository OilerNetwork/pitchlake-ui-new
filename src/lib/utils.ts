export const shortenString = (str: string) => {
  return str.substring(0, 6) + "..." + str.substring(str.length - 4);
};

export const copyToClipboard = (text: string) =>
  navigator.clipboard.writeText(text);

export const stringToHex = (decimalString?: string) => {
  if (!decimalString) return "";
  decimalString = String(decimalString);

  const num = BigInt(decimalString);

  return `0x${num.toString(16)}`;
};

// Utility function to format the number
export const formatNumberText = (number: number) => {
  if (number < 100_000) {
    return number.toLocaleString(); // Return raw number with commas
  } else if (number >= 100_000 && number < 1_000_000) {
    return `${(number / 1_000).toFixed(2)}k`; // Format as '123.45k'
  } else if (number >= 1_000_000 && number < 1_000_000_000) {
    return `${(number / 1_000_000).toFixed(2)}m`; // Format as '123.45m'
  } else {
    return `${(number / 1_000_000_000).toFixed(2)}b`; // Optional for larger numbers like '123.45b'
  }
};

export const timeFromNow = (timestamp: string) => {
  const now = new Date();
  const targetDate = new Date(Number(timestamp) * 1000);

  // Calculate the difference in milliseconds
  const diffInMs = now.getTime() - targetDate.getTime();

  // Convert milliseconds to meaningful units
  const msInDay = 24 * 60 * 60 * 1000;
  const msInHour = 60 * 60 * 1000;
  const msInMinute = 60 * 1000;

  const days = Math.floor(diffInMs / msInDay);
  const hours = Math.floor((diffInMs % msInDay) / msInHour);
  const minutes = Math.floor((diffInMs % msInHour) / msInMinute);

  return `${diffInMs > 0 ? "-" : ""}${days}d ${hours}h ${minutes}m`;
};

import { Connector } from "@starknet-react/core";
import { Account, ec, Provider } from "starknet";
