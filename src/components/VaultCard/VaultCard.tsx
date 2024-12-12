import { useRouter } from "next/navigation";
import {
  shortenString,
  timeUntilTarget,
  timeUntilTargetFormal,
} from "@/lib/utils";
import useVaultState from "@/hooks/vault/useVaultState";
import {
  ActivityIcon,
  BarChartIcon,
  HourglassSimpleIcon,
  PieChartIcon,
  SpeedometerIcon,
  TagIcon,
} from "@/components/Icons";
import useVaultBalances from "@/hooks/vault/state/useVaultBalances";
import { num } from "starknet";
import { formatEther, formatUnits } from "ethers";
import useStrikePrice from "@/hooks/optionRound/state/useStrikePrice";
import useCapLevel from "@/hooks/optionRound/state/useCapLevel";
import useRoundState from "@/hooks/optionRound/state/useRoundState";
import useTimestamps from "@/hooks/optionRound/state/useTimestamps";
import useLatestTimestamp from "@/hooks/chain/useLatestTimestamp";
import { useProvider } from "@starknet-react/core";
import { useProtocolContext } from "@/context/ProtocolProvider";

export default function VaultCard({ vaultAddress }: { vaultAddress: string }) {
  const { provider } = useProvider();
  const { lockedBalance, unlockedBalance, stashedBalance } =
    useVaultBalances(vaultAddress);

  const { setSelectedRound } = useProtocolContext();
  const { vaultState, currentRoundAddress } = useVaultState({
    conn: "rpc",
    address: vaultAddress,
    getRounds: false,
  }); //conn arguement hardcoded here. Make conn a context variable to feed everywhere

  const { roundState } = useRoundState(
    currentRoundAddress ? currentRoundAddress : "Loading",
  );
  const { capLevel } = useCapLevel(
    currentRoundAddress ? currentRoundAddress : "",
  );
  const { strikePrice } = useStrikePrice(
    currentRoundAddress ? currentRoundAddress : "",
  );
  const { timestamp } = useLatestTimestamp(provider);
  const { auctionStartDate, auctionEndDate, optionSettleDate } = useTimestamps(
    currentRoundAddress ? currentRoundAddress : "",
  );
  const timeUntilText =
    roundState === "Open"
      ? "AUCTION STARTS"
      : roundState === "Auctioning"
        ? "AUCTION ENDS"
        : "ROUND SETTLES";
  const timeUntilValue =
    roundState === "Loading" ||
    roundState === "" ||
    !auctionStartDate ||
    !auctionEndDate ||
    !optionSettleDate ||
    !timestamp
      ? "0"
      : timeUntilTarget(
          timestamp.toString(),
          roundState === "Open"
            ? auctionStartDate.toString()
            : roundState === "Auctioning"
              ? auctionEndDate.toString()
              : optionSettleDate.toString(),
        );

  const router = useRouter();
  var myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  myHeaders.append("content-type", "application/json");

  return (
    <div
      className={`hover-zoom-tiny col-span-1 w-full border-[1px] border-[#262626] hover:border-[#454545] rounded-lg hover:cursor-pointer transition duration-200 group`}
      onClick={() => {
        setSelectedRound(Number(vaultState?.currentRoundId));
        router.push(`/vaults/${vaultAddress}`);
      }}
    >
      <div className="bg-[#1A1A16] rounded-t-lg p-4 text-white group-hover:bg-[#1D1D18] transition duration-200">
        <div className="flex flex-row items-center">
          <p className="text-[14px] font-semibold">
            {auctionEndDate && optionSettleDate
              ? timeUntilTargetFormal(
                  auctionEndDate.toString(),
                  optionSettleDate.toString(),
                )
              : "Loading..."}
          </p>
          <div className="bg-primary-800 rounded-full w-[5px] h-[5px] m-2" />
          <p className="text-[16px] font-regular text-[var(--buttongrey)]">
            {vaultState?.vaultType ? vaultState.vaultType : "--"}
          </p>
        </div>
        <p className="text-[16px] font-regular text-[var(--buttongrey)]">
          {shortenString(vaultAddress)}{" "}
        </p>
      </div>
      <div className="flex flex-row w-full ">
        <div className="flex flex-col p-2 w-full border-r-[1px] border-greyscale-800">
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <SpeedometerIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">APY:</p>
            </div>
            <p className="text-[#fafafa] font-medium text-[14px]">{"--"}</p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <PieChartIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">Cap:</p>
            </div>
            <p className="text-[#fafafa] font-medium text-[14px]">
              {capLevel.toString() === "0"
                ? "Loading..."
                : `${parseInt(capLevel.toString()) / 100}%`}
            </p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <ActivityIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">Strike:</p>
            </div>
            <p className="text-[#fafafa] font-medium text-[14px]">
              {strikePrice.toString() === "0"
                ? "Loading..."
                : `${parseFloat(
                    formatUnits(strikePrice.toString(), "gwei"),
                  ).toFixed(2)} GWEI`}
            </p>
          </div>
        </div>
        <div className="flex flex-col p-2 w-full border-l-[1px] border-greyscale-800">
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <TagIcon classname="w-4 h-4 mr-2" stroke={"var(--greyscale)"} />
              <p className="font-regular text-[14px] text-[#BFBFBF]">FEES:</p>
            </div>
            <p className="text-[#fafafa] font-medium text-[14px]">{"--"}</p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <BarChartIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">TVL:</p>
            </div>
            <p className="text-[#fafafa] font-medium text-[14px]">
              {parseFloat(
                formatEther(
                  num.toBigInt(lockedBalance) +
                    num.toBigInt(unlockedBalance) +
                    num.toBigInt(stashedBalance),
                ),
              ).toFixed(1)}{" "}
              ETH
            </p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <HourglassSimpleIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">
                {timeUntilText}
              </p>
            </div>

            <p className="text-[#fafafa] font-medium text-[14px]">
              {timeUntilValue === "0" ? "Loading..." : timeUntilValue}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
