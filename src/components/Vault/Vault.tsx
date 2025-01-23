"use client";
import RoundPerformanceChart from "./VaultChart/Chart";
import { useState } from "react";
import AuctionIcon from "../Icons/AuctionIcon";
import CoinStackedIcon from "../Icons/CoinStackedIcon";
import PanelRight from "./PanelRight";
import PanelLeft from "./PanelLeft";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import useIsMobile from "@/hooks/window/useIsMobile";
import MobileScreen from "../BaseComponents/MobileScreen";
import { useHelpContext } from "@/context/HelpProvider";
import { HelpBoxPanel } from "../HelpBoxComponents/HelpBoxPanel";
import Hoverable from "../BaseComponents/Hoverable";

export const Vault = () => {
  const [isProviderView, setIsProviderView] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { isMobile } = useIsMobile();
  const router = useRouter();

  if (isMobile) {
    return <MobileScreen />;
  }

  const { isHelpBoxOpen } = useHelpContext();

  return (
    <div className="px-6 py-4 pt-[120px] bg-faded-black-alt flex-grow flex-box overflow-auto">
      <div className="flex flex-row-reverse text-primary">
        <div className="flex flex-row rounded-md border-[1px] border-greyscale-800 h-[55px]">
          <Hoverable
            dataId="userToggleLP"
            onClick={() => {
              setIsProviderView(true);
              setIsEditOpen(false);
            }}
            className={`flex flex-row items-center  justify-center m-[1px] hover:cursor-pointer px-4 py-1 rounded-md text-[14px] w-[115px] ${
              isProviderView ? "bg-primary-900" : ""
            }`}
          >
            <CoinStackedIcon
              classname="mr-2"
              stroke={isProviderView ? "var(--primary)" : "var(--greyscale)"}
            />
            <p
              className={`font-medium ${
                isProviderView ? "text-primary" : "text-greyscale"
              }`}
            >
              Provider
            </p>
          </Hoverable>
          <Hoverable
            dataId="userToggleOB"
            onClick={() => {
              setIsProviderView(false);
              //setIsEditOpen(false);
            }}
            className={`flex flex-row items-center justify-center m-[1px] hover:cursor-pointer px-4 py-1 rounded-md text-[14px] w-[115px] ${
              !isProviderView ? "bg-primary-900" : ""
            }`}
          >
            <AuctionIcon
              classname="mr-2"
              fill={isProviderView ? "var(--greyscale)" : "var(--primary)"}
            />
            <p
              className={`font-medium ${
                !isProviderView ? "text-primary" : "text-greyscale"
              }`}
            >
              Buyer
            </p>
          </Hoverable>
        </div>

        <div className="flex flex-row items-center ml-[16px] mr-[auto] text-[16px] font-medium text-[#FAFAFA]">
          Vault Details
        </div>
        <Hoverable
          dataId="logo"
          className="hover-zoom-small flex items-center justify-center"
        >
          <div
            onClick={() => {
              router.push("/");
            }}
            className="flex items-center justify-center w-[44px] h-[44px] border border-[#262626] rounded-lg cursor-pointer"
          >
            <ChevronLeft className="w-[16px] h-[16px] stroke-[#F5EBB8]" />
          </div>
        </Hoverable>
      </div>
      <div className="mt-6 flex flex-row">
        {<PanelLeft userType={isProviderView ? "lp" : "ob"} />}
        {
          //Update the roundState to multiple roundStates and set selected round in the component
        }
        <RoundPerformanceChart />

        <div className="w-full ml-6 max-w-[350px] flex flex-col max-h-[834px]">
          <div
            className={`
              bg-[#121212] border border-[#262626] rounded-lg flex flex-col
              ${isHelpBoxOpen ? "h-[60%]" : "h-[100%]"} transition-all duration-300
            `}
          >
            <PanelRight
              userType={isProviderView ? "lp" : "ob"}
              isEditOpen={isEditOpen}
              setIsEditOpen={setIsEditOpen}
            />
          </div>
          {isHelpBoxOpen && (
            <div className="mt-6">
              <HelpBoxPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
