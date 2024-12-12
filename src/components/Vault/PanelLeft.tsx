"use client";
import React, { useState } from "react";
import { LayerStackIcon, SafeIcon } from "@/components/Icons";
import { timeUntilTarget, shortenString, formatNumberText } from "@/lib/utils";
import { formatUnits, formatEther } from "ethers";
import { useProtocolContext } from "@/context/ProtocolProvider";
import StateTransitionConfirmationModal from "@/components/Vault/Utils/StateTransitionConfirmationModal";
import {
  ChevronUp,
  ChevronDown,
  SquareArrowOutUpRight,
  Info,
  PanelLeft as IconPanelLeft,
} from "lucide-react";
import { useExplorer } from "@starknet-react/core";
import { BalanceTooltip } from "@/components/BaseComponents/Tooltip";
import StateTransition from "@/components/Vault/StateTransition";
import { useProvider } from "@starknet-react/core";
import useLatestTimestamp from "@/hooks/chain/useLatestTimestamp";

const FOSSIL_DELAY = 15 * 60;

// comment for git
const PanelLeft = ({ userType }: { userType: string }) => {
  const { vaultState, selectedRoundState, timestamp } = useProtocolContext();
  const [vaultIsOpen, setVaultIsOpen] = useState<boolean>(false);
  const [optionRoundIsOpen, setOptionRoundIsOpen] = useState<boolean>(false);
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);
  const [modalState, setModalState] = useState<{
    show: boolean;
    action: string;
    onConfirm: () => Promise<void>;
  }>({
    show: false,
    action: "",
    onConfirm: async () => {},
  });

  const { provider } = useProvider();
  const explorer = useExplorer();

  const hideModal = () => {
    setModalState({
      show: false,
      action: "",
      onConfirm: async () => {},
    });
  };

  const handleConfirm = async () => {
    await modalState.onConfirm();
  };

  const getStateActionHeader = () => {
    const round = selectedRoundState
      ? selectedRoundState
      : { optionSettleDate: "0" };

    const roundState = selectedRoundState?.roundState
      ? selectedRoundState.roundState
      : "Open";

    if (roundState === "Open") return "Auction Starts In";
    if (roundState === "Auctioning") return "Auction Ends In";
    if (roundState === "Running") {
      let settlementDate = Number(round.optionSettleDate);
      if (timestamp < settlementDate) return "Round Ends In";
      else if (timestamp < settlementDate + FOSSIL_DELAY)
        return "Fossil Ready In";
      else return "Round Ended";
    }
    if (roundState === "Settled") return "Round Ended";
  };

  const getTimeUntilNextStateTransition = () => {
    const round = selectedRoundState
      ? selectedRoundState
      : { auctionStartDate: "0", auctionEndDate: "0", optionSettleDate: "0" };
    const roundState = selectedRoundState?.roundState
      ? selectedRoundState.roundState
      : "Open";

    let targetDate: string | number | bigint = "0";

    if (roundState === "Open") targetDate = round.auctionStartDate;
    if (roundState === "Auctioning") targetDate = round.auctionEndDate;
    if (roundState === "Running") {
      let settlementDate = Number(round.optionSettleDate);
      if (timestamp < settlementDate) targetDate = settlementDate;
      else if (timestamp < settlementDate + FOSSIL_DELAY)
        targetDate = settlementDate + FOSSIL_DELAY;
      else targetDate = settlementDate;
    }
    if (roundState === "Settled") targetDate = round.optionSettleDate;

    targetDate = targetDate ? targetDate : "0";
    return Number(timestamp) !== 0 && Number(targetDate) !== 0
      ? timeUntilTarget(Number(timestamp).toString(), targetDate.toString())
      : "Loading...";
  };

  const stateStyles: any = {
    Open: {
      bg: "bg-[#214C0B80]",
      text: "text-[#6AB942]",
      border: "border-[#347912]",
    },
    Auctioning: {
      bg: "bg-[#45454580]",
      text: "text-[#FAFAFA]",
      border: "border-[#BFBFBF]",
    },
    Running: {
      bg: "bg-[#6D1D0D59]",
      text: "text-[#F78771]",
      border: "border-[#F78771]",
    },
    Settled: {
      bg: "bg-[#CC455E33]",
      text: "text-[#DA718C]",
      border: "border-[#CC455E]",
    },
    Loading: {
      bg: "bg-[#6D1D0D59]",
      text: "text-[#F78771]",
      border: "border-[#F78771]",
    },
    Default: {
      bg: "bg-[#CC455E33]",
      text: "text-[#CC455E]",
      border: "border-[#CC455E]",
    },
  };
  const roundState = selectedRoundState?.roundState.toString() || "Loading";
  const styles = stateStyles[roundState] || stateStyles.Default;

  return (
    <>
      <div
        className={`flex flex-col mr-4 max-w-[350px] transition-all duration-300 max-h-[834px] overflow-hidden ${
          isPanelOpen ? "w-full" : "w-[110px]"
        } ${!isPanelOpen ? "" : ""}`}
      >
        <div className="flex items-center align-center text-[14px] bg-black-alt border-[1px] border-greyscale-800 items-start rounded-lg w-full flex flex-col flex-grow h-full max-h-full">
          <div
            onClick={() => {
              if (isPanelOpen) {
                setIsPanelOpen(false);
                setVaultIsOpen(false);
                setOptionRoundIsOpen(false);
              } else {
                setIsPanelOpen(true);
                setVaultIsOpen(true);
                setOptionRoundIsOpen(true);
              }
            }}
            className="flex items-center h-[56px] w-full border-b-1 p-4 border-white cursor-pointer"
          >
            <div
              className={`flex flex-row w-full items-center rounded-md px-2 hover:cursor-pointer ${
                isPanelOpen ? "justify-between" : "justify-center"
              }`}
            >
              <p
                className={`${
                  isPanelOpen ? "flex" : "hidden"
                } font-medium flex items-center`}
              >
                Statistics
              </p>
              <div className="w-[20px] h-[20px]">
                <IconPanelLeft
                  className="w-[20px] h-[20px] stroke-[1px] hover-zoom"
                  stroke="var(--buttonwhite)"
                />
              </div>
            </div>
          </div>
          <div
            className={`flex flex-col w-full px-3 border-t-[1px] border-greyscale-800`}
          >
            <div
              onClick={() => {
                if (isPanelOpen) {
                  setVaultIsOpen((state) => !state);
                } else {
                  setIsPanelOpen(true);
                  setVaultIsOpen(true);
                  setOptionRoundIsOpen(false);
                }
              }}
              className={`flex flex-row w-full mt-3 rounded-md p-3 ${
                isPanelOpen
                  ? "justify-between bg-faded-black"
                  : "justify-center"
              } cursor-pointer`}
            >
              <div>
                <SafeIcon
                  fill="none"
                  stroke="var(--buttongrey)"
                  classname="w-6 h-6 text-primary-800 hover-zoom"
                />
              </div>
              <div
                className={`${isPanelOpen ? "flex" : "hidden"} flex-row w-full`}
              >
                <div className="ml-2 text-white w-fit text-nowrap font-[] font-regular">
                  Vault
                </div>
                <div className="flex flex-row-reverse w-full">
                  {vaultIsOpen ? (
                    <ChevronDown stroke="var(--buttonwhite)" />
                  ) : (
                    <ChevronUp stroke="var(--buttonwhite)" />
                  )}
                </div>
              </div>
            </div>
            <div
              className={`flex flex-col mt-2 overflow-scroll no-scrollbar gap-1 ${
                isPanelOpen ? "" : "hidden"
              } ${
                !vaultIsOpen
                  ? "h-[0]"
                  : !optionRoundIsOpen
                    ? "h-[215px]"
                    : "h-[215px]"
              } transition-all duration-900ms `}
            >
              <div className="flex flex-row justify-between p-2 w-full">
                <p className="text-[#BFBFBF]">Run Time</p>
                <p>
                  {selectedRoundState?.auctionEndDate &&
                  selectedRoundState?.optionSettleDate &&
                  selectedRoundState.auctionEndDate !== "0" &&
                  selectedRoundState.optionSettleDate !== "0"
                    ? timeUntilTarget(
                        selectedRoundState.auctionEndDate.toString(),
                        selectedRoundState.optionSettleDate.toString(),
                      )
                    : "Loading..."}
                </p>
              </div>
              <div className="flex flex-row justify-between p-2 w-full">
                <p className="text-[#BFBFBF]">Address</p>
                <a
                  href={explorer.contract(
                    vaultState?.address ? vaultState.address : "",
                  )}
                  target="_blank"
                  className="flex flex-row justify-center items-center text-[#F5EBB8] cursor-pointer gap-[4px]"
                >
                  <p className="">
                    {
                      vaultState?.address && vaultState?.address !== "0x"
                        ? shortenString(vaultState?.address)
                        : "Loading..."
                      //Add vault address short string from state here
                    }
                  </p>
                  <SquareArrowOutUpRight size={16} />
                </a>
              </div>
              {
                //   <div className="flex flex-row justify-between p-2 w-full">
                //     <p className="text-[#BFBFBF] font-regular">Fees</p>
                //     <p>0%</p>
                //   </div>
              }
              {
                // <div className="flex flex-row justify-between p-2 w-full">
                //   <p className="text-[#BFBFBF]">TVL</p>
                //   <p>
                //     {vaultState
                //       ? parseFloat(
                //           formatEther(
                //             (
                //               num.toBigInt(vaultState.lockedBalance.toString()) +
                //               num.toBigInt(
                //                 vaultState.unlockedBalance.toString(),
                //               ) +
                //               num.toBigInt(vaultState.stashedBalance.toString())
                //             ).toString(),
                //           ),
                //         ).toFixed(0)
                //       : 0}
                //     /1,000 ETH
                //   </p>
                // </div>
              }
              {
                //  <div className="flex flex-row justify-between p-2 w-full">
                //    <p className="text-[#BFBFBF] font-regular">APY</p>
                //    <p>12.34%</p>
                //  </div>
              }
              <div className="flex flex-row justify-between p-2 w-full z-50">
                <p className="text-[#BFBFBF] font-regular">Balance</p>
                <div className="flex flex-row items-center gap-1 overflow-visable">
                  <BalanceTooltip
                    balance={{
                      locked: vaultState
                        ? vaultState.lockedBalance.toString()
                        : "0",
                      unlocked: vaultState
                        ? vaultState.unlockedBalance.toString()
                        : "0",
                      stashed: vaultState
                        ? vaultState.stashedBalance.toString()
                        : "0",
                    }}
                  >
                    {
                      <>
                        <p>
                          {vaultState
                            ? Number(
                                formatEther(
                                  BigInt(vaultState.lockedBalance) +
                                    BigInt(vaultState.unlockedBalance) +
                                    BigInt(vaultState.stashedBalance),
                                ),
                              ).toFixed(2)
                            : 0}{" "}
                          ETH
                        </p>
                        <Info
                          size={16}
                          color="#CFC490"
                          className="cursor-pointer"
                        />
                      </>
                    }
                  </BalanceTooltip>
                </div>
              </div>

              <div className="flex flex-row justify-between p-2 w-full">
                <p className="text-[#BFBFBF] font-regular">Risk Level</p>
                <p>
                  {vaultState?.alpha && vaultState.alpha !== "0"
                    ? `${Number(vaultState?.alpha) / 100}%`
                    : "Loading..."}
                </p>
              </div>
              <div className="flex flex-row justify-between p-2 w-full">
                <p className="text-[#BFBFBF] font-regular">Strike Level</p>
                <p>{Number(vaultState?.strikeLevel) / 100}%</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full px-3 border-t-[1px] border-greyscale-800">
            <div
              onClick={() => {
                if (isPanelOpen) {
                  setOptionRoundIsOpen((state) => !state);
                } else {
                  setIsPanelOpen(true);
                  setOptionRoundIsOpen(true);
                  setVaultIsOpen(false);
                }
              }}
              className={`flex flex-row w-full mt-3 rounded-md p-3 ${
                isPanelOpen
                  ? "justify-between bg-faded-black"
                  : "justify-center"
              } cursor-pointer`}
            >
              <div>
                <LayerStackIcon
                  classname="w-6 h-6 hover-zoom"
                  fill="none"
                  stroke="var(--buttongrey)"
                />
              </div>
              <div
                className={`${isPanelOpen ? "flex" : "hidden"} flex-row w-full`}
              >
                <div className="ml-2 text-white w-fit text-nowrap font-regular">
                  Round
                </div>

                <div className="flex flex-row-reverse w-full">
                  {optionRoundIsOpen ? (
                    <ChevronDown stroke="var(--buttonwhite)" />
                  ) : (
                    <ChevronUp stroke="var(--buttonwhite)" />
                  )}
                </div>
              </div>
            </div>
            <div
              className={`flex flex-col mt-2 overflow-scroll no-scrollbar ${
                isPanelOpen ? "" : "hidden"
              } ${
                !optionRoundIsOpen
                  ? "h-0"
                  : !vaultIsOpen
                    ? "h-[475px]"
                    : selectedRoundState?.roundState === "Settled"
                      ? "h-[335px]"
                      : "h-[315px]"
              } transition-all duration-900 max-h-full`}
            >
              <div className="max-h-full flex flex-row justify-between items-center p-2 w-full">
                <p className="text-[#BFBFBF]">Selected Round</p>
                {selectedRoundState?.address &&
                selectedRoundState?.roundId &&
                selectedRoundState.address !== "0x0" &&
                selectedRoundState.roundId !== "0" ? (
                  <a
                    href={explorer.contract(
                      selectedRoundState?.address
                        ? selectedRoundState.address
                        : "",
                    )}
                    target="_blank"
                    className="flex flex-row justify-center items-center text-[#F5EBB8] cursor-pointer gap-[4px]"
                  >
                    <p>
                      Round{" "}
                      {selectedRoundState?.roundId
                        ? `${selectedRoundState.roundId.toString().length == 1 ? "0" : ""}${selectedRoundState.roundId}`
                        : ""}
                    </p>
                    <SquareArrowOutUpRight className="size-[16px]" />
                  </a>
                ) : (
                  <a className="flex flex-row justify-center items-center text-[#F5EBB8] cursor-pointer gap-[4px]">
                    <p>Loading... </p>
                  </a>
                )}
              </div>

              <div className="max-h-full flex flex-row justify-between items-center p-2 w-full">
                <p className="text-[#BFBFBF]">State</p>
                <p
                  className={`border-[1px] ${styles.border} ${styles.bg} ${styles.text} font-medium rounded-full px-2 py-[1px]`}
                >
                  {selectedRoundState?.roundState
                    ? selectedRoundState.roundState
                    : "Loading"}
                </p>
              </div>
              {
                ///  (roundState === "Open" || roundState == "Auctioning") && (
                ///  <div className="max-h-full flex flex-row justify-between items-center p-2 w-full">
                ///    <p className="text-[#BFBFBF]">Last Round Perf.</p>
                ///    <div
                ///      onClick={() => {
                ///        console.log("todo: decrement selected round id");
                ///      }}
                ///      className="flex flex-row justify-center items-center text-[#F5EBB8] cursor-pointer gap-[4px]"
                ///    >
                ///      <p className="">+12.34%</p>
                ///      <ArrowRightIcon className="size-[16px]" />
                ///    </div>
                ///  </div>
                ///)
              }
              {roundState === "Settled" && (
                <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                  <p className="text-[#BFBFBF]">Round Perf.</p>
                  <p>
                    {selectedRoundState
                      ? userType == "lp"
                        ? selectedRoundState.performanceLP
                        : selectedRoundState.performanceOB
                      : 0}
                    %
                  </p>
                </div>
              )}

              <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                <p className="text-[#BFBFBF]">Cap Level</p>
                <p>
                  {
                    selectedRoundState?.capLevel &&
                    selectedRoundState.capLevel !== "0"
                      ? `${(
                          (100 *
                            parseInt(selectedRoundState.capLevel.toString())) /
                          10_000
                        ).toFixed(2)}%`
                      : "Loading..." //Add round duration from state here
                  }
                </p>
              </div>
              <div className="max-h-full flex flex-row justify-between items-center p-2 w-full">
                <p className="text-[#BFBFBF]">Strike Price</p>
                <p>
                  {selectedRoundState?.strikePrice &&
                  selectedRoundState.strikePrice !== "0"
                    ? `${Number(
                        formatUnits(
                          selectedRoundState.strikePrice.toString(),
                          "gwei",
                        ),
                      ).toFixed(2)} GWEI`
                    : "Loading..."}
                </p>
              </div>

              {roundState == "Auctioning" && (
                <>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF] font-regular text-[14px]">
                      Reserve Price
                    </p>
                    <p>
                      {
                        selectedRoundState?.reservePrice &&
                          Number(
                            formatUnits(
                              selectedRoundState.reservePrice.toString(),
                              "gwei",
                            ),
                          ).toFixed(2)
                        //Add round duration from state here
                      }{" "}
                      GWEI
                    </p>
                  </div>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Total Options</p>
                    <p>
                      {formatNumberText(
                        selectedRoundState
                          ? Number(
                              selectedRoundState.availableOptions.toString(),
                            )
                          : 0,
                      )}
                    </p>
                  </div>
                </>
              )}

              {roundState == "Running" && (
                <>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Clearing Price</p>
                    <p>
                      {selectedRoundState?.clearingPrice &&
                        Number(
                          formatUnits(
                            selectedRoundState.clearingPrice.toString(),
                            "gwei",
                          ),
                        ).toFixed(2)}{" "}
                      GWEI
                    </p>
                  </div>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Options Sold</p>
                    <p>
                      {formatNumberText(
                        selectedRoundState
                          ? Number(selectedRoundState.optionsSold.toString())
                          : 0,
                      )}
                    </p>
                  </div>
                </>
              )}

              {roundState == "Settled" && (
                <>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Clearing Price</p>
                    <p>
                      {selectedRoundState?.clearingPrice &&
                        Number(
                          formatUnits(
                            selectedRoundState.clearingPrice.toString(),
                            "gwei",
                          ),
                        ).toFixed(2)}{" "}
                      GWEI
                    </p>
                  </div>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Settlement Price</p>
                    <p>
                      {selectedRoundState?.settlementPrice &&
                        Number(
                          formatUnits(
                            selectedRoundState.settlementPrice.toString(),
                            "gwei",
                          ),
                        ).toFixed(2)}{" "}
                      GWEI
                    </p>
                  </div>
                  <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                    <p className="text-[#BFBFBF]">Payout</p>
                    <p>
                      {selectedRoundState?.payoutPerOption &&
                        Number(
                          formatUnits(
                            selectedRoundState.payoutPerOption.toString(),
                            "gwei",
                          ),
                        ).toFixed(2)}{" "}
                      GWEI
                    </p>
                  </div>
                </>
              )}
              <div className="max-h-full flex flex-row justify-between items-center   p-2 w-full">
                <p className="text-[#BFBFBF]">{getStateActionHeader()}</p>
                <p>{getTimeUntilNextStateTransition()}</p>
              </div>
            </div>
          </div>
          <StateTransition
            isPanelOpen={isPanelOpen}
            setModalState={setModalState}
          />
        </div>
      </div>
      {modalState.show && (
        <StateTransitionConfirmationModal
          action={modalState.action}
          onConfirm={handleConfirm}
          onClose={hideModal}
        />
      )}
    </>
  );
};

export default PanelLeft;
