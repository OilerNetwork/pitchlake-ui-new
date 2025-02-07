import demoRoundData from "@/lib/demo/demo-round-data.json"; // Ensure `raw` is correctly imported

export interface DemoRoundDataType {
  roundId: number;
  roundAddress: string;
  capLevel: string;
  strikePrice: string;
  deploymentDate: string;
  auctionStartDate: string;
  auctionEndDate: string;
  optionSettleDate: string;
}

export function getDemoRoundData(roundId: number): DemoRoundDataType {
  // Get the normalized round ID
  const demoRoundId: number = getDemoRoundId(roundId);

  // Find the corresponding round data
  const roundData = demoRoundData.find((data) => data.roundId === demoRoundId);

  if (!roundData) {
    throw new Error(`No demo data found for round id ${demoRoundId}`);
  }

  return roundData;
}

export function getDemoRoundId(roundId: number): number {
  const id = roundId >= 1 ? roundId : 1;
  return ((id - 1) % 4) + 1; // Cycles through 1-4
}
