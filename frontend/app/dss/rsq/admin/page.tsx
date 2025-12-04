"use client";

import React, { useState } from "react";

import AreaSelection from "./components/AreaSelection";
import Map from "./components/Map";
import { LocationProvider, useLocation } from "@/contexts/rsq/admin/LocationContext";
import { MapProvider } from "@/contexts/rsq/admin/MapContext";

/* ================= TYPES ================= */

interface Step {
  id: number;
  name: string;
}

/* ================= MAIN CONTENT ================= */

function RSQAssessmentContent() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isMobileMapVisible, setIsMobileMapVisible] = useState<boolean>(false);

  const { selectedBlocks } = useLocation();

  const steps: Step[] = [
    { id: 1, name: "Area Selection" },
    { id: 2, name: "RSQ Analysis" },
    { id: 3, name: "Final Output" },
  ];

  const isFirstStep = activeStep === 1;
  const isLastStep = activeStep === steps.length;

  const handleNext = () => {
    if (activeStep === 1 && selectedBlocks.length === 0) {
      alert("Please select State, District, and Block before proceeding.");
      return;
    }

    if (!isLastStep) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setActiveStep((prev) => prev - 1);
    }
  };

  /* ================= LEFT PANEL ================= */

  const leftPanel = (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto bg-white mx-2 sm:mx-3 my-2 rounded-lg shadow-md min-h-0">
        <div className="p-3 sm:p-6">
          {activeStep === 1 && <AreaSelection />}

          {activeStep === 2 && (
            <div className="text-center text-gray-700 font-semibold">
              RSQ Analysis Module (Coming Next)
            </div>
          )}

          {activeStep === 3 && (
            <div className="text-center text-gray-700 font-semibold">
              Final Output & Report (Coming Next)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ================= RIGHT PANEL (✅ MAP ONLY – NO BACKGROUND) ================= */

  const rightPanel = (
    <div className="flex flex-col h-500px w-full">
      {/* ✅ PURE MAP CONTAINER — NO bg, NO shadow, NO rounded */}
      <div className="flex-grow w-full h-full overflow-hidden relative">

        {/* ✅ Floating Close Button for Mobile */}
        <button
          onClick={() => setIsMobileMapVisible(false)}
          className="lg:hidden absolute top-3 right-3 z-50 bg-black/60 text-white px-3 py-1 rounded-md"
        >
          ✕
        </button>

        {/* ✅ MAP ONLY */}
        <div className="w-full h-full mt-2 ">
          <Map />
        </div>
      </div>
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-transparent">
      {/* ================= MOBILE MAP TOGGLE ================= */}
      <div className="flex-shrink-0 lg:hidden mx-2 sm:mx-3 mt-2">
        <button
          onClick={() => setIsMobileMapVisible(!isMobileMapVisible)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isMobileMapVisible ? "Show Data Panel" : "Show Map"}
        </button>
      </div>

      {/* ================= MAIN BODY ================= */}
      <div className="flex-1 flex lg:flex-row flex-col overflow-hidden h-full">
        {/* DESKTOP: 50-50 Map + Controls */}
        <div className="hidden lg:flex w-full min-h-0">
          <div className="w-1/2 border-r border-gray-200">{leftPanel}</div>
          <div className="w-1/2">{rightPanel}</div>
        </div>

        {/* MOBILE: Toggle between panels */}
        <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
          {isMobileMapVisible ? rightPanel : leftPanel}
        </div>
      </div>

      {/* ================= NAVIGATION ================= */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex gap-2 max-w-md mx-auto">
          <button
            onClick={handlePrevious}
            disabled={isFirstStep}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= PROVIDER WRAPPER ================= */

export default function RSQAssessmentAdmin() {
  return (
    <LocationProvider>
      <MapProvider>
        <RSQAssessmentContent />
      </MapProvider>
    </LocationProvider>
  );
}
