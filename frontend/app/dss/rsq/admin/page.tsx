"use client";

import React, { useState } from "react";

import AreaSelection from "./components/AreaSelection";
import RSQAnalysis from "./components/rsq";
import Map from "./components/Map";
import { LocationProvider, useLocation } from "@/contexts/rsq/admin/LocationContext";
import { MapProvider } from "@/contexts/rsq/admin/MapContext";
import { RSQProvider } from "@/contexts/rsq/admin/RsqContext";

/* ================= TYPES ================= */

interface Step {
  id: number;
  name: string;
}

/* ================= MAIN CONTENT ================= */

function RSQAssessmentContent() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isMobileMapVisible, setIsMobileMapVisible] = useState<boolean>(false);

  const { selectedBlocks, selectedVillages } = useLocation();

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

    if (activeStep === 2 && selectedVillages.length === 0) {
      alert("Please select Villages before proceeding.");
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
      <div className="flex-shrink-0 px-3 sm:px-6 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
            RSQ Assessment
          </h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    activeStep === step.id
                      ? "bg-blue-600 text-white"
                      : activeStep > step.id
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {activeStep > step.id ? "✓" : step.id}
                </div>
                <div className="text-xs mt-1 text-center text-gray-600 hidden sm:block">
                  {step.name}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    activeStep > step.id ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto bg-white mx-2 sm:mx-3 rounded-lg shadow-md min-h-0">
        <div className="p-3 sm:p-6">
          {activeStep === 1 && <AreaSelection />}
          {activeStep === 2 && <RSQAnalysis />}
          {activeStep === 3 && (
            <div className="text-center text-gray-700 font-semibold">
              Final Output & Report (Coming Next)
            </div>
          )}
        </div>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex flex-shrink-0 p-4 bg-white border-t border-gray-200 mx-2 sm:mx-3 mb-2 rounded-b-lg shadow-md">
        <div className="flex gap-2 w-full">
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

  /* ================= RIGHT PANEL (MAP) ================= */

  const rightPanel = (
    <div className="flex flex-col h-full w-full">
      <div className="flex-grow w-full h-full overflow-hidden relative">
        {/* Floating Close Button for Mobile */}
        <button
          onClick={() => setIsMobileMapVisible(false)}
          className="lg:hidden absolute top-3 right-3 z-50 bg-black/60 text-white px-3 py-1 rounded-md"
        >
          ✕
        </button>

        {/* MAP */}
        <div className="w-full h-full mt-2">
          <Map />
        </div>
      </div>
    </div>
  );

  /* ================= RENDER ================= */

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Map Toggle */}
      <div className="flex-shrink-0 lg:hidden mx-2 sm:mx-3 mt-2">
        <button
          onClick={() => setIsMobileMapVisible(!isMobileMapVisible)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isMobileMapVisible ? "Show Data Panel" : "Show Map"}
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex lg:flex-row flex-col overflow-hidden h-full">
        {/* Desktop: 50-50 Split */}
        <div className="hidden lg:flex w-full min-h-0">
          <div className="w-1/2 border-r border-gray-200">{leftPanel}</div>
          <div className="w-1/2">{rightPanel}</div>
        </div>

        {/* Mobile: Toggle */}
        <div className="lg:hidden flex-1 min-h-0 overflow-hidden">
          {isMobileMapVisible ? rightPanel : leftPanel}
        </div>
      </div>

      {/* Mobile Navigation */}
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
      <RSQProvider>
        <MapProvider>
          <RSQAssessmentContent />
        </MapProvider>
      </RSQProvider>
    </LocationProvider>
  );
}