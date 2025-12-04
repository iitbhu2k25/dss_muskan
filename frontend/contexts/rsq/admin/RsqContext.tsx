"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useLocation } from "./LocationContext";

/* ================= TYPES ================= */

export interface GroundWaterFeature {
  type: "Feature";
  id?: string;
  properties: {
    vlcode: number;
    village: string;
    blockname?: string;
    blockcode?: number;
    Year: string;
    Total_Annual_Ground_Water_Recharge?: number;
    Annual_Extractable_Ground_Water_Resource?: number;
    Irrigation_Use?: number;
    Domestic_Use?: number;
    Industrial_Use?: number | null;
    Total_Extraction?: number;
    Net_Ground_Water_Availability_for_future_use?: number;
    Stage_of_Ground_Water_Extraction?: number;
    Recharge_from_Rainfall_MON?: number;
    Recharge_from_Other_Sources_MON?: number;
    Recharge_from_Rainfall_NM?: number;
    Recharge_from_Other_Sources_NM?: number;
    Total_Natural_Discharges?: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GroundWaterGeoJSON {
  type: "FeatureCollection";
  features: GroundWaterFeature[];
}

interface RSQContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  groundWaterData: GroundWaterGeoJSON | null;
  isLoading: boolean;
  error: string | null;
  fetchGroundWaterData: () => Promise<void>;
  clearData: () => void;
}

/* ================= CONTEXT ================= */

const RSQContext = createContext<RSQContextType>({
  selectedYear: "2016 - 17",
  setSelectedYear: () => {},
  groundWaterData: null,
  isLoading: false,
  error: null,
  fetchGroundWaterData: async () => {},
  clearData: () => {},
});

/* ================= PROVIDER ================= */

interface RSQProviderProps {
  children: ReactNode;
}

export const RSQProvider: React.FC<RSQProviderProps> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<string>("2016 - 17");
  const [groundWaterData, setGroundWaterData] = useState<GroundWaterGeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedVillages } = useLocation();

  /* ================= FETCH GROUND WATER DATA ================= */

  const fetchGroundWaterData = async () => {
    if (selectedVillages.length === 0) {
      setError("Please select villages first");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📤 Fetching RSQ data:', {
        year: selectedYear,
        vlcodes: selectedVillages,
      });

      const response = await fetch("/django/rsq/quantification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          vlcodes: selectedVillages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch groundwater data");
      }

      const data: GroundWaterGeoJSON = await response.json();

      console.log('🌟 RSQ Data loaded:', {
        features: data.features.length,
        sample: data.features[0]?.properties,
      });

      setGroundWaterData(data);
    } catch (err) {
      console.error('❌ RSQ fetch failed:', err);
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      setGroundWaterData(null);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= AUTO-FETCH ON VILLAGE CHANGE ================= */

  useEffect(() => {
    if (selectedVillages.length > 0) {
      fetchGroundWaterData();
    } else {
      setGroundWaterData(null);
      setError(null);
    }
  }, [selectedVillages, selectedYear]);

  /* ================= CLEAR DATA ================= */

  const clearData = () => {
    setGroundWaterData(null);
    setError(null);
  };

  /* ================= PROVIDER VALUE ================= */

  const contextValue: RSQContextType = {
    selectedYear,
    setSelectedYear,
    groundWaterData,
    isLoading,
    error,
    fetchGroundWaterData,
    clearData,
  };

  return (
    <RSQContext.Provider value={contextValue}>
      {children}
    </RSQContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useRSQ = (): RSQContextType => {
  const context = useContext(RSQContext);
  if (!context) {
    throw new Error("useRSQ must be used inside RSQProvider");
  }
  return context;
};