// components/WaterDemandForm.tsx
'use client';

import { result } from 'lodash';
import React, { useState, useEffect } from 'react';

interface InstitutionalFields {
  hospitals100Units: string;
  beds100: string;
  hospitalsLess100: string;
  bedsLess100: string;
  hotels: string;
  bedsHotels: string;
  hostels: string;
  residentsHostels: string;
  nursesHome: string;
  residentsNursesHome: string;
  boardingSchools: string;
  studentsBoardingSchools: string;
  restaurants: string;
  seatsRestaurants: string;
  airportsSeaports: string;
  populationLoadAirports: string;
  junctionStations: string;
  populationLoadJunction: string;
  terminalStations: string;
  populationLoadTerminal: string;
  intermediateBathing: string;
  populationLoadBathing: string;
  intermediateNoBathing: string;
  populationLoadNoBathing: string;
  daySchools: string;
  studentsDaySchools: string;
  offices: string;
  employeesOffices: string;
  factorieswashrooms: string;
  employeesFactories: string;
  factoriesnoWashrooms: string;
  employeesFactoriesNoWashrooms: string;
  cinemas: string;
  seatsCinemas: string;
  // Add more fields as needed...
}

interface FirefightingMethods {
  Kuchling: boolean;
  Freeman: boolean;
  Buston: boolean;
  American_insurance: boolean;
  Ministry_urban: boolean;
}
// Add this interface at the top with other interfaces
interface WaterDemandFormProps {
  onPerCapitaConsumptionChange?: (value: number) => void;
  onSeasonalMultipliersChange?: (multipliers: any) => void; // Add this line
  onWaterDemandResultsChange?: (results: any) => void; // Add this line
  onFloatingSeasonalDemandsChange?: (seasonalDemands: any) => void; // Add this line
  onDomesticSeasonalDemandsChange?: (seasonalDemands: any) => void; // Add this
}
const WaterDemandForm: React.FC<WaterDemandFormProps> = ({
  onPerCapitaConsumptionChange,
  onSeasonalMultipliersChange,
  onWaterDemandResultsChange, // Add this
  onFloatingSeasonalDemandsChange // Add this
}) => {
  // State for overall checkboxes
  const [domesticChecked, setDomesticChecked] = useState(false);
  const [floatingChecked, setFloatingChecked] = useState(false);
  const [institutionalChecked, setInstitutionalChecked] = useState(false);
  const [firefightingChecked, setFirefightingChecked] = useState(false);

  // Domestic per capita consumption (default 135)
  const [perCapitaConsumption, setPerCapitaConsumption] = useState(135);
  // Add after perCapitaConsumption state
  const [seasonalMultipliers, setSeasonalMultipliers] = useState({
    summer: 1.10,
    monsoon: 0.95,
    postMonsoon: 1.00,
    winter: 0.90
  });

  // Add state to show/hide seasonal breakdown table
  const [showSeasonalBreakdown, setShowSeasonalBreakdown] = useState(false);
  // Floating fields
  const [floatingPopulationPercentage, setFloatingPopulationPercentage] = useState<number>(15);
  // Add after domestic seasonalMultipliers state
  const [floatingSeasonalMultipliers, setFloatingSeasonalMultipliers] = useState({
    summer: 1.15,    // Higher in summer due to tourism/travel
    monsoon: 1.25,   // Lower in monsoon due to reduced travel
    postMonsoon: 1.10,
    winter: 0.85
  });
  const [facilityType, setFacilityType] = useState('provided');
  // Add after showSeasonalBreakdown state
  const [showFloatingSeasonalBreakdown, setShowFloatingSeasonalBreakdown] = useState(false);
  // New state for institutional input mode (manual or total)
  const [institutionalInputMode, setInstitutionalInputMode] = useState<'manual' | 'total'>('manual');
  const [totalInstitutionalDemand, setTotalInstitutionalDemand] = useState<string>("0");

  // Institutional fields (sample fields; add more as needed)
  const [institutionalFields, setInstitutionalFields] = useState<InstitutionalFields>({
    hospitals100Units: "0",
    beds100: "0",
    hospitalsLess100: "0",
    bedsLess100: "0",
    hotels: "0",
    bedsHotels: "0",
    hostels: "0",
    residentsHostels: "0",
    nursesHome: "0",
    residentsNursesHome: "0",
    boardingSchools: "0",
    studentsBoardingSchools: "0",
    restaurants: "0",
    seatsRestaurants: "0",
    airportsSeaports: "0",
    populationLoadAirports: "0",
    junctionStations: "0",
    populationLoadJunction: "0",
    terminalStations: "0",
    populationLoadTerminal: "0",
    intermediateBathing: "0",
    populationLoadBathing: "0",
    intermediateNoBathing: "0",
    populationLoadNoBathing: "0",
    daySchools: "0",
    studentsDaySchools: "0",
    offices: "0",
    employeesOffices: "0",
    factorieswashrooms: "0",
    employeesFactories: "0",
    factoriesnoWashrooms: "0",
    employeesFactoriesNoWashrooms: "0",
    cinemas: "0",
    seatsCinemas: "0",
    // Add more fields as needed...
  });

  // Firefighting methods selection
  const [firefightingMethods, setFirefightingMethods] = useState<FirefightingMethods>({
    Kuchling: false,
    Freeman: false,
    Buston: false,
    American_insurance: false,
    Ministry_urban: false,
  });


  const [domesticDemand, setDomesticDemand] = useState<any>(null);
  const [floatingDemand, setFloatingDemand] = useState<any>(null);
  const [institutionalDemand, setInstitutionalDemand] = useState<{ [year: string]: number } | null>(null);
  const [firefightingDemand, setFirefightingDemand] = useState<{ [method: string]: { [year: string]: number } } | null>(null);
  const [selectedFirefightingMethod, setSelectedFirefightingMethod] = useState<string>("");
  // Helper function to format method names (remove underscores and capitalize)
  const formatMethodName = (method: string): string => {
    return method
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  // Add a loading state to prevent multiple concurrent API calls
  const [isCalculating, setIsCalculating] = useState(false);

  // Add states to track when inputs have changed
  const [domesticInputChanged, setDomesticInputChanged] = useState(false);
  const [floatingInputChanged, setFloatingInputChanged] = useState(false);
  const [institutionalInputChanged, setInstitutionalInputChanged] = useState(false);
  const [firefightingInputChanged, setFirefightingInputChanged] = useState(false);

  // Add a state to track if initial calculation has been performed
  const [initialCalculationDone, setInitialCalculationDone] = useState(false);
  // New state to track the last known forecast data-----------------------h
  const [lastForecastData, setLastForecastData] = useState<{ [year: string]: number } | null>(null);



  const forecastData = typeof window !== 'undefined' ? (window as any).selectedPopulationForecast : null;



  // Handlers for checkboxes and inputs
  const handleDomesticChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomesticChecked(e.target.checked);
    setDomesticInputChanged(true);
  };

  const handlePerCapitaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setPerCapitaConsumption(newValue);
    setDomesticInputChanged(true);

    // Call the callback to pass value to parent
    if (onPerCapitaConsumptionChange) {
      onPerCapitaConsumptionChange(newValue);
    }
  };
  // Update the handleSeasonalMultiplierChange function
  const handleSeasonalMultiplierChange = (season: string, value: number) => {
    const newMultipliers = {
      ...seasonalMultipliers,
      [season]: value
    };
    setSeasonalMultipliers(newMultipliers);
    setDomesticInputChanged(true);

    // Call the callback to pass value to parent
    if (onSeasonalMultipliersChange) {
      onSeasonalMultipliersChange(newMultipliers);
    }
  };
  // Add after handleSeasonalMultiplierChange
  const handleFloatingSeasonalMultiplierChange = (season: string, value: number) => {
    setFloatingSeasonalMultipliers({
      ...floatingSeasonalMultipliers,
      [season]: value
    });
    setFloatingInputChanged(true);
  };

  const handleFloatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFloatingChecked(e.target.checked);
    setFloatingInputChanged(true);
  };

  const handleFloatingPopulationPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFloatingPopulationPercentage(Number(e.target.value));
    setFloatingInputChanged(true);
  };

  const handleFacilityTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFacilityType(e.target.value);
    setFloatingInputChanged(true);
  };

  const handleInstitutionalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInstitutionalChecked(e.target.checked);
    setInstitutionalInputChanged(true);
  };

  // Handler for institutional input mode
  const handleInstitutionalInputModeChange = (mode: 'manual' | 'total') => {
    setInstitutionalInputMode(mode);
    setInstitutionalInputChanged(true);
  };

  // Handler for total institutional demand value
  const handleTotalInstitutionalDemandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalInstitutionalDemand(e.target.value);
    setInstitutionalInputChanged(true);
  };

  const handleInstitutionalFieldChange = (field: keyof InstitutionalFields, value: string) => {
    setInstitutionalFields({
      ...institutionalFields,
      [field]: value,
    });
    setInstitutionalInputChanged(true);
  };

  const handleFirefightingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFirefightingChecked(e.target.checked);
    setFirefightingInputChanged(true);
  };

  const handleFirefightingMethodChange = (method: keyof FirefightingMethods, checked: boolean) => {
    setFirefightingMethods({
      ...firefightingMethods,
      [method]: checked,
    });
    setFirefightingInputChanged(true);
  };

  // Also add useEffect to pass initial values when component mounts
  useEffect(() => {
    if (onSeasonalMultipliersChange) {
      onSeasonalMultipliersChange(seasonalMultipliers);
    }
  }, []); // Empty dependency array to run only on mount
  // Setup useEffect to auto-calculate when relevant inputs change
  // These will only run if initialCalculationDone is true
  // Update this useEffect:
  useEffect(() => {
    if (initialCalculationDone && domesticInputChanged && domesticChecked) {
      calculateDomesticDemand();
      setDomesticInputChanged(false);
    }
  }, [domesticChecked, perCapitaConsumption, seasonalMultipliers, domesticInputChanged, initialCalculationDone]);

  // Update this floatinguseEffect:
  useEffect(() => {
    if (initialCalculationDone && floatingInputChanged && floatingChecked) {
      calculateFloatingDemand();
      setFloatingInputChanged(false);
    }
  }, [floatingChecked, floatingPopulationPercentage, facilityType, floatingSeasonalMultipliers, floatingInputChanged, initialCalculationDone]);

  useEffect(() => {
    if (initialCalculationDone && institutionalInputChanged && institutionalChecked) {
      calculateInstitutionalDemand();
      setInstitutionalInputChanged(false);
    }
  }, [
    institutionalChecked,
    institutionalInputMode,
    totalInstitutionalDemand,
    institutionalFields,
    institutionalInputChanged,
    initialCalculationDone
  ]);

  useEffect(() => {
    if (initialCalculationDone && firefightingInputChanged && firefightingChecked) {
      calculateFirefightingDemand();
      setFirefightingInputChanged(false);
    }
  }, [firefightingChecked, firefightingMethods, firefightingInputChanged, initialCalculationDone]);

  // Effect to update the total demand whenever any component demand changes
  useEffect(() => {
    updateTotalDemand();
  }, [domesticDemand, floatingDemand, institutionalDemand, firefightingDemand, selectedFirefightingMethod]);

  // Also add useEffect to pass initial floating seasonal data when available
  useEffect(() => {
    if (onFloatingSeasonalDemandsChange && floatingDemand?.seasonal_demands) {
      onFloatingSeasonalDemandsChange(floatingDemand.seasonal_demands);
    }
  }, [floatingDemand?.seasonal_demands, onFloatingSeasonalDemandsChange]);

  // New useEffect to detect changes in forecastData------------------------h
  useEffect(() => {
    // Only run if initialCalculationDone is true to avoid unnecessary calculations on mount
    if (initialCalculationDone && forecastData !== lastForecastData) {
      // Update lastForecastData
      setLastForecastData(forecastData);

      // Trigger calculations for enabled components
      if (domesticChecked) {
        calculateDomesticDemand();
      }
      if (floatingChecked) {
        calculateFloatingDemand();
      }
      if (institutionalChecked) {
        calculateInstitutionalDemand();
      }
      if (firefightingChecked) {
        calculateFirefightingDemand();
      }
    }
  }, [forecastData, initialCalculationDone]);


  // Function to calculate domestic water demand
  // Function to calculate domestic water demand
  // Replace the body content of calculateDomesticDemand with:
  const calculateDomesticDemand = async () => {
    if (!forecastData || isCalculating || !domesticChecked) return;

    setIsCalculating(true);
    try {
      const requestBody = {
        forecast_data: forecastData,
        per_capita_consumption: perCapitaConsumption,
        seasonal_multipliers: seasonalMultipliers
      };

      const response = await fetch('/django/domestic_water_demand/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Domestic HTTP error! Status: ${response.status}`);
      }
      const domesticDemandResult = await response.json();
      //console.log("Domestic Water Demand (from backend):", domesticDemandResult);
      setDomesticDemand(domesticDemandResult);
      // Store result globally
      (window as any).domesticWaterDemand = domesticDemandResult;
    } catch (error) {
      //console.log("Error calculating domestic water demand:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to calculate floating water demand
  // Replace the entire calculateFloatingDemand function:
  const calculateFloatingDemand = async () => {
    if (!forecastData || isCalculating || !floatingChecked) return;

    setIsCalculating(true);
    try {
      const requestBody = {
        floating_population_percentage: floatingPopulationPercentage,
        facility_type: facilityType,
        domestic_forecast: forecastData,
        seasonal_multipliers: floatingSeasonalMultipliers
      };

      const floatingResponse = await fetch('/django/floating_water_demand/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!floatingResponse.ok) {
        throw new Error(`Floating HTTP error! Status: ${floatingResponse.status}`);
      }

      const floatingDemandResult = await floatingResponse.json();
      //console.log("Floating Water Demand (from backend):", floatingDemandResult);
      setFloatingDemand(floatingDemandResult);
      // Store result globally
      (window as any).floatingWaterDemand = floatingDemandResult;
    } catch (error) {
      //console.log("Error calculating floating water demand:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to calculate institutional water demand
  const calculateInstitutionalDemand = async () => {
    if (!forecastData || isCalculating || !institutionalChecked) return;

    setIsCalculating(true);
    try {
      let institutionalResult: { [year: string]: number };///////fixing here
      if (institutionalInputMode === 'manual') {
        const institutionalResponse = await fetch('/django/institutional_water_demand/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            institutional_fields: institutionalFields,
            domestic_forecast: forecastData,
          }),
        });

        if (!institutionalResponse.ok) {
          throw new Error(`Institutional HTTP error! Status: ${institutionalResponse.status}`);
        }

        institutionalResult = await institutionalResponse.json();
        //console.log("Institutional Water Demand (from backend):", institutionalResult);
      } else {
        // For 'total' mode, create a demand object based on the single value provided
        const baseYear = Object.keys(forecastData).sort()[0];
        const totalDemand = parseFloat(totalInstitutionalDemand);

        if (isNaN(totalDemand)) {
          //console.log("Invalid total institutional demand value");
          return;
        }

        // Create a demand object with the same growth pattern as the population
        institutionalResult = {};
        Object.keys(forecastData).forEach(year => {
          const populationRatio = forecastData[year] / forecastData[baseYear];
          institutionalResult[year] = totalDemand * populationRatio;
        });

        //console.log("Total Institutional Water Demand (calculated):", institutionalResult);
      }
      setInstitutionalDemand(institutionalResult);
      // Store result globally
      (window as any).institutionalWaterDemand = institutionalResult;
    } catch (error) {
      // console.log("Error calculating institutional water demand:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to calculate firefighting water demand
  const calculateFirefightingDemand = async () => {
    if (!forecastData || isCalculating || !firefightingChecked) return;

    setIsCalculating(true);
    try {
      const response = await fetch('/django/firefighting_water_demand/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firefighting_methods: firefightingMethods,
          domestic_forecast: forecastData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Firefighting HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      //console.log("Firefighting Water Demand (from backend):", result);
      setFirefightingDemand(result);
      // Store result globally
      (window as any).firefightingWaterDemand = result;

      // If no firefighting method is selected yet but we have results, select the first one
      if (!selectedFirefightingMethod && result && Object.keys(result).length > 0) {
        setSelectedFirefightingMethod(Object.keys(result)[0]);
      }
    } catch (error) {
      //console.log("Error calculating firefighting water demand:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Function to update the total demand
  const updateTotalDemand = () => {
    if (!forecastData) return;

    const totalDemand: { [year: string]: number } = {};
    const waterDemandResults = {
      domestic: domesticDemand,
      floating: floatingDemand,
      institutional: institutionalDemand,
      firefighting: firefightingDemand,
      selectedFirefightingMethod: selectedFirefightingMethod
    };

    Object.keys(forecastData).sort().forEach(year => {
      // FIXED: Domestic demand access
      const domesticVal = domesticChecked && domesticDemand
        ? (domesticDemand.base_demand?.[year] || 0)
        : 0;

      // FIXED: Floating demand access  
      const floatingVal = floatingChecked && floatingDemand
        ? (floatingDemand.base_demand?.[year] || 0)
        : 0;

      // Institutional demand (direct access)
      const institutionalVal = institutionalChecked && institutionalDemand?.[year] ? institutionalDemand[year] : 0;

      // Firefighting demand (nested access)
      const firefightingVal =
        firefightingChecked && selectedFirefightingMethod && firefightingDemand?.[selectedFirefightingMethod]?.[year]
          ? firefightingDemand[selectedFirefightingMethod][year]
          : 0;

      totalDemand[year] = domesticVal + floatingVal + institutionalVal + firefightingVal;

      // DEBUG: Add console.log to check values
      // console.log(`Year ${year}:`, {
      //   domestic: domesticVal,
      //   floating: floatingVal,
      //   institutional: institutionalVal,
      //   firefighting: firefightingVal,
      //   total: totalDemand[year]
      // });
    });

    // Store in window object for other components to access
    (window as any).totalWaterDemand = totalDemand;

    // Pass water demand results to parent
    if (onWaterDemandResultsChange) {
      onWaterDemandResultsChange(waterDemandResults);
    }

    // Pass floating seasonal demands to parent if available
    if (onFloatingSeasonalDemandsChange && floatingDemand?.seasonal_demands) {
      onFloatingSeasonalDemandsChange(floatingDemand.seasonal_demands);
    }
  };

  // Manual calculation handler for button
  const handleCalculate = () => {
    // Set the initialCalculationDone flag to true
    setInitialCalculationDone(true);

    if (domesticChecked) {
      calculateDomesticDemand();
    }

    if (floatingChecked) {
      calculateFloatingDemand();
    }

    if (institutionalChecked) {
      calculateInstitutionalDemand();
    }

    if (firefightingChecked) {
      calculateFirefightingDemand();
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-gradient-to-br from-white to-gray-50 shadow-lg">
      <div className="flex items-center mb-4">
        <h3 className="text-2xl font-bold text-gray-800">Water Demand Calculation</h3>
        <div className="relative ml-2 group">
          <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>
          <div className="absolute z-10 hidden group-hover:block w-72 text-gray-700 text-xs rounded-lg p-3 bg-white shadow-xl -mt-8 left-6 border border-gray-200">
            Water demand calculation helps determine the total water requirements for different sectors including domestic, floating population, institutional, and firefighting needs.
          </div>
        </div>
      </div>

      {/* Demand Component Checkboxes */}
      <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
        <h4 className="font-semibold text-lg text-blue-700 mb-3">Select Demand Components</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center p-2 border rounded-lg bg-white hover:bg-blue-50 transition-colors cursor-pointer">
            <input type="checkbox" checked={domesticChecked} onChange={handleDomesticChange} className="mr-2" />
            <span className="font-medium">Domestic</span>
          </label>
          <label className="flex items-center p-2 border rounded-lg bg-white hover:bg-blue-50 transition-colors cursor-pointer">
            <input type="checkbox" checked={floatingChecked} onChange={handleFloatingChange} className="mr-2" />
            <span className="font-medium">Floating</span>
          </label>
          <label className="flex items-center p-2 border rounded-lg bg-white hover:bg-blue-50 transition-colors cursor-pointer">
            <input type="checkbox" checked={institutionalChecked} onChange={handleInstitutionalChange} className="mr-2" />
            <span className="font-medium">Institutional</span>
          </label>
          <label className="flex items-center p-2 border rounded-lg bg-white hover:bg-blue-50 transition-colors cursor-pointer">
            <input type="checkbox" checked={firefightingChecked} onChange={handleFirefightingChange} className="mr-2" />
            <span className="font-medium">Firefighting</span>
          </label>
        </div>
      </div>

      {/* Domestic Fields */}
      {/* Domestic Fields */}
      {domesticChecked && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h4 className="font-semibold text-lg text-blue-700 mb-3">Domestic Water Demand</h4>

          {/* Base Per Capita Consumption */}
          <div className="mb-4">
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mr-3">
                Per Capita Consumption (LPCD):
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={perCapitaConsumption}
                  onChange={handlePerCapitaChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 w-24 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="0"
                />

                {/* Info icon with hover table */}
                <div className="relative inline-block ml-2 group z-50">
                  <span className="flex items-center justify-center h-5 w-5 text-sm bg-blue-600 text-white rounded-full cursor-help transition-transform hover:scale-110">i</span>

                  {/* Hover table positioned above the icon */}
                  <div className="absolute z-5000 hidden group-hover:block w-106 text-xs rounded bottom-6 left-0 mr-100 transform translate-x-1/2 mt-5">
                    <table className="table-fixed border-collapse border border-black w-full text-center text-xs p-0 bg-white mt-4 z-5000 shadow-xl">
                      <caption className="caption-top font-serif font-bold text-base mb-2">
                        Recommended Per Capita Water Supply Levels for Designing Schemes
                      </caption>
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black p-1 w-1/12">S. No.</th>
                          <th className="border border-black p-1 w-7/12">Classification of towns / cities</th>
                          <th className="border border-black p-1 w-4/12">Recommended Maximum Water Supply Levels (lpcd)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-black p-1">1.</td>
                          <td className="border border-black p-1 text-left">
                            Towns provided with piped water supply but without sewerage system
                          </td>
                          <td className="border border-black p-1">70</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1">2.</td>
                          <td className="border border-black p-1 text-left">
                            Cities provided with piped water supply where sewerage system is existing/contemplated
                          </td>
                          <td className="border border-black p-1">135</td>
                        </tr>
                        <tr>
                          <td className="border border-black p-1">3.</td>
                          <td className="border border-black p-1 text-left">
                            Metropolitan and Mega cities provided with piped water supply where sewerage system is existing/contemplated
                          </td>
                          <td className="border border-black p-1">150</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seasonal Multipliers Table */}
          <div className="p-3 bg-white rounded-lg border">
            <h5 className="font-semibold text-gray-700 mb-3">Seasonal Multipliers:</h5>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Season</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Multiplier</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Effective Demand (LPCD)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Summer (Apr-Jun)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={seasonalMultipliers.summer}
                        onChange={(e) => handleSeasonalMultiplierChange('summer', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(perCapitaConsumption * seasonalMultipliers.summer).toFixed(1)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Monsoon (Jul-Sep)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={seasonalMultipliers.monsoon}
                        onChange={(e) => handleSeasonalMultiplierChange('monsoon', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(perCapitaConsumption * seasonalMultipliers.monsoon).toFixed(1)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Post-Monsoon (Oct-Nov)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={seasonalMultipliers.postMonsoon}
                        onChange={(e) => handleSeasonalMultiplierChange('postMonsoon', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(perCapitaConsumption * seasonalMultipliers.postMonsoon).toFixed(1)}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Winter (Dec-Mar)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={seasonalMultipliers.winter}
                        onChange={(e) => handleSeasonalMultiplierChange('winter', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(perCapitaConsumption * seasonalMultipliers.winter).toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>




        </div>
      )}
      {/* Floating Fields */}
      {floatingChecked && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h4 className="font-semibold text-lg text-blue-700 mb-3">Floating Water Demand</h4>

          {/* Floating Population Percentage Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mr-3">
              Floating Population Percentage (%):
            </label>
            <input
              type="number"
              value={floatingPopulationPercentage}
              onChange={handleFloatingPopulationPercentageChange}
              className="border border-gray-300 rounded-lg px-3 py-2 w-24 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              min="0"
              max="100"
            />
          </div>

          {/* Facility Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mr-3">
              Facility Type:
            </label>
            <select
              value={facilityType}
              onChange={handleFacilityTypeChange}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="provided">Bathing Facilities Provided</option>
              <option value="notprovided">Bathing Facilities Not Provided</option>
              <option value="onlypublic">Floating Population using only public facilities</option>
            </select>
          </div>

          {/* Floating Seasonal Multipliers Table */}
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <h5 className="font-semibold text-gray-700 mb-3">Floating Population Seasonal Multipliers:</h5>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Season</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Multiplier</th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Effective Floating %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Summer (Apr-Jun)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={floatingSeasonalMultipliers.summer}
                        onChange={(e) => handleFloatingSeasonalMultiplierChange('summer', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(floatingPopulationPercentage * floatingSeasonalMultipliers.summer).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Monsoon (Jul-Sep)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={floatingSeasonalMultipliers.monsoon}
                        onChange={(e) => handleFloatingSeasonalMultiplierChange('monsoon', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(floatingPopulationPercentage * floatingSeasonalMultipliers.monsoon).toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Post-Monsoon (Oct-Nov)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={floatingSeasonalMultipliers.postMonsoon}
                        onChange={(e) => handleFloatingSeasonalMultiplierChange('postMonsoon', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(floatingPopulationPercentage * floatingSeasonalMultipliers.postMonsoon).toFixed(1)}%
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">Winter (Dec-Mar)</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="number"
                        value={floatingSeasonalMultipliers.winter}
                        onChange={(e) => handleFloatingSeasonalMultiplierChange('winter', Number(e.target.value))}
                        className="w-20 border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {(floatingPopulationPercentage * floatingSeasonalMultipliers.winter).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Seasonal multipliers affect the floating population percentage based on tourism, migration, and seasonal work patterns.
            </p>
          </div>
        </div>
      )}

      {/* Institutional Fields */}
      {institutionalChecked && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h4 className="font-semibold text-lg text-blue-700 mb-3">Institutional Water Demand</h4>

          {/* Radio buttons for institutional input mode */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6 mb-4 p-3 bg-white rounded-lg border">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 focus:ring-blue-500"
                name="institutionalInputMode"
                checked={institutionalInputMode === 'manual'}
                onChange={() => handleInstitutionalInputModeChange('manual')}
              />
              <span className="ml-2 font-medium">Enter Individual Fields</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-blue-600 focus:ring-blue-500"
                name="institutionalInputMode"
                checked={institutionalInputMode === 'total'}
                onChange={() => handleInstitutionalInputModeChange('total')}
              />
              <span className="ml-2 font-medium">Enter Total Institutional Demand</span>
            </label>
          </div>

          {/* Total Institutional Demand Input */}
          {institutionalInputMode === 'total' && (
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <label htmlFor="total_institutional_demand" className="block text-sm font-medium text-gray-700">
                Total Institutional Water Demand (MLD):
              </label>
              <input
                type="number"
                id="total_institutional_demand"
                value={totalInstitutionalDemand}
                onChange={handleTotalInstitutionalDemandChange}
                className="mt-2 block w-full sm:w-1/2 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter total demand"
                min="0"
              />
              <p className="text-sm text-gray-500 mt-2">
                This value will be used as the base year demand and projected for future years based on population growth.
              </p>
            </div>
          )}

          {/* Individual Institutional Fields */}
          {institutionalInputMode === 'manual' && (
            <div className="p-3 bg-white rounded-lg border max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="hospitals_100_units" className="block text-sm font-medium text-gray-700">
                    Hospitals with ≥ 100 Beds (Units):
                  </label>
                  <input
                    type="number"
                    id="hospitals_100_units"
                    value={institutionalFields.hospitals100Units}
                    onChange={(e) => handleInstitutionalFieldChange('hospitals100Units', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="beds_100" className="block text-sm font-medium text-gray-700">
                    Beds in Hospitals with ≥ 100 Beds:
                  </label>
                  <input
                    type="number"
                    id="beds_100"
                    value={institutionalFields.beds100}
                    onChange={(e) => handleInstitutionalFieldChange('beds100', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="hospitals_less_100" className="block text-sm font-medium text-gray-700">
                    Hospitals with &lt; 100 Beds (Units):
                  </label>
                  <input
                    type="number"
                    id="hospitals_less_100"
                    value={institutionalFields.hospitalsLess100}
                    onChange={(e) => handleInstitutionalFieldChange('hospitalsLess100', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="beds_less_100" className="block text-sm font-medium text-gray-700">
                    Beds in Hospitals with &lt; 100 Beds:
                  </label>
                  <input
                    type="number"
                    id="beds_less_100"
                    value={institutionalFields.bedsLess100}
                    onChange={(e) => handleInstitutionalFieldChange('bedsLess100', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="hotels" className="block text-sm font-medium text-gray-700">
                    Hotels (Units):
                  </label>
                  <input
                    type="number"
                    id="hotels"
                    value={institutionalFields.hotels}
                    onChange={(e) => handleInstitutionalFieldChange('hotels', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="beds_hotels" className="block text-sm font-medium text-gray-700">
                    Beds in Hotels:
                  </label>
                  <input
                    type="number"
                    id="beds_hotels"
                    value={institutionalFields.bedsHotels}
                    onChange={(e) => handleInstitutionalFieldChange('bedsHotels', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="hostels" className="block text-sm font-medium text-gray-700">
                    Hostels (Units):
                  </label>
                  <input
                    type="number"
                    id="hostels"
                    value={institutionalFields.hostels}
                    onChange={(e) => handleInstitutionalFieldChange('hostels', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="residents_hostels" className="block text-sm font-medium text-gray-700">
                    Residents in Hostels:
                  </label>
                  <input
                    type="number"
                    id="residents_hostels"
                    value={institutionalFields.residentsHostels}
                    onChange={(e) => handleInstitutionalFieldChange('residentsHostels', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="nurses_home" className="block text-sm font-medium text-gray-700">
                    Nurses Home (Units):
                  </label>
                  <input
                    type="number"
                    id="nurses_home"
                    value={institutionalFields.nursesHome}
                    onChange={(e) => handleInstitutionalFieldChange('nursesHome', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="residents_nurses_home" className="block text-sm font-medium text-gray-700">
                    Residents in Nurses Home:
                  </label>
                  <input
                    type="number"
                    id="residents_nurses_home"
                    value={institutionalFields.residentsNursesHome}
                    onChange={(e) => handleInstitutionalFieldChange('residentsNursesHome', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="boarding_schools" className="block text-sm font-medium text-gray-700">
                    Boarding Schools (Units):
                  </label>
                  <input
                    type="number"
                    id="boarding_schools"
                    value={institutionalFields.boardingSchools}
                    onChange={(e) => handleInstitutionalFieldChange('boardingSchools', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="students_boarding_schools" className="block text-sm font-medium text-gray-700">
                    Students in Boarding Schools:
                  </label>
                  <input
                    type="number"
                    id="students_boarding_schools"
                    value={institutionalFields.studentsBoardingSchools}
                    onChange={(e) => handleInstitutionalFieldChange('studentsBoardingSchools', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="restaurants" className="block text-sm font-medium text-gray-700">
                    Restaurants (Units):
                  </label>
                  <input
                    type="number"
                    id="restaurants"
                    value={institutionalFields.restaurants}
                    onChange={(e) => handleInstitutionalFieldChange('restaurants', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="seats_restaurants" className="block text-sm font-medium text-gray-700">
                    Seats in Restaurants:
                  </label>
                  <input
                    type="number"
                    id="seats_restaurants"
                    value={institutionalFields.seatsRestaurants}
                    onChange={(e) => handleInstitutionalFieldChange('seatsRestaurants', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="airports_seaports" className="block text-sm font-medium text-gray-700">
                    Airports/Seaports (Units):
                  </label>
                  <input
                    type="number"
                    id="airports_seaports"
                    value={institutionalFields.airportsSeaports}
                    onChange={(e) => handleInstitutionalFieldChange('airportsSeaports', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="population_load_airports" className="block text-sm font-medium text-gray-700">
                    Population Load on Airports/Seaports:
                  </label>
                  <input
                    type="number"
                    id="population_load_airports"
                    value={institutionalFields.populationLoadAirports}
                    onChange={(e) => handleInstitutionalFieldChange('populationLoadAirports', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="junction_stations" className="block text-sm font-medium text-gray-700">
                    Junction Stations (Units):
                  </label>
                  <input
                    type="number"
                    id="junction_stations"
                    value={institutionalFields.junctionStations}
                    onChange={(e) => handleInstitutionalFieldChange('junctionStations', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="population_load_junction" className="block text-sm font-medium text-gray-700">
                    Population Load on Junction Stations:
                  </label>
                  <input
                    type="number"
                    id="population_load_junction"
                    value={institutionalFields.populationLoadJunction}
                    onChange={(e) => handleInstitutionalFieldChange('populationLoadJunction', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="terminal_stations" className="block text-sm font-medium text-gray-700">
                    Terminal Stations (Units):
                  </label>
                  <input
                    type="number"
                    id="terminal_stations"
                    value={institutionalFields.terminalStations}
                    onChange={(e) => handleInstitutionalFieldChange('terminalStations', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="population_load_terminal" className="block text-sm font-medium text-gray-700">
                    Population Load on Terminal Stations:
                  </label>
                  <input
                    type="number"
                    id="population_load_terminal"
                    value={institutionalFields.populationLoadTerminal}
                    onChange={(e) => handleInstitutionalFieldChange('populationLoadTerminal', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="intermediate_bathing" className="block text-sm font-medium text-gray-700">
                    Intermediate Bathing (Units):
                  </label>
                  <input
                    type="number"
                    id="intermediate_bathing"
                    value={institutionalFields.intermediateBathing}
                    onChange={(e) => handleInstitutionalFieldChange('intermediateBathing', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="population_load_bathing" className="block text-sm font-medium text-gray-700">
                    Population Load on Intermediate Bathing:
                  </label>
                  <input
                    type="number"
                    id="population_load_bathing"
                    value={institutionalFields.populationLoadBathing}
                    onChange={(e) => handleInstitutionalFieldChange('populationLoadBathing', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="intermediate_no_bathing" className="block text-sm font-medium text-gray-700">
                    Intermediate No Bathing (Units):
                  </label>
                  <input
                    type="number"
                    id="intermediate_no_bathing"
                    value={institutionalFields.intermediateNoBathing}
                    onChange={(e) => handleInstitutionalFieldChange('intermediateNoBathing', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="population_load_no_bathing" className="block text-sm font-medium text-gray-700">
                    Population Load on Intermediate No Bathing:
                  </label>
                  <input
                    type="number"
                    id="population_load_no_bathing"
                    value={institutionalFields.populationLoadNoBathing}
                    onChange={(e) => handleInstitutionalFieldChange('populationLoadNoBathing', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="day_schools" className="block text-sm font-medium text-gray-700">
                    Day Schools (Units):
                  </label>
                  <input
                    type="number"
                    id="day_schools"
                    value={institutionalFields.daySchools}
                    onChange={(e) => handleInstitutionalFieldChange('daySchools', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="students_day_schools" className="block text-sm font-medium text-gray-700">
                    Students in Day Schools:
                  </label>
                  <input
                    type="number"
                    id="students_day_schools"
                    value={institutionalFields.studentsDaySchools}
                    onChange={(e) => handleInstitutionalFieldChange('studentsDaySchools', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="offices" className="block text-sm font-medium text-gray-700">
                    Offices (Units):
                  </label>
                  <input
                    type="number"
                    id="offices"
                    value={institutionalFields.offices}
                    onChange={(e) => handleInstitutionalFieldChange('offices', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="employees_offices" className="block text-sm font-medium text-gray-700">
                    Employees in Offices:
                  </label>
                  <input
                    type="number"
                    id="employees_offices"
                    value={institutionalFields.employeesOffices}
                    onChange={(e) => handleInstitutionalFieldChange('employeesOffices', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="factories" className="block text-sm font-medium text-gray-700">
                    Factories (Units):
                  </label>
                  <input
                    type="number"
                    id="factories"
                    value={institutionalFields.factorieswashrooms}
                    onChange={(e) => handleInstitutionalFieldChange('factorieswashrooms', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="employees_factories" className="block text-sm font-medium text-gray-700">
                    Employees in Factories (with Washrooms):
                  </label>
                  <input
                    type="number"
                    id="employees_factories"
                    value={institutionalFields.employeesFactories}
                    onChange={(e) => handleInstitutionalFieldChange('employeesFactories', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="factories_no_washrooms" className="block text-sm font-medium text-gray-700">
                    Factories without Washrooms (Units):
                  </label>
                  <input
                    type="number"
                    id="factories_no_washrooms"
                    value={institutionalFields.factoriesnoWashrooms}
                    onChange={(e) => handleInstitutionalFieldChange('factoriesnoWashrooms', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="employees_factories_no_washrooms" className="block text-sm font-medium text-gray-700">
                    Employees in Factories (No Washrooms):
                  </label>
                  <input
                    type="number"
                    id="employees_factories_no_washrooms"
                    value={institutionalFields.employeesFactoriesNoWashrooms}
                    onChange={(e) => handleInstitutionalFieldChange('employeesFactoriesNoWashrooms', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="cinemas" className="block text-sm font-medium text-gray-700">
                    Cinemas (Units):
                  </label>
                  <input
                    type="number"
                    id="cinemas"
                    value={institutionalFields.cinemas}
                    onChange={(e) => handleInstitutionalFieldChange('cinemas', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
                <div>
                  <label htmlFor="seats_cinemas" className="block text-sm font-medium text-gray-700">
                    Seats in Cinemas:
                  </label>
                  <input
                    type="number"
                    id="seats_cinemas"
                    value={institutionalFields.seatsCinemas}
                    onChange={(e) => handleInstitutionalFieldChange('seatsCinemas', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter number"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Firefighting Fields */}
      {firefightingChecked && (
        <div className="mb-6 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
          <h4 className="font-semibold text-lg text-blue-700 mb-3">Firefighting Water Demand</h4>
          <div className="p-3 bg-white rounded-lg border">
            <h5 className="font-medium text-gray-700 mb-3">Select Calculation Methods:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={firefightingMethods.Kuchling}
                  onChange={(e) => handleFirefightingMethodChange('Kuchling', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">Kuchling</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={firefightingMethods.Freeman}
                  onChange={(e) => handleFirefightingMethodChange('Freeman', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">Freeman</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={firefightingMethods.Buston}
                  onChange={(e) => handleFirefightingMethodChange('Buston', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">Buston</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={firefightingMethods.American_insurance}
                  onChange={(e) => handleFirefightingMethodChange('American_insurance', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">{formatMethodName('American_insurance')}</span>
              </label>
              <label className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={firefightingMethods.Ministry_urban}
                  onChange={(e) => handleFirefightingMethodChange('Ministry_urban', e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">{formatMethodName('Ministry_urban')}</span>
              </label>
            </div>
          </div>

          {/* If firefighting demand has been calculated, display output table and radio buttons */}
          {firefightingDemand && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <h5 className="font-semibold text-blue-700 mb-3">Firefighting Demand Output</h5>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
                <table className="table-auto w-full bg-white border border-gray-300 rounded-lg shadow-md">
                  <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-20">
                    <tr>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-blue-100">Year</th>
                      {Object.keys(firefightingDemand).map((method) => (
                        <th key={method} className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-blue-100">{formatMethodName(method)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(forecastData).sort().map((year, index) => (
                      <tr key={year} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">{year}</td>
                        {Object.keys(firefightingDemand).map((method) => (
                          <td key={method} className="border-b border-gray-200 px-4 py-2 text-gray-700">
                            {firefightingDemand[method]?.[year]
                              ? firefightingDemand[method][year].toFixed(2)
                              : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">Select one method for final output:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {Object.keys(firefightingDemand).map((method) => (
                    <label key={method} className="flex items-center p-2 border rounded-lg hover:bg-blue-50 transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="selectedFirefightingMethod"
                        value={method}
                        checked={selectedFirefightingMethod === method}
                        onChange={() => setSelectedFirefightingMethod(method)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">{formatMethodName(method)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calculate Button */}
      <div className="flex space-x-4 items-center mb-6">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleCalculate}
        >
          Calculate Water Demand
        </button>

        {/* Loading Indicator */}
        {isCalculating && (
          <div className="inline-flex items-center">
            <div className="animate-spin h-5 w-5 border-t-2 border-blue-600 border-solid rounded-full"></div>
            <span className="ml-2 text-gray-600">Calculating...</span>
          </div>
        )}
      </div>

      {/* Results Table */}
      {(domesticDemand || floatingDemand || institutionalDemand || firefightingDemand) && forecastData && (
        <div className="mt-8">
          <h4 className="text-xl font-semibold text-gray-800 mb-4">Water Demand Results</h4>
          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-gray-100">
            <table className="table-auto w-full min-w-[600px] bg-white border border-gray-300 rounded-lg shadow-md">
              <thead className="bg-gradient-to-r from-blue-100 to-blue-200 sticky top-0 z-20">
                <tr>
                  <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Year</th>
                  {domesticChecked && (
                    <>
                      <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Forecasted Population</th>
                      <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Domestic Water Demand (MLD)</th>
                    </>
                  )}
                  {floatingChecked && (
                    <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Floating Water Demand (MLD)</th>
                  )}
                  {institutionalChecked && (
                    <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Institutional Water Demand (MLD)</th>
                  )}
                  {firefightingChecked && selectedFirefightingMethod && (
                    <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">
                      Firefighting Demand ({formatMethodName(selectedFirefightingMethod)}) (MLD)
                    </th>
                  )}
                  <th className="border-b border-gray-300 px-6 py-3 text-left text-sm font-semibold text-gray-800 bg-blue-100">Total Demand (MLD)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(forecastData)
                  .sort()
                  .map((year, index) => {
                    // For domestic, retrieve the forecasted population from the global variable
                    const domesticPop = forecastData[year] ?? "";

                    // FIXED: Consistent access to demand values
                    const domesticVal = domesticChecked && domesticDemand && domesticDemand.base_demand
                      ? (domesticDemand.base_demand[year] || 0)
                      : 0;

                    const floatingVal = floatingChecked && floatingDemand && floatingDemand.base_demand
                      ? (floatingDemand.base_demand[year] || 0)
                      : 0;

                    const institutionalVal = institutionalChecked && institutionalDemand?.[year] ? institutionalDemand[year] : 0;

                    const firefightingVal =
                      firefightingChecked && selectedFirefightingMethod && firefightingDemand?.[selectedFirefightingMethod]?.[year]
                        ? firefightingDemand[selectedFirefightingMethod][year]
                        : 0;

                    const totalDemand = domesticVal + floatingVal + institutionalVal + firefightingVal;

                    return (
                      <tr key={year} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{year}</td>
                        {domesticChecked && (
                          <>
                            <td className="border-b border-gray-200 px-6 py-3 text-gray-700">{domesticPop}</td>
                            <td className="border-b border-gray-200 px-6 py-3 text-gray-700">
                              {domesticVal.toFixed(2)}
                            </td>
                          </>
                        )}

                        {floatingChecked && (
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">
                            {floatingVal.toFixed(2)}
                          </td>
                        )}

                        {institutionalChecked && (
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">
                            {institutionalVal.toFixed(2)}
                          </td>
                        )}

                        {firefightingChecked && selectedFirefightingMethod && (
                          <td className="border-b border-gray-200 px-6 py-3 text-gray-700">
                            {firefightingVal.toFixed(2)}
                          </td>
                        )}

                        <td className="border-b border-gray-200 px-6 py-3 font-medium text-gray-800 bg-blue-50">
                          {totalDemand.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          {/* Show Seasonal Breakdown Button */}
          {domesticDemand && domesticDemand.seasonal_demands && (
            <div className="mt-4">
              <button
                onClick={() => setShowSeasonalBreakdown(!showSeasonalBreakdown)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {showSeasonalBreakdown ? 'Hide' : 'Show'} Seasonal Domestic Water Demand
              </button>
            </div>
          )}
          {/* Seasonal Breakdown Table */}
          {showSeasonalBreakdown && domesticDemand?.seasonal_demands && forecastData && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <h5 className="font-semibold text-green-700 mb-3">Seasonal Domestic Water Demand </h5>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500 scrollbar-track-gray-100">
                <table className="table-auto w-full bg-white border border-gray-300 rounded-lg shadow-md">
                  <thead className="bg-gradient-to-r from-green-100 to-green-200 sticky -top-2 z-20">
                    <tr>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-green-100">Year</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-green-100">Summer (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-green-100">Monsoon (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-green-100">Post-Monsoon (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-green-100">Winter (MLD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(forecastData).sort().map((year, index) => (
                      <tr key={year} className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">{year}</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {domesticDemand.seasonal_demands.summer?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {domesticDemand.seasonal_demands.monsoon?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {domesticDemand.seasonal_demands.postMonsoon?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {domesticDemand.seasonal_demands.winter?.[year]?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Show Floating Seasonal Breakdown Button */}
          {floatingDemand && floatingDemand.seasonal_demands && (
            <div className="mt-4">
              <button
                onClick={() => setShowFloatingSeasonalBreakdown(!showFloatingSeasonalBreakdown)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                {showFloatingSeasonalBreakdown ? 'Hide' : 'Show'} Seasonal Floating Water Demand
              </button>
            </div>
          )}

          {/* Floating Seasonal Breakdown Table */}
          {showFloatingSeasonalBreakdown && floatingDemand?.seasonal_demands && forecastData && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <h5 className="font-semibold text-orange-700 mb-3">Seasonal Floating Water Demand</h5>
              <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-gray-100">
                <table className="table-auto w-full bg-white border border-gray-300 rounded-lg shadow-md">
                  <thead className="bg-gradient-to-r from-orange-100 to-orange-200 sticky -top-2 z-20">
                    <tr>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-orange-100">Year</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-orange-100">Summer (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-orange-100">Monsoon (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-orange-100">Post-Monsoon (MLD)</th>
                      <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800 bg-orange-100">Winter (MLD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(forecastData).sort().map((year, index) => (
                      <tr key={year} className={`hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">{year}</td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {floatingDemand.seasonal_demands.summer?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {floatingDemand.seasonal_demands.monsoon?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {floatingDemand.seasonal_demands.postMonsoon?.[year]?.toFixed(2) || "0.00"}
                        </td>
                        <td className="border-b border-gray-200 px-4 py-2 text-gray-700">
                          {floatingDemand.seasonal_demands.winter?.[year]?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Add a summary message below the table */}
          <div className="mt-4 p-4 border rounded-lg bg-blue-50/50 shadow-sm">
            <h5 className="font-semibold text-lg text-blue-700 mb-2">Water Demand Summary:</h5>
            <p className="text-sm text-gray-600">
              The water demand calculation includes various components based on your selections: domestic consumption
              based on per capita usage, floating population requirements, institutional demands from facilities like
              hospitals and schools, and firefighting reserves. The total demand shows the comprehensive water
              requirements for your selected region across different forecast years.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterDemandForm;