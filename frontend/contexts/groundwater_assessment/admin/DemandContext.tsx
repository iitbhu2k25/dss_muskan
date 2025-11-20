"use client";

import React, { createContext, useContext, useState } from 'react';
import { useLocation } from './LocationContext';
import { useWell } from './WellContext';

interface TableData {
  [key: string]: string | number;
}

interface CropData {
  [season: string]: string[]; 
}

// Define a structure for industrial sub-types to manage user input and constant values
export interface IndustrialSubtype {
  industry: string;
  subtype: string;
  unit: 'MW' | 'm³/tonne of product'; // Added a clearer unit based on the table
  consumptionValue: number;
  production: number; // User input for Annual Industrial Production (MW or MT)
}

// Initial industrial data based on the provided image
const initialIndustrialData: IndustrialSubtype[] = [
  // Thermal Power Plants
  { industry: 'Thermal Power Plants', subtype: 'Small (<1000 MW)', unit: 'm³/tonne of product', consumptionValue: 3.1, production: 0 },
  { industry: 'Thermal Power Plants', subtype: 'Medium (1000–2500 MW)', unit: 'm³/tonne of product', consumptionValue: 4.2, production: 0 },
  { industry: 'Thermal Power Plants', subtype: 'Large (>2500 MW)', unit: 'm³/tonne of product', consumptionValue: 3.1, production: 0 },
  // Pulp & Paper
  { industry: 'Pulp & Paper', subtype: 'Integrated Mills', unit: 'm³/tonne of product', consumptionValue: 31.8, production: 0 },
  { industry: 'Pulp & Paper', subtype: 'RCF-based Mills', unit: 'm³/tonne of product', consumptionValue: 11.5, production: 0 },
  // Textiles
  { industry: 'Textiles', subtype: 'Integrated (Cotton)', unit: 'm³/tonne of product', consumptionValue: 224, production: 0 },
  { industry: 'Textiles', subtype: 'Fabric Processing', unit: 'm³/tonne of product', consumptionValue: 75, production: 0 },
  // Iron & Steel
  { industry: 'Iron & Steel', subtype: 'Integrated (Woollen)', unit: 'm³/tonne of product', consumptionValue: 237, production: 0 },
  { industry: 'Iron & Steel', subtype: 'General', unit: 'm³/tonne of product', consumptionValue: 6.5, production: 0 },
];

// interface for chart data
interface ChartData {
  individual_crops: {
    type: "scatter";
    title: string;
    x_label: string;
    y_label: string;
    months: string[];
    crops_data: { [crop: string]: number[] };
  };
  cumulative_demand: {
    type: "line_area";
    title: string;
    x_label: string;
    y_label: string;
    months: string[];
    values: number[];
  };
  summary_stats: {
    total_villages: number;
    total_demand_cubic_meters: number;
    average_demand_per_village: number;
  };
}

interface DemandContextType {
  // Form State
  domesticChecked: boolean;
  agriculturalChecked: boolean;
  industrialChecked: boolean;
  perCapitaConsumption: number;

  // Agricultural Season & Crop State
  kharifChecked: boolean;
  rabiChecked: boolean;
  zaidChecked: boolean;
  availableCrops: CropData;
  selectedCrops: { [season: string]: string[] };
  cropsLoading: { [season: string]: boolean };
  cropsError: { [season: string]: string | null };
  
  // Groundwater Factor (Agricultural)
  groundwaterFactor: number;
  
  // Industrial State
  industrialData: IndustrialSubtype[];
  industrialGWShare: number; // Share of Groundwater in industrial use (default 0.5)
  
  // Charts State 
  chartData: ChartData | null;
  chartsError: string | null;

  // Data State 
  domesticTableData: TableData[];
  agriculturalTableData: TableData[];
  industrialTableData: TableData[];

  // Loading and Error State 
  domesticLoading: boolean;
  agriculturalLoading: boolean;
  industrialLoading: boolean;
  domesticError: string | null;
  agriculturalError: string | null;
  industrialError: string | null;

  // Actions
  setDomesticChecked: (checked: boolean) => void;
  setAgriculturalChecked: (checked: boolean) => void;
  setIndustrialChecked: (checked: boolean) => void;
  setPerCapitaConsumption: (value: number) => void;
  setGroundwaterFactor: (value: number) => void;
  
  // Industrial Actions
  setIndustrialData: (data: IndustrialSubtype[]) => void;
  setIndustrialGWShare: (value: number) => void;
  updateIndustrialProduction: (industry: string, subtype: string, production: number) => void;
  
  // Season Actions
  setKharifChecked: (checked: boolean) => void;
  setRabiChecked: (checked: boolean) => void;
  setZaidChecked: (checked: boolean) => void;
  
  // Crop Actions
  fetchCropsForSeason: (season: string) => Promise<void>;
  toggleCropSelection: (season: string, crop: string) => void;
  
  // Charts Actions
  clearChartData: () => void;
  
  computeDomesticDemand: () => Promise<void>;
  computeAgriculturalDemand: () => Promise<void>;
  computeIndustrialDemand: () => Promise<void>;

  // Helper functions
  canComputeDomesticDemand: () => boolean;
  canComputeAgriculturalDemand: () => boolean;
  canComputeIndustrialDemand: () => boolean;
}

export const DemandContext = createContext<DemandContextType | undefined>(undefined);

interface DemandProviderProps {
  children: React.ReactNode;
}

export const DemandProvider: React.FC<DemandProviderProps> = ({ children }) => {
  // Form State
  const [domesticChecked, setDomesticChecked] = useState<boolean>(false);
  const [agriculturalChecked, setAgriculturalChecked] = useState<boolean>(false);
  const [industrialChecked, setIndustrialChecked] = useState<boolean>(false);
  const [perCapitaConsumption, setPerCapitaConsumption] = useState<number>(60);

  // Agricultural Season & Crop State
  const [kharifChecked, setKharifChecked] = useState<boolean>(false);
  const [rabiChecked, setRabiChecked] = useState<boolean>(false);
  const [zaidChecked, setZaidChecked] = useState<boolean>(false);
  const [availableCrops, setAvailableCrops] = useState<CropData>({});
  const [selectedCrops, setSelectedCrops] = useState<{ [season: string]: string[] }>({});
  const [cropsLoading, setCropsLoading] = useState<{ [season: string]: boolean }>({});
  const [cropsError, setCropsError] = useState<{ [season: string]: string | null }>({});
  
  // Groundwater Factor (Agricultural)
  const [groundwaterFactor, setGroundwaterFactor] = useState<number>(0.8);
  
  // Industrial State
  const [industrialData, setIndustrialData] = useState<IndustrialSubtype[]>(initialIndustrialData);
  const [industrialGWShare, setIndustrialGWShare] = useState<number>(0.5); // Default 50%
  
  // Charts State - supports structured chart data
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);

  // Data State - separate for each demand type
  const [domesticTableData, setDomesticTableData] = useState<TableData[]>([]);
  const [agriculturalTableData, setAgriculturalTableData] = useState<TableData[]>([]);
  const [industrialTableData, setIndustrialTableData] = useState<TableData[]>([]);

  // Loading and Error State - separate for each demand type
  const [domesticLoading, setDomesticLoading] = useState<boolean>(false);
  const [agriculturalLoading, setAgriculturalLoading] = useState<boolean>(false);
  const [industrialLoading, setIndustrialLoading] = useState<boolean>(false);
  const [domesticError, setDomesticError] = useState<string | null>(null);
  const [agriculturalError, setAgriculturalError] = useState<string | null>(null);
  const [industrialError, setIndustrialError] = useState<string | null>(null);

  // Context dependencies
  const { selectedSubDistricts } = useLocation();
  const { csvFilename } = useWell();
  
  // Action to update production for a specific sub-type
  const updateIndustrialProduction = (industry: string, subtype: string, production: number) => {
    setIndustrialData(prevData =>
      prevData.map(item =>
        item.industry === industry && item.subtype === subtype
          ? { ...item, production: isNaN(production) || production < 0 ? 0 : production }
          : item
      )
    );
  };

  // Clear chart data helper
  const clearChartData = () => {
    setChartData(null);
    setChartsError(null);
  };

  // Season checkbox handlers
  const handleKharifChecked = async (checked: boolean) => {
    setKharifChecked(checked);
    if (checked) {
      await fetchCropsForSeason('Kharif');
    }
  };

  const handleRabiChecked = async (checked: boolean) => {
    setRabiChecked(checked);
    if (checked) {
      await fetchCropsForSeason('Rabi');
    }
  };

  const handleZaidChecked = async (checked: boolean) => {
    setZaidChecked(checked);
    if (checked) {
      await fetchCropsForSeason('Zaid');
    }
  };

  // Fetch crops for a specific season
  const fetchCropsForSeason = async (season: string) => {
    try {
      setCropsLoading(prev => ({ ...prev, [season]: true }));
      setCropsError(prev => ({ ...prev, [season]: null }));

      const response = await fetch('http://localhost:6500/gwa/crops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ season }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`${season} crops fetched:`, result);

      if (result.success && result.data && result.data.crops && Array.isArray(result.data.crops)) {
        setAvailableCrops(prev => ({
          ...prev,
          [season]: result.data.crops
        }));
        
        if (!selectedCrops[season]) {
          setSelectedCrops(prev => ({
            ...prev,
            [season]: []
          }));
        }
      } else {
        throw new Error(`Invalid response format for ${season} crops`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.log(`Error fetching ${season} crops:`, errorMessage);
      setCropsError(prev => ({ ...prev, [season]: errorMessage }));
    } finally {
      setCropsLoading(prev => ({ ...prev, [season]: false }));
    }
  };

  // Toggle crop selection
  const toggleCropSelection = (season: string, crop: string) => {
    setSelectedCrops(prev => {
      const currentSeasonCrops = prev[season] || [];
      const isSelected = currentSeasonCrops.includes(crop);
      
      return {
        ...prev,
        [season]: isSelected 
          ? currentSeasonCrops.filter(c => c !== crop)
          : [...currentSeasonCrops, crop]
      };
    });
  };

  // Check if compute demand can be performed for each type
  const canComputeDomesticDemand = (): boolean => {
    return !!(domesticChecked && selectedSubDistricts.length > 0 && perCapitaConsumption > 0 && csvFilename);
  };

  const canComputeAgriculturalDemand = (): boolean => {
    return !!(agriculturalChecked && selectedSubDistricts.length > 0);
  };

  const canComputeIndustrialDemand = (): boolean => {
    // Industrial computation is possible if checked and a location is selected, 
    // even if production inputs are 0 (they will be validated inside the function)
    return !!(industrialChecked && selectedSubDistricts.length > 0);
  };

  const computeDomesticDemand = async () => {
    try {
      setDomesticLoading(true);
      setDomesticError(null);

      // Validation
      if (!domesticChecked) {
        throw new Error('Please select domestic demand type.');
      }
      if (selectedSubDistricts.length === 0) {
        throw new Error('Sub-district selection is required. Please select areas first.');
      }
      if (perCapitaConsumption <= 0) {
        throw new Error('Per capita consumption must be greater than 0.');
      }
      if (!csvFilename) {
        throw new Error('Population forecast CSV is required. Please upload/confirm wells CSV first.');
      }

      // Prepare request payload for forecast API
      const requestPayload = {
        subdistrict_code: selectedSubDistricts,
        csv_filename: csvFilename,
        lpcd: perCapitaConsumption,
      };

      console.log('Computing domestic demand via forecast-population with payload:', requestPayload);

      // API call to compute domestic demand via forecast-population
      const response = await fetch('http://localhost:6500/gwa/forecast-population', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Domestic demand computation result:', result);

      // Set the table data from API response
      if (result.forecasts && Array.isArray(result.forecasts)) {
        setDomesticTableData(result.forecasts);
      } else {
        throw new Error('Invalid response format from server: forecasts not found');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.log('Error computing domestic demand:', errorMessage);
      setDomesticError(errorMessage);
      setDomesticTableData([]);
    } finally {
      setDomesticLoading(false);
    }
  };

  const computeAgriculturalDemand = async () => {
    try {
      setAgriculturalLoading(true);
      setAgriculturalError(null);
      
      // Clear previous chart data
      clearChartData();

      // Validation
      if (!agriculturalChecked) {
        throw new Error('Please select agricultural demand type.');
      }

      if (selectedSubDistricts.length === 0) {
        throw new Error('Sub-district selection is required. Please select areas first.');
      }

      // Prepare request payload - Always include charts
      const requestPayload = {
        subdistrict_code: selectedSubDistricts,
        selectedCrops: selectedCrops,
        groundwaterFactor: groundwaterFactor,
        irrigationIntensity: 0.8,
        seasons: {
          kharif: kharifChecked,
          rabi: rabiChecked,
          zaid: zaidChecked
        },
        include_charts: true  
      };

      console.log('Computing agricultural demand with payload:', requestPayload);

      // API call to compute agricultural demand
      const response = await fetch('http://localhost:6500/gwa/agricultural', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Agricultural demand computation result:', result);

      // Set the table data from API response
      if (result.data && Array.isArray(result.data)) {
        setAgriculturalTableData(result.data);
      } else {
        throw new Error('Invalid response format from server');
      }

      // Handle chart data
      if (result.charts) {
        if (result.charts_error) {
          setChartsError(result.charts_error);
          console.warn('Chart generation error:', result.charts_error);
        } else {
          setChartData(result.charts);
          console.log('Charts data received:', {
            hasIndividualChart: !!result.charts.individual_crops,
            hasCumulativeChart: !!result.charts.cumulative_demand,
            summary: result.charts.summary_stats
          });
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.log('Error computing agricultural demand:', errorMessage);
      setAgriculturalError(errorMessage);
      setAgriculturalTableData([]);
      clearChartData(); 
    } finally {
      setAgriculturalLoading(false);
    }
  };

  const computeIndustrialDemand = async () => {
    try {
      setIndustrialLoading(true);
      setIndustrialError(null);

      // Validation
      if (!industrialChecked) {
        throw new Error('Please select industrial demand type.');
      }

      if (selectedSubDistricts.length === 0) {
        throw new Error('Sub-district selection is required. Please select areas first.');
      }

      // 1. Calculate Total Annual Water Demand (I_Total)
      const totalAnnualDemand = industrialData.reduce((sum, item) => {
        // I_Total = Annual Industrial Production * Default Water Consumption Value
        const demand = item.production * item.consumptionValue;
        return sum + demand;
      }, 0);
      
      // 2. Calculate Groundwater Industrial Demand
      const groundwaterIndustrialDemand = totalAnnualDemand * industrialGWShare;
      
      // Validation for total demand
      if (totalAnnualDemand === 0) {
        throw new Error('Total Annual Industrial Production is zero. Please enter production values.');
      }

      // Prepare request payload - SEND THE CALCULATED GROUNDWATER DEMAND
      const requestPayload = {
        subdistrict_code: selectedSubDistricts,
        // SEND THE FINAL CALCULATED GROUNDWATER DEMAND (in m³ or other standard unit)
        groundwater_industrial_demand: groundwaterIndustrialDemand, 
        // OPTIONAL: Send the raw inputs if needed by backend for logging/verification
        industrial_inputs: industrialData.map(item => ({
          industry: item.industry,
          subtype: item.subtype,
          production: item.production,
          consumptionValue: item.consumptionValue
        }))
      };

      console.log('Computing industrial demand with payload:', requestPayload);

      // API call to compute industrial demand
      const response = await fetch('/django/gwa/compute-industrial-demand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Industrial demand computation result:', result);

      // Set the table data from API response
      if (result.data && Array.isArray(result.data)) {
        setIndustrialTableData(result.data);
      } else if (result.result) {
        // If the backend just returns a single result (e.g., total demand or allocation)
        setIndustrialTableData([{
          Total_Demand_Input: totalAnnualDemand.toFixed(2),
          GW_Factor: `${(industrialGWShare * 100).toFixed(0)}%`,
          Total_GW_Demand_Sent: groundwaterIndustrialDemand.toFixed(2),
          Backend_Result: result.result // Assuming backend returns a field 'result'
        }]);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.log('Error computing industrial demand:', errorMessage);
      setIndustrialError(errorMessage);
      setIndustrialTableData([]);
    } finally {
      setIndustrialLoading(false);
    }
  };

  const value: DemandContextType = {
    // Form State
    domesticChecked,
    agriculturalChecked,
    industrialChecked,
    perCapitaConsumption,

    // Agricultural Season & Crop State
    kharifChecked,
    rabiChecked,
    zaidChecked,
    availableCrops,
    selectedCrops,
    cropsLoading,
    cropsError,
    
    // Groundwater Factor (Agricultural)
    groundwaterFactor,
    
    // Industrial State
    industrialData,
    industrialGWShare,
    
    // Charts State
    chartData,
    chartsError,

    // Data State 
    domesticTableData,
    agriculturalTableData,
    industrialTableData,

    // Loading and Error State
    domesticLoading,
    agriculturalLoading,
    industrialLoading,
    domesticError,
    agriculturalError,
    industrialError,

    // Actions
    setDomesticChecked,
    setAgriculturalChecked,
    setIndustrialChecked,
    setPerCapitaConsumption,
    setGroundwaterFactor,
    
    // Industrial Actions
    setIndustrialData,
    setIndustrialGWShare,
    updateIndustrialProduction,
    
    // Season Actions
    setKharifChecked: handleKharifChecked,
    setRabiChecked: handleRabiChecked,
    setZaidChecked: handleZaidChecked,
    
    // Crop Actions
    fetchCropsForSeason,
    toggleCropSelection,

    // Charts Actions
    clearChartData,

    computeDomesticDemand,
    computeAgriculturalDemand,
    computeIndustrialDemand,

    // Helper functions
    canComputeDomesticDemand,
    canComputeAgriculturalDemand,
    canComputeIndustrialDemand,
  };

  return (
    <DemandContext.Provider value={value}>
      {children}
    </DemandContext.Provider>
  );
};

export const useDemand = (): DemandContextType => {
  const context = useContext(DemandContext);
  if (context === undefined) {
    throw new Error('useDemand must be used within a DemandProvider');
  }
  return context;
};