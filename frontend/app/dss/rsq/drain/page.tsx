"use client";

import React, { useState } from "react";
import DataSelection from "./components/DataSelection";
import Map from "./components/Map";
import ResizablePanels from "./components/resizable-panels";
import { LocationProvider } from "@/contexts/rsq/drain/LocationContext";
import { MapProvider } from "@/contexts/rsq/drain/MapContext";
import RSQAnalysis from "./components/rsq";
import { RSQProvider } from "@/contexts/rsq/drain/RsqContext";


// page.tsx
function AreaSelectionWithMap() {
  const [isMobileMapVisible, setIsMobileMapVisible] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const leftPanel = (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto bg-white mx-2 sm:mx-3 my-2 rounded-lg shadow-md">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Area Selection
          </h2>
          <DataSelection
            step={1}
            onLocationConfirmed={() => setLocationConfirmed(true)}
          />
        </div>
        {/* Toggle Location Visibility Button */}
      
  

      {/* RSQ Analysis - Only show after location confirmed */}
      {locationConfirmed && <RSQAnalysis />}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="flex flex-col h-full px-2 sm:px-3">
      <div className="flex-grow relative mt-3 mb-3">
        <div className="w-full h-full rounded-2xl border border-gray-300 shadow-lg overflow-hidden bg-white">
          <Map />
        </div>
      </div>

      
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile Toggle */}
      <div className="lg:hidden mx-2 sm:mx-3 mt-2">
        <button
          onClick={() => setIsMobileMapVisible(!isMobileMapVisible)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg"
        >
          {isMobileMapVisible ? "Show Area Selection" : "Show Map"}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Desktop */}
        <div className="hidden lg:block flex-grow min-h-0">
          <ResizablePanels left={leftPanel} right={rightPanel} />
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex-grow overflow-hidden">
          {isMobileMapVisible ? rightPanel : leftPanel}
        </div>
      </div>
    </div>
  );
}

export default function RSQAssessmentDrain() {
  return (
    <LocationProvider>
      <RSQProvider>
        <MapProvider>
          <AreaSelectionWithMap />
        </MapProvider>
      </RSQProvider>
    </LocationProvider>
  );
}
