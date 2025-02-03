import { useNewContext } from "@/context/NewProvider";
import useOptionBuyerStateRPC from "../rpc/useOptionBuyerStateRPC";
import { useMemo } from "react";

const useOBState = ()=>{
    const {conn,vaultAddress,wsData,mockData} = useNewContext();
    const obStateRPC = useOptionBuyerStateRPC(vaultAddress);
    const obStateWS = wsData.wsOptionBuyerStates
    const obStateMock = mockData.optionBuyerStates

    const obState = useMemo(()=>{
        if(conn==="mock"){
            return obStateMock
        }
        if(conn==="rpc"){
            return obStateRPC
        }
        return obStateWS
    },[conn,obStateMock,obStateRPC,obStateWS])

    return obState
}

export default useOBState;