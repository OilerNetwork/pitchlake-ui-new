import { LeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import styles from "./OptionRoundHeader.module.css"
import { OptionRoundStateType, VaultStateType } from "@/lib/types";

export default function VaultHeader({
  vault,
  currentRoundState,
}: {
  vault: VaultStateType;
  currentRoundState: OptionRoundStateType;
}) {
  return (
    <div className={styles.container}>
      <Link href="/" passHref>
        <div className={`${styles.box} ${styles.back}`}>
          <LeftOutlined />
        </div>
      </Link>
      <div className={`${styles.box} ${styles.titleBox}`}>
        <p className={styles.title}>
          {vault.address} | {vault.vaultType}
        </p>
      </div>
      <div className={styles.box}>
        <p>{currentRoundState.capLevel?.toString().toUpperCase()} Risk</p>
      </div>
      <div className={styles.box}>
        <p>
          <strong>
            {
              "ETH"
              // vault.underlying?.toUpperCase()
            }
          </strong>
        </p>
        <p>
          STRIKE:&nbsp;
          <strong>{currentRoundState.strikePrice}</strong> gwei | CR:&nbsp;
          <strong>{Number(currentRoundState.capLevel) / 100}%</strong>
        </p>
      </div>
      <div className={styles.box}>
        <p>
          Fees:{" "}
          <strong>
            {
              0
              //vault.performanceFee || 0
            }
            %
          </strong>{" "}
          | TVL:&nbsp;
          <strong>{vault.lockedBalance} weth</strong>
        </p>
        <p>
          TVL Cap:&nbsp;
          <strong>
            {
              "TVL CAP "
              //formatEther(vault.tvlCap || 0).toString()
            }{" "}
            weth
          </strong>
        </p>
      </div>
      <div className={styles.box}>
        <p>
          APY:{" "}
          <strong>
            {
              0
              //vault.apy || 0
            }
            %
          </strong>
        </p>
        <p>
          Last Round Performance:{" "}
          <strong>
            {
              0
              //vault.lastRoundPerformance || 0
            }{" "}
            (??)
          </strong>
        </p>
      </div>
      <div className={styles.box}>
        <p>End Date:</p>
        <p>
          <strong>{new Date(Number(currentRoundState.auctionEndDate)*1000).toDateString()}</strong>
        </p>
      </div>
    </div>
  );
}
