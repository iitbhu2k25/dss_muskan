"use client";

import React from "react";
import { DailyProvider } from "@/contexts/extract/Rainfal/State/DailyContext";
import { MapProvider } from "@/contexts/extract/Rainfal/State/MapContext";
import { RainfallSelector } from "./components/selector";
import RainfallMap from "./components/map";
import { DailyRainfallTable } from "./components/daily";

const RainfallPage = () => {
  return (
    <DailyProvider>
      <MapProvider>
        <div className="flex h-screen bg-gradient-to-br from-white via-slate-100 to-gray-100 ">
          
          {/* Left Section (Selector + Table) — 3/10 width */}
          <div className="flex-[6] flex flex-col bg-white border-r border-gray-300 shadow-lg">
            {/* Selector at top */}
            <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
              <RainfallSelector />
              <DailyRainfallTable />
            </div>

            
          </div>

          {/* Right Section (Map) — 7/10 width */}
          <div className="flex-[4] rounded-xl shadow-lg border border-gray-200 overflow-hidden top-0  ">
            {/* //flex-grow m-2 rounded-xl shadow-lg border border-gray-200 overflow-hidden */}
            <RainfallMap />
          </div>
        </div>
      </MapProvider>
    </DailyProvider>
  );
};

export default RainfallPage;
