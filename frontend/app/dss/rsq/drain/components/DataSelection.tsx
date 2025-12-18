"use client";

import React, { useState } from "react";
import AreaSelection from "./AreaSelection";
import { useLocation } from "@/contexts/rsq/drain/LocationContext";

interface DataSelectionProps {
  step: number;
  onConfirm?: (selectedData: any) => void;
  onReset?: () => void;
  onLocationConfirmed?: () => void; // NEW
}

const DataSelection: React.FC<DataSelectionProps> = ({
  step,
  onConfirm,
  onReset,
  onLocationConfirmed,
}) => {
  const { areaConfirmed, lockSelections, resetSelections } = useLocation();
  const [finalConfirmed, setFinalConfirmed] = useState(false);

  const handleAreaConfirmed = () => {
    console.log("Area confirmed, can now proceed to well selection");
    // notify parent (page.tsx) that location is confirmed
    onLocationConfirmed?.();
  };

  const handleWellsConfirmed = (data: any) => {
    console.log("Wells confirmed:", data);
    setFinalConfirmed(true);
    lockSelections();

    if (onConfirm) {
      onConfirm(data);
    }
  };

  const handleResetAll = () => {
    console.log("Resetting all data selection...");
    setFinalConfirmed(false);
    resetSelections();

    if (onReset) {
      onReset();
    }
  };

  const handleResetWells = () => {
    console.log("Resetting well selection only...");
    setFinalConfirmed(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto space-y-4">
        {/* Step 1: Area Selection - Always visible, disabled after confirmation */}
        <div className={areaConfirmed ? "opacity-75" : ""}>
          <AreaSelection onAreaConfirmed={handleAreaConfirmed} />
        </div>

        {/* Step 2: Well Selection - to be added here, using:
            - handleWellsConfirmed
            - handleResetWells
            and driven by areaConfirmed / finalConfirmed */}
      </div>

      {/* Optional global reset button area, if you want to expose it here:
          <div className="mt-4">
            <button onClick={handleResetAll}>Reset All</button>
          </div>
      */}
    </div>
  );
};

export default DataSelection;
