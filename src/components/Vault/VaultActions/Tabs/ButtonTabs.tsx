import React from "react";
import { TabsProps } from "@/lib/types";

const ButtonTabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => (
  <div className="vault-button-tabs flex space-x-3 mb-4">
    {tabs.map((tab) => (
      <button
        key={tab}
        className={`vault-button-tab px-2 py-2 text-sm rounded-md transition-colors border border-[#373632] ${
          activeTab === tab ? "bg-[#373632] text-[#F5EBB8]" : "text-[#BFBFBF]"
        } text-[14px] font-medium`}
        onClick={() => setActiveTab(tab)}
      >
        {tab}
      </button>
    ))}
  </div>
);

export default ButtonTabs;
