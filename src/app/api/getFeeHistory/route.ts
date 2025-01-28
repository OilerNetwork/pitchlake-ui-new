/// oldd
//import { ethers, formatUnits, toNumber, AlchemyProvider } from "ethers";
//import { NextResponse } from "next/server";
//
//interface FeeHistoryRequestPayload {
//  id: number;
//  jsonrpc: string;
//  method: string;
//  params: [number | string, number | string, number[]];
//}
//
//interface BlockByNumberRequestPayload {
//  id: number;
//  jsonrpc: string;
//  method: string;
//  params: [number | string, boolean];
//}
//
//interface FeeHistoryResult {
//  oldestBlock: string;
//  baseFeePerGas: string[];
//  gasUsedRatio: number[];
//  reward: string[][];
//}
//
//interface FeeHistoryResponse {
//  id: number;
//  jsonrpc: string;
//  result: FeeHistoryResult;
//}
//
//const unconfirmedBlockCount = 100;
//
//function createAlchemyRequest_feeHistory(): RequestInit {
//  const payload: FeeHistoryRequestPayload = {
//    id: 1,
//    jsonrpc: "2.0",
//    method: "eth_feeHistory",
//    params: [unconfirmedBlockCount, "latest", []],
//  };
//
//  return {
//    method: "POST",
//    headers: {
//      Accept: "application/json",
//      "Content-Type": "application/json",
//    },
//    body: JSON.stringify(payload),
//  };
//}
//
//function createAlchemyRequest_blockByNumber(
//  blockNumber: string | number,
//): RequestInit {
//  const payload: BlockByNumberRequestPayload = {
//    id: 1,
//    jsonrpc: "2.0",
//    method: "eth_getBlockByNumber",
//    params: [blockNumber, false],
//  };
//
//  return {
//    method: "POST",
//    headers: {
//      Accept: "application/json",
//      "Content-Type": "application/json",
//    },
//    body: JSON.stringify(payload),
//  };
//}
//
//export async function POST() {
//  const alchemyApiUrl = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`;
//
//  try {
//    const alchemyRequestOptions = createAlchemyRequest_feeHistory();
//    const alchemyResponse = await fetch(alchemyApiUrl, alchemyRequestOptions);
//
//    if (!alchemyResponse.ok) {
//      const errorText = await alchemyResponse.text();
//      console.error("Alchemy API Error:", errorText);
//      return NextResponse.json(
//        { error: "Failed to fetch fee history from Alchemy" },
//        { status: alchemyResponse.status },
//      );
//    }
//
//    const data: FeeHistoryResponse = await alchemyResponse.json();
//
//    const { oldestBlock, baseFeePerGas } = data.result;
//    let blockData: any = [];
//
//    const alchemyRequestOptionsBlock =
//      createAlchemyRequest_blockByNumber(oldestBlock);
//    const alchemyResponseBlock = await fetch(
//      alchemyApiUrl,
//      alchemyRequestOptionsBlock,
//    );
//
//    if (!alchemyResponseBlock.ok) {
//      const errorText = await alchemyResponseBlock.text();
//      console.error("Alchemy API Error:", errorText);
//      return NextResponse.json(
//        { error: "Failed to fetch block data from Alchemy" },
//        { status: alchemyResponseBlock.status },
//      );
//    }
//
//    const data2 = await alchemyResponseBlock.json();
//    const timestamp = toNumber(data2.result.timestamp);
//
//    baseFeePerGas.forEach((fee: string, index: number) => {
//      blockData.push({
//        basefee: formatUnits(fee, "gwei"),
//        block_number: toNumber(oldestBlock) + index,
//        timestamp: timestamp + 12 * index,
//      });
//    });
//
//    return NextResponse.json(blockData);
//  } catch (error: any) {
//    console.error("Error processing fee history request:", error);
//    return NextResponse.json(
//      { error: "Internal Server Error" },
//      { status: 500 },
//    );
//  }
//}
