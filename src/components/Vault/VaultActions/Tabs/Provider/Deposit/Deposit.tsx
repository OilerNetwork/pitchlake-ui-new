import { Button, InputNumber } from "antd";
import buttons from "@/styles/Button.module.css";
import classes from "./Deposit.module.css";
import inputs from "@/styles/Input.module.css";
import { useState } from "react";
import { DepositArgs, VaultStateType } from "@/lib/types";
import useERC20 from "@/hooks/erc20/useERC20";
import { useAccount } from "@starknet-react/core";
import { stringToHex } from "@/lib/utils";
import { useTransactionContext } from "@/context/TransactionProvider";

import React from "react";
import { SidePanelState } from "@/lib/types";
import InputField from "@/components/Vault/Utils/InputField";
import ToggleSwitch from "@/components/Vault/Utils/ToggleSwitch";

interface DepositContentProps {
  state: SidePanelState;
  updateState: (updates: Partial<SidePanelState>) => void;
}

const DepositContent: React.FC<DepositContentProps> = ({
  state,
  updateState,
}) => (
  <>
    <InputField
      label="Enter Amount"
      value={state.amount}
      onChange={(e) => updateState({ amount: e.target.value })}
      placeholder="e.g. 5"
    />
    <div className="flex justify-between text-sm mb-4">
      <span className="text-gray-400">Unlocked Balance</span>
      <span>34.8 ETH</span>
    </div>
    <ToggleSwitch
      isChecked={state.isDepositAsBeneficiary}
      onChange={() =>
        updateState({ isDepositAsBeneficiary: !state.isDepositAsBeneficiary })
      }
      label="Deposit as Beneficiary"
    />
  </>
);

export default DepositContent;

// export default function Deposit({
//   vaultState,
//   deposit,
// }: {
//   vaultState: VaultStateType;
//   deposit: (depositArgs: DepositArgs) => Promise<void>;
// }) {
//   const [amount, setAmount] = useState<string>("");
//   const { account } = useAccount();
//   const { isDev, devAccount } = useTransactionContext();
//   const [displayInsufficientBalance, setDisplayInsufficientBalance] =
//     useState<boolean>(false);
//   const { balance, allowance, approve } = useERC20(
//     vaultState.ethAddress,
//     vaultState.address
//   );

//   const handleAmountChange = (value: string | null) => {
//     if (value) setAmount(value);
//     else setAmount("");
//   };
//   // const approveShares = async () => {
//   //   const approveTx = await getERC20Instance(roundTokenData.depositsToken).populateTransaction.approve(
//   //     vault.depositsController,
//   //     roundTokenBalance
//   //   );
//   //   sendTransactionWithToasts(approveTx, () => setIsDepositClickable(true));
//   // };

//   //   const claim = async () => {
//   //     const depositTx = await getDepositsControllerInstance(
//   //       vault.depositsController
//   //     ).populateTransaction.claimVaultShares(
//   //       selectedRound,
//   //       roundTokenBalance,
//   //       account
//   //     );
//   //     sendTransactionWithToasts(depositTx);
//   //   };

//   return (
//     <div className={classes.container}>
//       <p className={classes.title}>{"Deposit"}</p>
//       <div style={{ width: "100%" }}>
//         {
//           <>
//             <InputNumber
//               className={inputs.input}
//               placeholder="Deposit Amount (ETH)"
//               onChange={handleAmountChange}
//               controls={false}
//             />
//             <div className={classes.controls}>
//               <Button
//                 style={{ flex: 1 }}
//                 className={buttons.button}
//                 title="approve"
//                 disabled={false}
//                 onClick={async () =>
//                   await approve({
//                     amount: BigInt(amount),
//                     spender: vaultState.address,
//                   })
//                 }
//               >
//                 Approve
//               </Button>
//               <Button
//                 style={{ flex: 1 }}
//                 className={[buttons.button, buttons.confirm].join(" ")}
//                 title="deposit"
//                 disabled={
//                   //!isDepositClickable || displayInsufficientBalance
//                   false
//                 }
//                 onClick={async () => {
//                   if (isDev) {
//                     if (devAccount)
//                       await deposit({
//                         amount: BigInt(amount),
//                         beneficiary: devAccount.address,
//                       });
//                   }
//                   if (account)
//                     await deposit({
//                       amount: BigInt(amount),
//                       beneficiary: account.address,
//                     });
//                 }}
//               >
//                 Deposit
//               </Button>
//             </div>
//           </>
//         }
//       </div>
//     </div>
//   );
// }
