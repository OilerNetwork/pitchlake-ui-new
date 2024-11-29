"use client";
import buttonClass from "@/styles/Button.module.css";
import styles from "./page.module.css";
import { useConnect } from "@starknet-react/core";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import VaultCard from "@/components/VaultCard/VaultCard";
import useWebSocketHome from "@/hooks/websocket/useWebSocketHome";

export default function Home() {
  // console.log("CHECK THIS LOG", process.env.NEXT_PUBLIC_VAULT_ADDRESSES);
  // console.log("CHECK THIS LOG", process.env.NEXT_PUBLIC_WS_URL);

  //  console.log(vaultsRaw);
  //
  //  const vaults = [
  //    "0x038cfc94b5626c9355910304622f8270eaef77b62cb850e1ca0e38ecedcdee5b",
  //    "0x2cbdf2381224c850975613fb42848ae1a3a608d91bcd7d7a59dcc2b459d98d4",
  //
  //    // short round
  //    "0x13257401fd2df63db6464035ab3ed13f3ef84ae71a07054f50d7bd20311e0a3",
  //    "0x8f4e98c8c7f2698ff9a98df855116154f0482b93127dc79b15f05effbe8237",
  //  ];

  const { vaults: wsVaults } = useWebSocketHome();
  const vaults =
    process.env.NEXT_PUBLIC_ENVIRONMENT === "ws"
      ? wsVaults
      : process.env.NEXT_PUBLIC_VAULT_ADDRESSES?.split(",");

  return (
    <div className="flex flex-grow flex-col px-8 mt-6 w-full ">
      <p className="my-2 text-base text-white-alt py-2 font-medium">
        Popular Vaults
      </p>
      <div className="grid grid-cols-2 w-full pt-6 gap-x-6 gap-y-6">
        {vaults?.map((vault: string, index: number) => (
          // <VaultTimeline key={vault.address + idx.toString()} vault={vault} />
          <VaultCard key={index} vaultAddress={vault} />
        ))}
        {/* <CreateVault {...{ handleCreateClick }} /> */}
      </div>

      {
        // <CreateVaultModal isModalVisible={isModalVisible} closeModal={() => setIsModalVisible(false)} />
      }
    </div>
  );
}
