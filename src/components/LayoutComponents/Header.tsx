"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

import { BellIcon, ChevronDownIcon, LogOutIcon } from "lucide-react";
import logo_full from "@/../public/logo_full.svg";
import login from "@/../public/login.svg";
import braavosIcon from "@/../public/braavos.svg";
import argent from "@/../public/argent.svg";
import keplr from "@/../public/keplr.svg";
import avatar from "@/../public/avatar.svg";
import { toast, ToastContainer, Bounce } from "react-toastify";
import {
  braavos,
  useAccount,
  useBalance,
  useConnect,
  useDeployAccount,
  useDisconnect,
  useProvider,
} from "@starknet-react/core";
import ProfileDropdown from "../BaseComponents/ProfileDropdown";
import { copyToClipboard } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useProtocolContext } from "@/context/ProtocolProvider";
import {
  Account,
  BigNumberish,
  RawArgs,
  DeployAccountContractPayload,
  CallData,
  hash,
  num,
  // ArgentX,
} from "starknet";
import { parseEther, formatEther } from "ethers";
import useERC20 from "@/hooks/erc20/useERC20";
import useAccountBalances from "@/hooks/vault/state/useAccountBalances";
import { LoginIcon } from "../Icons";
import useIsMobile from "@/hooks/window/useIsMobile";

export default function Header() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { conn, timestamp, mockTimeForward, vaultState } =
    useProtocolContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isDropdownOpenRef = useRef(isDropdownOpen);
  const { isMobile } = useIsMobile();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { account } = useAccount();
  const { balance } = useERC20(
    "0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    vaultState?.address,
  );

  const { lockedBalance, unlockedBalance, stashedBalance } = useAccountBalances(
    vaultState ? vaultState.address : "",
  );

  // @NOTE: sum balances accross all vaults ?
  const balanceData = {
    wallet: parseFloat(formatEther(num.toBigInt(balance).toString())).toFixed(
      3,
    ),
    locked: parseFloat(
      formatEther(num.toBigInt(lockedBalance).toString()),
    ).toFixed(3),
    unlocked: parseFloat(
      formatEther(num.toBigInt(unlockedBalance).toString()),
    ).toFixed(3),
    stashed: parseFloat(
      formatEther(num.toBigInt(stashedBalance).toString()),
    ).toFixed(3),
  };

  useEffect(() => {
    isDropdownOpenRef.current = isDropdownOpen;
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isDropdownOpenRef.current &&
        !dropdownRef?.current?.contains(event.target as HTMLDivElement)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (isDropdownOpenRef.current && event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscKey);
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Add a toast message
        toast("Copied to clipboard", { type: "success" });
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const shortenString = (str: string) => {
    return str ? `${str.slice(0, 6)}...${str.slice(-4)}` : "";
  };

  return (
    !isMobile && (
      <nav className="absolute top-0 z-50 w-full h-[84px] bg-[#121212] px-8 py-6 flex justify-between items-center border-b border-[#262626]">
        <div className="flex-shrink-0">
          <Image
            onClick={() => {
              router.push("/");
            }}
            src={logo_full}
            alt="Pitchlake logo"
            width={200}
            height={100}
            className="cursor-pointer h-8 sm:h-10 md:h-12 lg:h-14"
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className="flex items-center space-x-4 text-[14px] font-medium">
          {conn === "mock" && (
            <div>
              <p>{timestamp.toString()}</p>
              <button onClick={() => mockTimeForward()}>
                Forward Mock Time
              </button>
            </div>
          )}
          {
            //<div className="hover:cursor-pointer border-[1px] border-greyscale-800 p-2 rounded-md">
            //  <BellIcon className="h-6 w-6 text-primary" />
            //</div>
          }
          <div className="relative" ref={dropdownRef}>
            {account ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 py-2 px-3 rounded-md border border-greyscale-800 w-[164px] h-[44px]"
                >
                  <Image
                    src={avatar}
                    alt="User avatar"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-white font-medium">
                    {shortenString(account.address)}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 text-white" />
                </button>

                {isDropdownOpen && (
                  <>
                    <ProfileDropdown
                      account={account}
                      balance={balanceData}
                      disconnect={disconnect}
                      copyToClipboard={copyToClipboard}
                    />
                    <ToastContainer
                      autoClose={3000}
                      closeOnClick
                      hideProgressBar={false}
                      transition={Bounce}
                      //theme="dark"
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <button
                  className="flex flex-row min-w-16 bg-primary-400 text-black text-sm px-8 py-4 rounded-md w-[123px] h-[44px] items-center justify-center"
                  onClick={() => setIsDropdownOpen((state) => !state)}
                >
                  <p>Connect</p>
                  <div>
                    <LoginIcon
                      classname="h-4 w-4 ml-1 text-[var(--buttongrey)]"
                      stroke="#111111"
                      fill="none"
                    />
                  </div>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 h-[148px] w-[196px] text-sm flex flex-col mt-3 ">
                    <div className="bg-[#161616] rounded-md">
                      <div className="p-4 font-regular text-[12px] border border-transparent border-b-[#454545] ">
                        CHOOSE A WALLET
                      </div>
                      {connectors.map((connector) => (
                        <div
                          key={connector.id}
                          onClick={() => connect({ connector })}
                          className="cursor-pointer sticky p-2 px-3 bg-[#161616] w-full text-[#FAFAFA] text-[14px] font-medium hover:bg-[#262626]"
                        >
                          {
                            <div className="flex flex-row items-center">
                              <Image
                                src={
                                  connector.id === "braavos"
                                    ? braavosIcon
                                    : connector.id === "keplr"
                                      ? keplr
                                      : argent
                                }
                                alt="Login"
                                width={20}
                                height={30}
                                className="m-2 pr-1"
                                color="#BFBFBF"
                                style={{ objectFit: "contain" }}
                              />
                              {connector.id.toLocaleUpperCase()}
                            </div>
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
    )
  );
}
