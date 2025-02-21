import React, { useState, ReactNode } from "react";
import { WithdrawSubTabs } from "@/lib/types";
import ButtonTabs from "../../ButtonTabs";
import WithdrawLiquidity from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawLiquidity";
import QueueWithdrawal from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/QueueWithdrawal";
import WithdrawStash from "@/components/Vault/VaultActions/Tabs/Provider/Withdraw/WithdrawStash";
import useVaultState from "@/hooks/vault_v2/states/useVaultState";
import useRoundState from "@/hooks/vault_v2/states/useRoundState";

interface WithdrawProps {
  showConfirmation: (
    modalHeader: string,
    action: ReactNode,
    onConfirm: () => Promise<void>,
  ) => void;
}

const Withdraw: React.FC<WithdrawProps> = ({ showConfirmation }) => {
  const { selectedRoundAddress } = useVaultState();
  const selectedRoundState = useRoundState(selectedRoundAddress);
  const [state, setState] = useState({
    activeWithdrawTab: "Unlocked" as WithdrawSubTabs,
  });

  const updateState = (updates: Partial<typeof state>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  return (
    <>
      <div className="flex-col space-y-6 p-6 pb-2">
        <ButtonTabs
          tabs={
            selectedRoundState?.roundState.toString() === "Auctioning" ||
            selectedRoundState?.roundState.toString() === "Running"
              ? ["Unlocked", "Locked", "Stashed"]
              : ["Unlocked", "Stashed"]
          }
          activeTab={state.activeWithdrawTab}
          setActiveTab={(tab) =>
            updateState({ activeWithdrawTab: tab as WithdrawSubTabs })
          }
        />
      </div>
      <div className="h-full flex flex-col">
        {state.activeWithdrawTab === "Unlocked" && (
          <WithdrawLiquidity showConfirmation={showConfirmation} />
        )}

        {(selectedRoundState?.roundState === "Auctioning" ||
          selectedRoundState?.roundState === "Running") &&
          state.activeWithdrawTab === "Locked" && (
            <QueueWithdrawal showConfirmation={showConfirmation} />
          )}
        {state.activeWithdrawTab === "Stashed" && (
          <WithdrawStash showConfirmation={showConfirmation} />
        )}
      </div>
    </>
  );
};

export default Withdraw;
