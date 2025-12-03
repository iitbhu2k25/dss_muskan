"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

/* ================= TYPES ================= */

export interface State {
  id: string;  // ✅ Changed to string with padding
  name: string;
}

export interface District {
  id: string;  // ✅ Changed to string with padding
  name: string;
  stateId: string;  // ✅ Changed to string
}

export interface Block {
  id: string;  // ✅ Changed to string with padding
  name: string;
  districtCode: string;  // ✅ Changed to string
}

export interface Village {
  id: string;  // ✅ Changed to string with padding (6 digits for vlcode)
  name: string;
  blockCode: string;  // ✅ Changed to string
}

interface LocationContextType {
  states: State[];
  districts: District[];
  blocks: Block[];
  villages: Village[];

  selectedState: string | null;  // ✅ Changed to string
  selectedDistricts: string[];   // ✅ Changed to string[]
  selectedBlocks: string[];      // ✅ Changed to string[]
  selectedVillages: string[];    // ✅ Changed to string[]

  isLoading: boolean;
  error: string | null;

  handleStateChange: (stateId: string) => void;
  setSelectedDistricts: (districtIds: string[]) => void;
  setSelectedBlocks: (blockIds: string[]) => void;
  setSelectedVillages: (villageIds: string[]) => void;

  resetSelections: () => void;
}

/* ================= CONTEXT ================= */

const LocationContext = createContext<LocationContextType>({
  states: [],
  districts: [],
  blocks: [],
  villages: [],
  selectedState: null,
  selectedDistricts: [],
  selectedBlocks: [],
  selectedVillages: [],
  isLoading: false,
  error: null,
  handleStateChange: () => {},
  setSelectedDistricts: () => {},
  setSelectedBlocks: () => {},
  setSelectedVillages: () => {},
  resetSelections: () => {},
});

/* ================= PROVIDER ================= */

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({
  children,
}) => {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);

  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistricts, setSelectedDistrictsState] = useState<string[]>([]);
  const [selectedBlocks, setSelectedBlocksState] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillagesState] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH STATES ================= */

  useEffect(() => {
    const fetchStates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/django/state");
        const data = await response.json();

        const formatted: State[] = data.map((s: any) => ({
          id: String(s.state_code).padStart(2, '0'),  // ✅ Pad to 2 digits
          name: s.state_name,
        }));

        setStates(formatted);
      } catch {
        setError("Failed to fetch states");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStates();
  }, []);

  /* ================= FETCH DISTRICTS ================= */

  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrictsState([]);
      setBlocks([]);
      setVillages([]);
      setSelectedBlocksState([]);
      setSelectedVillagesState([]);
      return;
    }

    const fetchDistricts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/django/district/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state_code: selectedState }),
        });

        const data = await response.json();

        const formatted: District[] = data.map((d: any) => ({
          id: String(d.district_code).padStart(3, '0'),  // ✅ Pad to 3 digits
          name: d.district_name,
          stateId: selectedState,
        }));

        setDistricts(formatted);
      } catch {
        setError("Failed to fetch districts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  /* ================= FETCH BLOCKS (MULTI DISTRICT) ================= */

  useEffect(() => {
    if (selectedDistricts.length === 0) {
      setBlocks([]);
      setVillages([]);
      setSelectedBlocksState([]);
      setSelectedVillagesState([]);
      return;
    }

    const fetchBlocks = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/django/rsq/getblocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            districtcodes: selectedDistricts,
          }),
        });

        const data = await response.json();

        const formatted: Block[] = data.map((b: any) => ({
          id: String(b.blockcode).padStart(4, '0'),  // ✅ Pad to 4 digits
          name: b.block,
          districtCode: String(b.districtcode).padStart(3, '0'),
        }));

        setBlocks(formatted);
        setVillages([]);
        setSelectedBlocksState([]);
        setSelectedVillagesState([]);
      } catch {
        setError("Failed to fetch blocks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlocks();
  }, [selectedDistricts]);

  /* ================= FETCH VILLAGES (MULTI BLOCK) ================= */

  useEffect(() => {
    if (selectedBlocks.length === 0) {
      setVillages([]);
      setSelectedVillagesState([]);
      return;
    }

    const fetchVillages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/django/rsq/getvillages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blockcodes: selectedBlocks,
          }),
        });

        const data = await response.json();

        const formatted: Village[] = data.map((v: any) => ({
          id: String(v.vlcode).padStart(6, '0'),  // ✅ Pad to 6 digits for village codes
          name: v.village,
          blockCode: String(v.blockcode).padStart(4, '0'),
        }));

        setVillages(formatted);
        setSelectedVillagesState([]);
      } catch {
        setError("Failed to fetch villages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVillages();
  }, [selectedBlocks]);

  /* ================= HANDLERS ================= */

  const handleStateChange = (stateId: string) => {
    setSelectedState(stateId);
    setSelectedDistrictsState([]);
    setSelectedBlocksState([]);
    setSelectedVillagesState([]);
    setBlocks([]);
    setVillages([]);
  };

  const updateSelectedDistricts = (districtIds: string[]) => {
    setSelectedDistrictsState(districtIds);
    setSelectedBlocksState([]);
    setSelectedVillagesState([]);
    setBlocks([]);
    setVillages([]);
  };

  const updateSelectedBlocks = (blockIds: string[]) => {
    setSelectedBlocksState(blockIds);
    setSelectedVillagesState([]);
    setVillages([]);
  };

  const updateSelectedVillages = (villageIds: string[]) => {
    setSelectedVillagesState(villageIds);
  };

  const resetSelections = () => {
    setSelectedState(null);
    setSelectedDistrictsState([]);
    setSelectedBlocksState([]);
    setSelectedVillagesState([]);
    setBlocks([]);
    setVillages([]);
    setError(null);
  };

  /* ================= PROVIDER VALUE ================= */

  const contextValue: LocationContextType = {
    states,
    districts,
    blocks,
    villages,
    selectedState,
    selectedDistricts,
    selectedBlocks,
    selectedVillages,
    isLoading,
    error,
    handleStateChange,
    setSelectedDistricts: updateSelectedDistricts,
    setSelectedBlocks: updateSelectedBlocks,
    setSelectedVillages: updateSelectedVillages,
    resetSelections,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

/* ================= HOOK ================= */

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used inside LocationProvider");
  }
  return context;
};
