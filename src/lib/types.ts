import { Account, CairoCustomEnum } from "starknet";

export type FossilParams = {
  targetTimestamp: number | undefined;
  roundDuration: number | undefined;
  clientAddress: string | undefined;
  vaultAddress: string | undefined;
};

export type DepositArgs = {
  beneficiary: string;
  amount: number | bigint;
};

export type WithdrawLiquidityArgs = {
  amount: number | bigint;
};

export type QueueArgs = { bps: number | bigint };

export type CollectArgs = { account: string };

export type ApprovalArgs = {
  amount: number | bigint;
  spender: string;
};

export type TransactionResult = {
  transaction_hash: string;
};

export enum RoundState {
  Open = 0, // Accepting deposits, waiting for auction to start
  Auctioning = 1, // Auction is on going, accepting bids
  Running = 2, // Auction has ended, waiting for option round expiry date to settle
  Settled = 3,
}

export const RoundStateLabels: { [key in RoundState]: string } = {
  [RoundState.Open]: "Open",
  [RoundState.Auctioning]: "Auctioning",
  [RoundState.Running]: "Running",
  [RoundState.Settled]: "Settled",
};

export type VaultStateType = {
  address: string;
  vaultType: string;
  alpha: number | bigint | string;
  strikeLevel: number | bigint | string;
  ethAddress: string;
  fossilClientAddress: string;
  currentRoundId: number | bigint | string;
  lockedBalance: number | bigint | string;
  unlockedBalance: number | bigint | string;
  stashedBalance: number | bigint | string;
  queuedBps: number | bigint | string;
  now: number | bigint | string;
  deploymentDate: string;
};

export type LiquidityProviderStateType = {
  address: string;
  lockedBalance: number | bigint | string;
  unlockedBalance: number | bigint | string;
  stashedBalance: number | bigint | string;
  queuedBps: number | bigint | string;
};

export type OptionBuyerStateType = {
  address: string;
  bids: string[]|Bid[];
  roundAddress: string;
  mintableOptions: bigint | number | string;
  refundableOptions: bigint | number | string;
  totalOptions: bigint | number | string;
  payoutBalance: bigint | number | string;
};

export type VaultActionsType = {
  depositLiquidity: (depositArgs: DepositArgs) => Promise<void>;
  withdrawLiquidity: (withdrawArgs: WithdrawLiquidityArgs) => Promise<void>;
  withdrawStash: (collectArgs: CollectArgs) => Promise<void>;
  queueWithdrawal: (queueArgs: QueueArgs) => Promise<void>;
  startAuction: () => Promise<void>;
  endAuction: () => Promise<void>;
  settleOptionRound: () => Promise<void>;
};

export type OptionRoundStateType = {
  address: string | undefined;
  vaultAddress: string;
  roundId: bigint | number | string;
  roundState: string;
  deploymentDate: string | number | bigint;
  auctionStartDate: string | number | bigint;
  auctionEndDate: string | number | bigint;
  optionSettleDate: string | number | bigint;
  startingLiquidity?: bigint | number | string;
  soldLiquidity: bigint | number | string;
  unsoldLiquidity: bigint | number | string;
  reservePrice: bigint | number | string;
  strikePrice: bigint | number | string;
  capLevel: bigint | number | string;
  availableOptions: bigint | number | string;
  optionSold: bigint | number | string;
  clearingPrice: bigint | number | string;
  premiums: bigint | number | string;
  settlementPrice: bigint | number | string;
  optionsSold: bigint | number | string;
  totalPayout: bigint | number | string;
  payoutPerOption: bigint | number | string;
  treeNonce: bigint | number | string;
  performanceLP: string;
  performanceOB: string;
  //queuedLiquidity?: bigint | number | string;
};

export type Bid = {
  address: string; //owner ?
  roundAddress: string;
  bidId: string;
  treeNonce: string;
  amount: bigint | number | string;
  price: bigint | number | string;
};

export interface VaultDetailsProps {
  vaultAddress: string;
  status: RoundState;
  alpha: number;
  strike: number;
  strike_level: number;
  tvl: number;
  round: number;
  timeLeft?: string;
  capLevel: number;
  roundID: number;
  type: string;
  fees: number;
  apy?: number;
  pnl?: number;
  lastRoundPerf: number;
  currRoundPerf?: number;
  actions: string;
  deploymentDate: string | number | bigint;
  auctionStartDate: string | number | bigint;
  auctionEndDate: string | number | bigint;
  optionSettleDate?: string | number | bigint;
}

export type OptionRoundActionsType = {
  placeBid: (placeBids: PlaceBidArgs) => Promise<void>;
  updateBid: (updateBid: UpdateBidArgs) => Promise<void>;
  refundUnusedBids: (refundBids: RefundBidsArgs) => Promise<void>;
  tokenizeOptions: () => Promise<void>;
  exerciseOptions: () => Promise<void>;
};

export type UpdateBidArgs = {
  bidId: string;
  priceIncrease: number | bigint;
};
export type PlaceBidArgs = {
  amount: number | bigint;
  price: number | bigint;
};
export type RefundableBidsArgs = {
  optionBuyer: string;
};
export type RefundBidsArgs = {
  optionBuyer: string;
};

export interface InfoItemProps {
  label: string;
  value: React.ReactNode;
  isPending?: boolean;
}

export interface BalanceTooltipProps {
  balance: {
    locked: string;
    unlocked: string;
    stashed: string;
  };
}

export enum CommonTabs {
  MyInfo = "My Info",
}

export enum ProviderTabs {
  Deposit = "Deposit",
  Withdraw = "Withdraw",
}

export enum BuyerTabs {
  PlaceBid = "Place Bid",
  History = "History",
  Refund = "Refund",
  Mint = "Mint",
  Exercise = "Exercise",
}

export enum WithdrawSubTabs {
  Liquidity = "Liquidity",
  Queue = "Queue",
  Collect = "Collect",
}

// Define a type for the user role
export enum VaultUserRole {
  Provider = "Provider",
  Buyer = "Buyer",
}

// Define a discriminated union for tabs based on user role
export type TabType =
  | { role: VaultUserRole.Provider; tab: ProviderTabs | CommonTabs }
  | {
      role: VaultUserRole.Buyer;
      tab: BuyerTabs | CommonTabs;
      state: RoundState;
    };

export interface TabsProps {
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
