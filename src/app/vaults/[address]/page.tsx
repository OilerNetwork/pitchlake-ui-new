"use client";
import { useEffect, useRef, useState } from "react";
import classes from "./page.module.css";
import { Vault } from "@/components/Vault/Vault";

export default function Home({
  params: { address: vaultAddress },
}: {
  params: { address: string };
}) {

  return (
  
      <Vault vaultAddress={vaultAddress} />

  );
}
