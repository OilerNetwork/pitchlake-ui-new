import { useRouter } from "next/navigation";
import {
  shortenString,
  timeUntilTarget,
  timeUntilTargetFormal,
} from "@/lib/utils";

import {
  ActivityIcon,
  BarChartIcon,
  HourglassSimpleIcon,
  PieChartIcon,
  ShoppingCartIcon,
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
import { useNewContext } from "@/context/NewProvider";
import { useTimeContext } from "@/context/TimeProvider";
import useVaultStateRPC from "@/hooks/vault_v2/rpc/useVaultStateRPC";
import { useMemo } from "react";
import useOptionRoundStateRPC from "@/hooks/vault_v2/rpc/useOptionRoundStateRPC";
export default function VaultCard({ vaultAddress }: { vaultAddress: string }) {
  const { conn } = useNewContext();
  const { timestamp } = useTimeContext();
  const { vaultState } = useVaultStateRPC({
    vaultAddress,
  });
  const currentRoundAddress = vaultState?.currentRoundAddress;
  const roundState = useOptionRoundStateRPC(conn, currentRoundAddress);
  const { setSelectedRound } = useNewContext();

  const { cap } = useMemo(() => {
    if (!roundState?.capLevel || !roundState?.strikePrice) {
      return { cap: 0 };
    }

    const strike = Number(
      formatUnits(roundState?.strikePrice.toString(), "gwei"),
    );
    const capPercentage = Number(roundState?.capLevel);
    const cap = strike + (capPercentage * strike) / 10000;

    return { cap: cap.toFixed(2) };
  }, [roundState?.strikePrice, roundState?.capLevel]);

  const { premium } = useMemo(() => {
    const { reservePrice, clearingPrice } = roundState;
    console.log("roundState", clearingPrice, reservePrice);

    if (clearingPrice == 0)
      return {
        premium: parseFloat(
          formatUnits(reservePrice.toString(), "gwei"),
        ).toFixed(2),
      };
    else
      return {
        premium: parseFloat(
          formatUnits(clearingPrice.toString(), "gwei"),
        ).toFixed(2),
      };
  }, [roundState?.reservePrice, roundState?.clearingPrice]);

  const { auctionStartDate, auctionEndDate, optionSettleDate } = useTimestamps(
    currentRoundAddress ? currentRoundAddress : "",
  );
  const timeUntilText =
    roundState?.roundState === "Open"
      ? "AUCTION STARTS"
      : roundState?.roundState === "Auctioning"
        ? "AUCTION ENDS"
        : "ROUND SETTLES";

  const timeUntilValue =
    roundState?.roundState === "Loading" ||
    roundState?.roundState === "" ||
    !auctionStartDate ||
    !auctionEndDate ||
    !optionSettleDate ||
    !timestamp
      ? "0"
      : timeUntilTarget(
          timestamp.toString(),
          roundState?.roundState === "Open"
            ? auctionStartDate.toString()
            : roundState?.roundState === "Auctioning"
              ? auctionEndDate.toString()
              : optionSettleDate.toString(),
        );

  const router = useRouter();
  var myHeaders = new Headers();
  myHeaders.append("accept", "application/json");
  myHeaders.append("content-type", "application/json");

  return (
    <div
      data-testid="vault-card"
      className={`hover-zoom-tiny col-span-1 w-full border-[1px] border-[#262626] hover:border-[#454545] rounded-lg hover:cursor-pointer transition duration-200 group`}
      onClick={() => {
        setSelectedRound(Number(vaultState?.currentRoundId));
        router.push(`/vaults/${vaultAddress}`);
      }}
    >
      <div className="bg-[#1A1A16] rounded-t-lg p-4 text-white group-hover:bg-[#1D1D18] transition duration-200">
        <div className="flex flex-row items-center">
          <p data-testid="vault-duration" className="text-[14px] font-semibold">
            {auctionEndDate && optionSettleDate
              ? timeUntilTargetFormal(
                  auctionEndDate.toString(),
                  optionSettleDate.toString(),
                )
              : "Loading..."}
          </p>
          <div className="bg-primary-800 rounded-full w-[5px] h-[5px] m-2 vault-type" />
          <p
            data-testid="vault-type"
            className="text-[16px] font-regular text-[var(--buttongrey)]"
          >
            {vaultState?.vaultType ? vaultState.vaultType : "--"}
          </p>
        </div>
        <p
          data-testid="vault-address"
          className="text-[16px] font-regular text-[var(--buttongrey)]"
        >
          {shortenString(vaultAddress)}{" "}
        </p>
      </div>
      <div className="flex flex-row w-full ">
        <div className="flex flex-col p-2 w-full border-r-[1px] border-greyscale-800">
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <TagIcon classname="w-4 h-4 mr-2" stroke={"var(--greyscale)"} />
              <p className="font-regular text-[14px] text-[#BFBFBF]">FEES:</p>
            </div>
            <p
              data-testid="vault-fees"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {"0%"}
            </p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <BarChartIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">TVL:</p>
            </div>
            <p
              data-testid="vault-tvl"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {parseFloat(
                formatEther(
                  num.toBigInt(vaultState?.lockedBalance) +
                    num.toBigInt(vaultState?.unlockedBalance),
                  //+num.toBigInt(stashedBalance),
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
              <p
                data-testid="vault-time-label"
                className="font-regular text-[14px] text-[#BFBFBF]"
              >
                {timeUntilText}
              </p>
            </div>

            <p
              data-testid="vault-time-value"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {timeUntilValue === "0" ? "Loading..." : timeUntilValue}
            </p>
          </div>
        </div>
        <div className="flex flex-col p-2 w-full border-l-[1px] border-greyscale-800">
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <ShoppingCartIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">
                Premium:
              </p>
            </div>
            <p
              data-testid="vault-apy"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {premium === "0" ? "Loading..." : `${premium} Gwei`}
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
            <p
              data-testid="vault-strike"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {roundState?.strikePrice.toString() === "0"
                ? "Loading..."
                : `${parseFloat(
                    formatUnits(roundState?.strikePrice.toString(), "gwei"),
                  ).toFixed(2)} GWEI`}
            </p>
          </div>
          <div className="flex flex-row justify-between m-2">
            <div className="flex flex-row items-center">
              <PieChartIcon
                classname="w-4 h-4 mr-2"
                stroke={"var(--greyscale)"}
              />
              <p className="font-regular text-[14px] text-[#BFBFBF]">Cap:</p>
            </div>
            <p
              data-testid="vault-cap"
              className="text-[#fafafa] font-medium text-[14px]"
            >
              {cap} Gwei
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
