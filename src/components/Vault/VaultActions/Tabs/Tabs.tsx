import React from "react";
import { TabsProps } from "@/lib/types";

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="flex flex-row items-center border-b border-gray-700 align-center justify-left">
    {tabs.map((tab) => (
      <div key={tab} className="flex flex-row">
        <button
          className={`h-[56px] px-6 py-4 relative text-[14px] ${
            activeTab === tab ? "text-[#F5EBB8]" : "text-gray-400"
          }`}
          onClick={() => {
            setActiveTab(tab);
          }}
        >
          {tab}
          {activeTab === tab && (
            <p className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F5EBB8] text-[14px] font-medium"></p>
          )}
        </button>
      </div>
    ))}
  </div>
);

export default Tabs;
