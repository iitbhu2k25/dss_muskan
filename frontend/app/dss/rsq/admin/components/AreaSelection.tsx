"use client";

import React, { useMemo, useState } from "react";
import MultiSelect from "./Multiselect";
import { useLocation } from "@/contexts/rsq/admin/LocationContext";

interface AreaSelectionProps {
  onAreaConfirmed?: () => void;
}

const AreaSelection: React.FC<AreaSelectionProps> = ({ onAreaConfirmed }) => {
  const {
    states,
    districts,
    blocks,
    villages,
    selectedState,
    selectedDistricts,
    selectedBlocks,
    isLoading,
    error,
    handleStateChange,
    setSelectedDistricts,
    setSelectedBlocks,
    resetSelections,
  } = useLocation();

  // ✅ LOCAL CONFIRM STATE
  const [areaConfirmed, setAreaConfirmed] = useState(false);
  const selectionsLocked = areaConfirmed;

  // ✅ LOCAL VILLAGE STATE
  const [selectedVillages, setSelectedVillages] = useState<number[]>([]);

  // ✅ SORT STATES (ID 9 FIRST)
  const sortedStates = useMemo(() => {
    const copy = [...states];
    const index = copy.findIndex((s) => Number(s.id) === 9);
    if (index !== -1) {
      const [target] = copy.splice(index, 1);
      return [target, ...copy];
    }
    return copy;
  }, [states]);

  const allowedDistrictIds = [179, 152, 120, 174, 187];

  const isStateSelectable = (stateId: string | number): boolean => {
    return Number(stateId) === 9;
  };

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    if (selectionsLocked) return;
    const stateId = parseInt(e.target.value);
    if (stateId === 9 || e.target.value === "") {
      handleStateChange(stateId);
      setSelectedVillages([]);
    }
  };

  // ✅ DISTRICT SORTING + DISABLED
  const sortedEnhancedDistricts = useMemo(() => {
    const available: any[] = [];
    const unavailable: any[] = [];

    districts.forEach((district) => {
      const id = Number(district.id);
      const isAllowed = allowedDistrictIds.includes(id);

      const enhanced = {
        ...district,
        name: `${district.name}${!isAllowed ? " (Not Available)" : ""}`,
        __isUnavailable: !isAllowed,
        __itemClass: !isAllowed ? "text-gray-400" : "",
      };

      isAllowed ? available.push(enhanced) : unavailable.push(enhanced);
    });

    return [...available, ...unavailable];
  }, [districts]);

  const handleDistrictsChange = (ids: number[]) => {
    if (selectionsLocked) return;
    const validIds = ids.filter((id) => allowedDistrictIds.includes(id));
    setSelectedDistricts(validIds);
  };

  const handleBlocksChange = (ids: number[]) => {
    if (selectionsLocked) return;
    setSelectedBlocks(ids);
    if (ids.length === 0) setSelectedVillages([]);
  };

  const handleVillagesChange = (ids: number[]) => {
    if (selectionsLocked) return;
    setSelectedVillages(ids);
  };

  const handleConfirmSelection = () => {
    setAreaConfirmed(true);
    if (onAreaConfirmed) onAreaConfirmed();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Area Selection
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* ✅ STATE */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            State:
          </label>
          <select
            className="w-full p-2 text-sm border border-blue-500 rounded-md"
            value={selectedState || ""}
            onChange={handleStateSelect}
            disabled={isLoading || selectionsLocked}
          >
            <option value="">--Choose a State--</option>
            {sortedStates.map((state) => (
              <option
                key={state.id}
                value={state.id}
                disabled={!isStateSelectable(state.id)}
              >
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ DISTRICT */}
        <MultiSelect
          items={sortedEnhancedDistricts}
          selectedItems={selectedDistricts}
          onSelectionChange={handleDistrictsChange}
          label="District"
          placeholder="--Choose Districts--"
          disabled={!selectedState || isLoading || selectionsLocked}
          itemClassName={(item: any) => item.__itemClass}
          itemDisabled={(item: any) => item.__isUnavailable}
        />

        {/* ✅ BLOCK */}
        <MultiSelect
          items={blocks}
          selectedItems={selectedBlocks}
          onSelectionChange={handleBlocksChange}
          label="Block"
          placeholder="--Choose Blocks--"
          disabled={selectedDistricts.length === 0 || isLoading || selectionsLocked}
        />
      </div>

      {/* ✅ VILLAGES */}
      <MultiSelect
        items={villages}
        selectedItems={selectedVillages}
        onSelectionChange={handleVillagesChange}
        label="Village"
        placeholder="--Choose Villages--"
        disabled={selectedBlocks.length === 0 || isLoading || selectionsLocked}
      />

      

      {/* ✅ BUTTONS */}
      <div className="flex justify-end gap-4 mt-6">
        {selectedVillages.length > 0 && !areaConfirmed && (
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
            onClick={handleConfirmSelection}
          >
            Confirm Selection
          </button>
        )}

        <button
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded"
          onClick={() => {
            resetSelections();
            setSelectedVillages([]);
            setAreaConfirmed(false);
          }}
        >
          Reset Selection
        </button>
      </div>
    </div>
  );
};

export default AreaSelection;
