import React, { useState, useEffect, useRef, useMemo } from "react";
import classNames from "classnames";
import axios from "axios";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckIcon,
} from "@/components/Icons";
import { History } from "lucide-react";
import { useProtocolContext } from "@/context/ProtocolProvider";
import { formatUnits } from "ethers";
import data from "@/chart_data.json";
import GasPriceChart from "@/components/Vault/VaultChart/ChartInner";
import { useGasData } from "@/hooks/chart/useGasData";
import { useHistoricalRoundParams } from "@/hooks/chart/useHistoricalRoundParams";
import Hoverable from "@/components/BaseComponents/Hoverable";

const RoundPerformanceChart = () => {
  const [isExpandedView, setIsExpandedView] = useState(false);

  const { selectedRound, selectedRoundState, setSelectedRound, vaultState } =
    useProtocolContext();

  const vaultAddress = useMemo(() => {
    return vaultState?.address;
  }, [vaultState?.address]);

  const toRound = useMemo(() => {
    return selectedRound
      ? Number(selectedRound)
      : vaultState?.currentRoundId
        ? Number(vaultState.currentRoundId)
        : 1;
  }, [selectedRound]);

  const fromRound = useMemo(() => {
    if (!isExpandedView) {
      return toRound;
    } else {
      return toRound > 3 ? toRound - 3 : 1;
    }
  }, [toRound, isExpandedView]);

  const { vaultData: historicalData } = useHistoricalRoundParams({
    vaultAddress,
    fromRound,
    toRound,
  });

  const maxDataPoints = 100;

  //  const [maxDataPoints, setMaxDataPoints] = useState<number>(100);
  const twapRange = useMemo(() => {
    if (
      !selectedRoundState?.auctionEndDate ||
      !selectedRoundState?.optionSettleDate
    )
      return 1;

    return (
      Number(selectedRoundState.optionSettleDate) -
      Number(selectedRoundState.auctionEndDate)
    );
  }, [
    selectedRoundState?.auctionEndDate,
    selectedRoundState?.optionSettleDate,
  ]);

  //const [twapRange, setTwapRange] = useState<number>(720); // Example TWAP range in seconds

  const bounds = useMemo(() => {
    if (!selectedRoundState) return;

    const deploymentTimestamp = Number(selectedRoundState.deploymentDate);
    const optionSettleTimestamp = Number(selectedRoundState.optionSettleDate);

    if (!isExpandedView) return [deploymentTimestamp, optionSettleTimestamp];
    else {
      return [
        deploymentTimestamp - 3 * (optionSettleTimestamp - deploymentTimestamp),
        optionSettleTimestamp,
      ];
    }
  }, [
    selectedRoundState?.deploymentDate,
    selectedRoundState?.optionSettleDate,
    isExpandedView,
  ]);

  // Use the useGasData hook
  const { gasData, isLoading, isError, error } = useGasData({
    lowerTimestamp: bounds ? bounds[0] : 0,
    upperTimestamp: bounds ? bounds[1] : 0,
    maxDataPoints,
    twapRange,
    roundStart: Number(selectedRoundState?.deploymentDate),
  });

  const [activeLines, setActiveLines] = useState<{ [key: string]: boolean }>({
    TWAP: true,
    BASEFEE: true,
    STRIKE: true,
    CAP_LEVEL: true,
  });
  const [zoomDomain, setZoomDomain] = useState<any>(null);
  const [roundNavIsOpen, setRoundNavIsOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const decrementRound = () => {
    if (selectedRound > 1) {
      setSelectedRound(selectedRound - 1);
    }
  };

  const incrementRound = () => {
    if (
      vaultState?.currentRoundId &&
      selectedRound < Number(vaultState.currentRoundId)
    ) {
      setSelectedRound(selectedRound + 1);
    }
  };

  const handleZoom = (domain: any) => {
    setZoomDomain(domain);
  };

  const handleResetZoom = () => {
    setZoomDomain(null);
  };

  const parsedData = useMemo(() => {
    if (!selectedRound || !gasData || !historicalData || !bounds) return [];

    return gasData?.map((item: any) => {
      const newItem: any = { ...item };

      const round = historicalData.rounds.find((r: any) => {
        const lowerBound = Number(r.deploymentDate);
        const upperBound = Number(r.optionSettleDate);
        return item.timestamp >= lowerBound && item.timestamp <= upperBound;
      });

      if (round) {
        const strike = Number(formatUnits(round.strikePrice, "gwei"));
        const cap =
          Number(formatUnits(round.strikePrice, "gwei")) *
          (1 + Number(round.capLevel) / 10000);

        newItem.STRIKE = strike;
        newItem.CAP_LEVEL = cap;
      } else {
        newItem.STRIKE = undefined;
        newItem.CAP_LEVEL = undefined;
      }

      return newItem;
    });
  }, [
    gasData,
    selectedRound,
    historicalData,
    selectedRoundState?.deploymentDate,
    selectedRoundState?.optionSettleDate,
    selectedRoundState?.capLevel,
    selectedRoundState?.strikePrice,
  ]);

  const toggleLine = (line: string) => {
    setActiveLines((prev) => ({ ...prev, [line]: !prev[line] }));
  };

  // Set initial selectedRound
  useEffect(() => {
    if (!selectedRound && vaultState?.currentRoundId) {
      setSelectedRound(Number(vaultState.currentRoundId));
    }
  }, [selectedRound]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setRoundNavIsOpen(false);
      }
    };

    if (roundNavIsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roundNavIsOpen]);

  return (
    <div className="w-full h-[800px] bg-black-alt rounded-[12px] border border-greyscale-800 relative">
      {/* Round Navigation */}
      <div className="flex flex-row items-center p-5 justify-between border-b-[1px] border-greyscale-800 pb-4 h-[56px]">
        <Hoverable
          dataId="chartRoundSelector"
          ref={headerRef}
          onClick={() => setRoundNavIsOpen(!roundNavIsOpen)}
          className="cursor-pointer font-medium text-[14px] text-primary flex flex-row items-center"
        >
          <p className="flex flex-row items-center">Round &nbsp;</p>
          {selectedRound ? selectedRound : 1}
          {Number(selectedRound) === Number(vaultState?.currentRoundId)
            ? " (Live)"
            : ""}
          <div className="flex items-center ">
            {!roundNavIsOpen ? (
              <ArrowDownIcon
                stroke="var(--primary)"
                classname="flex items-center ml-2 w-4 h-4"
              />
            ) : (
              <ArrowUpIcon stroke="var(--primary)" classname="ml-2 w-4 h-4" />
            )}
          </div>
        </Hoverable>
        <div className="flex flex-row items-center gap-4">
          <Hoverable dataId="chartPreviousRound" onClick={decrementRound}>
            <ArrowLeftIcon
              stroke={
                !selectedRound || selectedRound === 1
                  ? "var(--greyscale)"
                  : "var(--primary)"
              }
              classname={`${
                !selectedRound || selectedRound === 1
                  ? ""
                  : "hover:cursor-pointer hover-zoom"
              } w-[15px] h-[15px] mr-2 ${
                !selectedRound || selectedRound === 1
                  ? "hover:cursor-default"
                  : ""
              } `}
            />
          </Hoverable>
          <Hoverable dataId="chartNextRound" onClick={incrementRound}>
            <ArrowRightIcon
              stroke={
                selectedRound &&
                vaultState?.currentRoundId &&
                Number(vaultState.currentRoundId) > selectedRound
                  ? "var(--primary)"
                  : "var(--greyscale)"
              }
              classname={`${
                selectedRound &&
                vaultState?.currentRoundId &&
                Number(vaultState.currentRoundId) > selectedRound
                  ? "hover-zoom hover:cursor-pointer"
                  : ""
              } w-[15px] h-[15px] mr-2 ${
                !selectedRound ||
                selectedRound === Number(vaultState?.currentRoundId)
                  ? "hover:cursor-default"
                  : ""
              }`}
            />
          </Hoverable>
          <Hoverable dataId="chartHistory">
            <History
              onClick={() => setIsExpandedView(!isExpandedView)}
              className={classNames(
                "w-5 h-5 mr-2 cursor-pointer",
                {
                  "stroke-[var(--primary)]": isExpandedView,
                  "stroke-[var(--greyscale)]": !isExpandedView,
                },
                "hover:stroke-[var(--primary)]  hover-zoom",
              )}
            />
          </Hoverable>
        </div>
      </div>

      {/* Dropdown */}
      {roundNavIsOpen && (
        <div
          ref={dropdownRef}
          tabIndex={-1}
          className="custom-scrollbar absolute top-[61px] left-1 right-0 bg-[#161616] pt-2 z-10 border border-[#262626] rounded-lg w-[200px] max-h-[244px] overflow-scroll"
        >
          {[
            ...Array(
              vaultState?.currentRoundId
                ? Number(vaultState.currentRoundId)
                : 1,
            ),
          ]
            .map((_, index) => index)
            .reverse()
            .map((index) => (
              <div
                key={index}
                className={`flex flex-row justify-between items-center px-4 pt-3 pb-3 hover:bg-greyscale-800 cursor-pointer font-regular text-[14px] text-[#FFFFFF] ${
                  index + 1 === Number(vaultState?.currentRoundId)
                    ? "bg-greyscale-800"
                    : ""
                }`}
                onClick={() => {
                  setSelectedRound(index + 1);
                  setRoundNavIsOpen(false);
                }}
              >
                Round {index + 1}
                {index + 1 === Number(vaultState?.currentRoundId)
                  ? " (Live)"
                  : ""}
                {index + 1 === selectedRound && (
                  <CheckIcon stroke="#ffffff" fill="none" />
                )}
              </div>
            ))}
        </div>
      )}

      {/* Line Toggle Buttons */}
      <div className="flex justify-center items-center my-4">
        <div className="flex gap-4">
          {["TWAP", "BASEFEE", "STRIKE", "CAP_LEVEL"].map((line) => (
            <Hoverable dataId={`chartLineButton_${line}`}>
              <button
                key={line}
                className={`hover-zoom-small flex flex-row items-center font-regular text-[12px]
                   ${
                     line === "CAP_LEVEL"
                       ? "text-success"
                       : line === "BASEFEE"
                         ? "text-greyscale"
                         : line === "STRIKE"
                           ? "text-warning-300"
                           : "text-error-300"
                   }`}
                onClick={() => toggleLine(line)}
              >
                {line === "CAP_LEVEL" ? "CAP LEVEL" : line}
                {activeLines[line] ? (
                  <EyeIcon className="w-4 h-4 ml-2 mr-3" />
                ) : (
                  <EyeOffIcon className="w-4 h-4 ml-2 mr-3" />
                )}
              </button>
            </Hoverable>
          ))}
        </div>
      </div>

      {/* Chart */}
      <GasPriceChart
        data={parsedData}
        historicalData={historicalData}
        activeLines={activeLines}
        fromRound={fromRound}
        toRound={toRound}
        isExpandedView={isExpandedView}
        selectedRound={selectedRound}
        setIsExpandedView={setIsExpandedView}
        //zoomDomain={zoomDomain}
        //handleZoom={handleZoom}
        //handleResetZoom={handleResetZoom}
      />
    </div>
  );
};

export default RoundPerformanceChart;
