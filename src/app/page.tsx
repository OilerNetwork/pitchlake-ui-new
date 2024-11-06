"use client";
import buttonClass from "@/styles/Button.module.css";
import styles from "./page.module.css";
import { useConnect } from "@starknet-react/core";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import VaultCard from "@/components/Vault/VaultCard/VaultCard";

export default function Home() {
  const vaults = [
    "0x038cfc94b5626c9355910304622f8270eaef77b62cb850e1ca0e38ecedcdee5b",
    // katana
    "0x2cbdf2381224c850975613fb42848ae1a3a608d91bcd7d7a59dcc2b459d98d4",
  ];

  const [isModalVisible, setIsModalVisible] = useState<boolean>();
  const handleCreateClick = () => {};
  const ws = useRef<WebSocket | null>(null);
  const isLoaded = useState(false);

  // useEffect(() => {
  //   if (isLoaded) {
  //     ws.current = new WebSocket("ws://localhost:8080/subscribeHome");

  //     ws.current.onopen = () => {
  //       console.log("WebSocket connection established");
  //       // Optionally, send a message to the server

  //       ws.current?.send(
  //         JSON.stringify({
  //           address: Math.random().toString(),
  //           userType: "lp",
  //           optionRound: 0,
  //           vaultAddress: "16",
  //         }),
  //       );
  //     };

  //     const wsCurrent = ws.current;
  //     ws.current.onmessage = (event) => {
  //       console.log("Message from server:", event.data);
  //     };

  //     ws.current.onerror = (error) => {
  //       console.error("WebSocket error:", error);
  //     };

  //     ws.current.onclose = () => {
  //       console.log("WebSocket connection closed");
  //     };
  //   }
  //   // Cleanup function to close the WebSocket connection when the component unmounts
  //   return () => {
  //     ws.current?.close();
  //   };
  // }, [isLoaded]);

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
