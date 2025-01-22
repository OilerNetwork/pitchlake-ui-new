export const descriptions: Record<string, string> = {
  item1: "This item is XYZ",
  item2: "This item is ABC",
  item3: "More details about item3...",

  // HEADER //
  logo: "Return to the homepage.",
  networkSelector: "Select which network to connect to.",
  helpModeButton: "Toggle help mode.",
  loginButton: "Connect your account.",
  logoutButton: "Disconnect your account.",
  accountDropdown: "Toggle account dropdown.",
  // Account Dropdown
  accountDropdownAddress: "Copy your address to clipboard.",
  accountDropdownBalanceHeader: "Your liquidity.",
  accountDropdownBalance: "Your ETH balance.",
  accountDropdownLocked: "Your total locked balance.",
  accountDropdownUnlocked: "Your total unlocked balance.",
  accountDropdownStashed: "Your total stashed balance.",

  // USER SELECTION //
  userToggleLP: "Switch to liquidity provider view.",
  userToggleOB: "Switch to option buyer view.",

  // LEFT PANEL //
  leftPanelStatisticsBar: "View vault and round stats.",
  leftPanelVaultRunTime: "Duration of each round.",
  leftPanelVaultAddress: "Address of the vault.",
  leftPanelVaultBar: "View vault stats.",
  leftPanelVaultBalance: "The liquidity distribution of the vault.",
  leftPanelVaultAlpha: "The risk level of the vault.",
  leftPanelVaultStrike: "The strike price of the vault.",
  leftPanelRoundBar: "View selected round stats.",
  leftPanelRoundId: "The round's ID.",
  leftPanelRoundState: "The state of the round",
  leftPanelRoundPerf: "The [LP | OB] performance for this round.",
  leftPanelRoundCapLevel:
    "The max percentage above the strike this round will payout.",
  leftPanelRoundStrikePrice: "The strike price for this round.",
  leftPanelRoundReservePrice: "The reserve price for this round.",
  leftPanelRoundTotalOptions: "The total number of options in this auction.",
  leftPanelRoundClearingPrice:
    "The realized price per option from this round's auction",
  leftPanelRoundOptionsSold: "The number of options sold in this round.",
  leftPanelRoundSettlementPrice: "The settlement TWAP for this round.",
  leftPanelRoundPayout: "The payout for this round.",
  leftPanelRoundTime:
    "How much time remains before the round's state can transition.",
  leftPanelStateTransitionButton: "Button to progress the state of the round.",
  leftPanelStateTransitionButton_Open:
    "Button to start the round's auction once the auction start date is reached.",
  leftPanelStateTransitionButton_Auctioning:
    "Button to end the round's auction once the auction end date is reached.",
  leftPanelStateTransitionButton_Running:
    "Button to settle the option round once the settlement date is reached.",

  // CHART //
  chartRoundSelector: "Select which round to view.",
  chartPreviousRound: "View the previous round.",
  chartNextRound: "View the next round.",
  chartHistory: "View this vault's history.",
  chartLineButton_TWAP: "View the TWAP price.",
  chartLineButton_BASEFEE: "View the base fee.",
  chartLineButton_STRIKE: "View the strike price.",
  chartLineButton_CAP_LEVEL: "View the cap level.",

  // LP ACTION TABS //
  // Deposit
  actionTab_Deposit: "Add liquidity to your unlocked balance.",
  "actionTab_For Me": "Deposit for the connected account.",
  "actionTab_For Someone Else": "Deposit for an account not connected.",
  // Withdraw
  actionTab_Withdraw: "Remove liquidity from your unlocked balance.",
  actionTab_Liquidity: "Remove liquidity from your unlocked balance.",
  actionTab_Queue:
    "Queue a percentage of your locked balance to be stashed aside upon round settlement.",
  actionTab_Collect: "Collect your stashed balance.",
  // OB ACTION TABS //
  "actionTab_Place Bid": "Bid for options.",
  actionTab_History: "View your bid history.",
  actionTab_Refund: "Refund your bids that were not collected as premium.",
  actionTab_Mint: "Convert your options into ERC-20 tokens.",
  actionTab_Exercise: "Exercise all of your options for this round.",

  // LP ACTION //
  lpActionLockedBalance: "Your current locked balance.",
  lpActionUnlockedBalance: "Your current unlocked balance.",
  // Deposit
  inputDepositAmount: "Enter the amount of ETH you want to deposit.",
  inputDepositAddress: "Enter the address you are depositting for.",
  depositButton: "Request deposit transaction.",
  // Withdraw
  inputWithdrawalAmount: "Enter the amount of ETH you want to withdraw.",
  withdrawButton: "Request withdraw transaction.",
  // Queue Withdraw
  queueSlider: "Select the percentage of your locked balance to queue.",
  queueButton: "Request withdrawal queue transaction.",
  // Collect Stash
  collectStashbutton: "Request stash collection transaction.",
  // OB ACTION //

  // Place Bid
  inputBidAmount: "Enter the amount of options you are bidding for.",
  inputBidPrice: "Enter the price you are bidding for each option (in GWEI).",
  newBidSummary: "The total cost of this bid.",
  placingBidBalance: "Your current ETH balance.",
  placeBidButton: "Request bid transaction.",
  // Update Bid
  inputUpdateBidAmount:
    "How many options this bid is for. To place bids for additional options, place a new bid.",
  inputUpdateBidPrice:
    "Enter the new price being bid for each option (in GWEI).",
  updateBidSummary: "The total cost to increase this bid.",
  updateBidButton: "Request bid update transaction.",

  // Mint
  mintButton: "Request mint transaction.",
  // Refund
  refundButton: "Request refund transaction.",
  // Exercise
  exerciseButton: "Request exercise transaction.",
};
