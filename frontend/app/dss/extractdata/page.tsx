"use client";

import React from "react";
import { DailyProvider } from "@/contexts/extract/Rainfal/RaifallContext";
import { MapProvider } from "@/contexts/extract/Rainfal/MapContext";
import { RainfallSelector } from "./rainfall/components/selector";
import RainfallMap from "./rainfall/components/map";
import { DailyRainfallTable } from "./rainfall/components/daily";

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
          <div className="flex-[4] rounded-xl shadow-lg border border-gray-200 overflow-hidden top-0">
            <RainfallMap />
          </div>
        </div>
      </MapProvider>
    </DailyProvider>
  );
};

export default RainfallPage;
