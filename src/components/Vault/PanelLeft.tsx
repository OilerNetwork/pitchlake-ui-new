"use client";
import React, { useMemo, useState } from "react";
import { LayerStackIcon, SafeIcon } from "@/components/Icons";
import { timeUntilTarget, shortenString, formatNumberText } from "@/lib/utils";
import { formatUnits, formatEther } from "ethers";
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
import Hoverable from "@/components/BaseComponents/Hoverable";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";
import { getDemoRoundId } from "@/lib/demo/utils";
import { useNewContext } from "@/context/NewProvider";
import NewStateTransition from "./NewStateTransition";

// @NOTE: Replace this with difference between latest fossil block timestamp & now
// - create a useLatestFossilBlockTimestamp hook
const FOSSIL_DELAY =
  process.env.NEXT_PUBLIC_FOSSIL_USE_MOCK_PRICING_DATA === "true" ? 0 : 15 * 60;

const PanelLeft = ({ userType }: { userType: string }) => {
  const { conn } = useNewContext();
  const { vaultState, selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
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

  const RemainingTimeElement = () => {
    if (
      !selectedRoundState ||
      !selectedRoundState.roundState ||
      !selectedRoundState.auctionStartDate ||
      !selectedRoundState.auctionEndDate ||
      !selectedRoundState.optionSettleDate
    )
      return null;

    const { roundState, auctionStartDate, auctionEndDate, optionSettleDate } =
      selectedRoundState;
    const now = new Date();
    const currentTimestamp = now.getTime() / 1000;
    //const currentTimestamp = Number(timestamp);

    let header = "";
    let timeText = "Loading...";
    let targetTimestamp: number | null = null;
    let key = "past";

    const table: any = {
      Open: {
        future: "Auction Starts In",
        past: "Auction Could Start",
      },
      Auctioning: {
        future: "Auction Ends In",
        past: "Auction Could End",
      },
      Running: { future: "Round Settles In", past: "Round Could Settle" },
      Settled: { past: "Round Settled" },
    };

    switch (roundState) {
      case "Open":
        targetTimestamp = Number(auctionStartDate);
        break;
      case "Auctioning":
        targetTimestamp = Number(auctionEndDate);
        break;
      case "Running":
        targetTimestamp = Number(optionSettleDate) + FOSSIL_DELAY;
        if (conn === "demo") targetTimestamp -= FOSSIL_DELAY;
        break;
      case "Settled":
        targetTimestamp = Number(optionSettleDate);
        break;
    }

    if (!targetTimestamp) return null;

    if (currentTimestamp < targetTimestamp) {
      key = "future";
    }

    header = table[roundState][key];
    timeText = timeUntilTarget(
      currentTimestamp.toString(),
      targetTimestamp.toString(),
    );

    return (
      <Hoverable
        dataId={`leftPanelRoundTime_${roundState}_${key}`}
        className="max-h-full flex flex-row justify-between items-center p-2 w-full"
      >
        <p className="text-[#BFBFBF]">{header}</p>
        <p>{timeText}</p>
      </Hoverable>
    );
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
  const roundState = selectedRoundState?.roundState || "Loading";
  const styles = stateStyles[roundState] || stateStyles.Default;

  const roundIdFormatter = (roundId: string, conn: string): string => {
    let id: string = roundId;

    if (conn === "demo") id = getDemoRoundId(Number(roundId)).toString();

    if (id.length === 1) id = `0${id}`;

    return `Round ${id}`;
  };

  const { maxPayout } = useMemo(() => {
    if (
      !selectedRoundState ||
      !selectedRoundState.capLevel ||
      !selectedRoundState.strikePrice ||
      !selectedRoundState
    ) {
      return { maxPayout: 0 };
    }

    const strike = Number(
      formatUnits(selectedRoundState.strikePrice.toString(), "gwei"),
    );
    const cap = Number(selectedRoundState.capLevel);
    const maxPayout = (cap * strike) / 10000;

    return { maxPayout: maxPayout.toFixed(2) };
  }, [selectedRoundState?.strikePrice, selectedRoundState?.capLevel]);

  return (
    <>
      <div
        className={`flex flex-col mr-4 max-w-[350px] transition-all duration-300 max-h-[800px] overflow-hidden ${
          isPanelOpen ? "w-full" : "w-[110px]"
        } ${!isPanelOpen ? "" : ""}`}
      >
        <div className="align-center text-[14px] bg-black-alt border-[1px] border-greyscale-800 items-start rounded-lg w-full flex flex-col flex-grow h-full max-h-full">
          <Hoverable
            dataId="leftPanelStatisticsBar"
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
              className={`flex flex-row w-full items-center rounded-md hover:cursor-pointer ${
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
          </Hoverable>
          <div
            className={`flex flex-col w-full px-3 border-t-[1px] border-greyscale-800`}
          >
            <Hoverable dataId="leftPanelVaultBar">
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
                <Hoverable
                  dataId="leftPanelVaultRunTime"
                  className="flex flex-row justify-between p-2 w-full"
                >
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
                </Hoverable>

                <Hoverable
                  dataId="leftPanelVaultAddress"
                  className="flex flex-row justify-between p-2 w-full"
                >
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
                </Hoverable>
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
                <Hoverable
                  dataId="leftPanelVaultBalance"
                  className="flex flex-row justify-between p-2 w-full z-50"
                >
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
                </Hoverable>

                <Hoverable
                  dataId="leftPanelVaultAlpha"
                  className="flex flex-row justify-between p-2 w-full"
                >
                  <p className="text-[#BFBFBF] font-regular">Risk Level</p>
                  <p>
                    {vaultState?.alpha && vaultState.alpha !== "0"
                      ? `${Number(vaultState?.alpha) / 100}%`
                      : "Loading..."}
                  </p>
                </Hoverable>
                <Hoverable
                  dataId="leftPanelVaultStrike"
                  className="flex flex-row justify-between p-2 w-full"
                >
                  <p className="text-[#BFBFBF] font-regular">Strike Level</p>
                  <p>{Number(vaultState?.strikeLevel) / 100}%</p>
                </Hoverable>
              </div>
            </Hoverable>
          </div>
          <div className="flex flex-col w-full px-3 border-t-[1px] border-greyscale-800">
            <Hoverable
              dataId="leftPanelRoundBar"
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
            </Hoverable>
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
              <Hoverable
                dataId="leftPanelRoundId"
                className="max-h-full flex flex-row justify-between items-center p-2 w-full"
              >
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
                      {roundIdFormatter(
                        selectedRoundState.roundId.toString(),
                        conn,
                      )}
                    </p>
                    <SquareArrowOutUpRight className="size-[16px]" />
                  </a>
                ) : (
                  <a className="flex flex-row justify-center items-center text-[#F5EBB8] cursor-pointer gap-[4px]">
                    <p>Loading... </p>
                  </a>
                )}
              </Hoverable>
              <Hoverable
                dataId="leftPanelRoundState"
                className="max-h-full flex flex-row justify-between items-center p-2 w-full"
              >
                <p className="text-[#BFBFBF]">State</p>
                <p
                  className={`border-[1px] ${styles.border} ${styles.bg} ${styles.text} font-medium rounded-full px-2 py-[1px]`}
                >
                  {selectedRoundState?.roundState
                    ? selectedRoundState.roundState
                    : "Loading"}
                </p>
              </Hoverable>
              {roundState === "Settled" && (
                <Hoverable
                  dataId="leftPanelRoundPerf"
                  className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                >
                  <p className="text-[#BFBFBF]">Round Perf.</p>
                  <p>
                    {selectedRoundState
                      ? userType == "lp"
                        ? selectedRoundState.performanceLP
                        : selectedRoundState.performanceOB
                      : 0}
                    %
                  </p>
                </Hoverable>
              )}
              <Hoverable
                dataId="leftPanelRoundStrikePrice"
                className="max-h-full flex flex-row justify-between items-center p-2 w-full"
              >
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
              </Hoverable>
              <Hoverable
                dataId="leftPanelRoundCapLevel"
                className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
              >
                <p className="text-[#BFBFBF]">Cap</p>
                <p>
                  {selectedRoundState?.capLevel &&
                  selectedRoundState.capLevel !== "0"
                    ? `${(
                        (100 *
                          parseInt(selectedRoundState.capLevel.toString())) /
                        10_000
                      ).toFixed(2)}%`
                    : "Loading..."}
                </p>
              </Hoverable>
              {selectedRoundState?.roundState !== "Settled" && (
                <Hoverable
                  dataId="leftPanelRoundMaxPayout"
                  className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                >
                  <p className="text-[#BFBFBF]">Capped Payout</p>
                  <p>{maxPayout ? `${maxPayout} GWEI` : "Loading..."}</p>
                </Hoverable>
              )}{" "}
              {roundState == "Auctioning" && (
                <>
                  <Hoverable
                    dataId="leftPanelRoundTotalOptions"
                    className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                  >
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
                  </Hoverable>
                  <Hoverable
                    dataId="leftPanelRoundReservePrice"
                    className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                  >
                    <p className="text-[#BFBFBF] font-regular text-[14px]">
                      Reserve Price
                    </p>
                    <p>
                      {selectedRoundState?.reservePrice &&
                        Number(
                          formatUnits(
                            selectedRoundState.reservePrice.toString(),
                            "gwei",
                          ),
                        ).toFixed(2)}{" "}
                      GWEI
                    </p>
                  </Hoverable>
                </>
              )}
              {(roundState === "Running" || roundState === "Settled") && (
                <>
                  {selectedRoundState?.clearingPrice?.toString() !== "0" ? (
                    <Hoverable
                      dataId="leftPanelRoundClearingPrice"
                      className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                    >
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
                    </Hoverable>
                  ) : (
                    <Hoverable
                      dataId="leftPanelRoundReservePrice"
                      className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                    >
                      <p className="text-[#BFBFBF] font-regular text-[14px]">
                        Reserve Price
                      </p>
                      <p>
                        {selectedRoundState?.reservePrice &&
                          Number(
                            formatUnits(
                              selectedRoundState.reservePrice.toString(),
                              "gwei",
                            ),
                          ).toFixed(2)}{" "}
                        GWEI
                      </p>
                    </Hoverable>
                  )}
                  <Hoverable
                    dataId="leftPanelRoundOptionsSold"
                    className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                  >
                    <p className="text-[#BFBFBF]">Options Sold</p>
                    <p>
                      {formatNumberText(
                        selectedRoundState
                          ? Number(selectedRoundState.optionsSold.toString())
                          : 0,
                      )}
                    </p>
                  </Hoverable>
                </>
              )}
              {roundState === "Settled" && (
                <>
                  {
                    //<Hoverable
                    //  dataId="leftPanelRoundSettlementPrice"
                    //  className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                    //>
                    //  <p className="text-[#BFBFBF]">Settlement Price</p>
                    //  <p>
                    //    {selectedRoundState?.settlementPrice &&
                    //      Number(
                    //        formatUnits(
                    //          selectedRoundState.settlementPrice.toString(),
                    //          "gwei",
                    //        ),
                    //      ).toFixed(2)}{" "}
                    //    GWEI
                    //  </p>
                    //</Hoverable>
                  }
                  <Hoverable
                    dataId="leftPanelRoundPayout"
                    className="max-h-full flex flex-row justify-between items-center   p-2 w-full"
                  >
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
                  </Hoverable>
                </>
              )}
              <RemainingTimeElement />
            </div>
          </div>
          <NewStateTransition
            isPanelOpen={isPanelOpen}
            setModalState={setModalState}
            fossilDelay={FOSSIL_DELAY}
          />
          {
            //   conn === "demo" ? (
            //   <DemoStateTransition
            //     isPanelOpen={isPanelOpen}
            //     setModalState={setModalState}
            //   />
            // ) : (
            //   <StateTransition
            //     isPanelOpen={isPanelOpen}
            //     setModalState={setModalState}
            //     fossilDelay={FOSSIL_DELAY}
            //   />
            // )
          }
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
