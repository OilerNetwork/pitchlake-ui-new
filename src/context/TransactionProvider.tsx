"use client";
import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useWaitForTransaction } from "@starknet-react/core";


/*This is the bridge for any transactions to go through, it's disabled by isTxDisabled if there is data loading or if
  there's a pending transaction. The data loading is enforced to ensure no transaction is done without latest data.
  Add pendingStates from any critical data here and add it in the subsequent hooks
*/
//Possible Updates:
//Make transactions accepted only after 2 confirmations

export type TransactionContextType = {
  isTxDisabled: boolean;
  pendingTx: string | undefined;
  setIsTxDisabled: Dispatch<SetStateAction<boolean>>;
  setPendingTx: Dispatch<SetStateAction<string | undefined>>;
  status: "error" | "success" | "pending";
};

export const TransactionContext = createContext<TransactionContextType>(
  {} as TransactionContextType,
);
const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [isTxDisabled, setIsTxDisabled] = useState<boolean>(false);

  const [pendingTx, setPendingTx] = useState<string | undefined>();
  const { status,data } = useWaitForTransaction({ hash: pendingTx });

  const resetState = () => {
    
    setPendingTx(undefined);
    setIsTxDisabled(false);
  };
  const clearTransaction = async() => {
    
    resetState();
  };

  useEffect(() => {
    if (pendingTx)
      switch (status) {
        case "pending":
          break;
        case "success":
          clearTransaction();
          break;
        case "error":
        default:
          const render = "Transaction failed " + (pendingTx || "");
          clearTransaction();
          break;
      }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTx, status]);

  useEffect(() => {
    setIsTxDisabled(!!pendingTx);
  }, [pendingTx]);

  //Takes data from pendingState maintained in the context to send a replacement transaction

  return (
    <TransactionContext.Provider
      value={{
        isTxDisabled,
        pendingTx,
        setIsTxDisabled,
        setPendingTx,
        status,

      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
export const useTransactionContext = () => useContext(TransactionContext);
export default TransactionProvider;
