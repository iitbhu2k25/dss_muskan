// DailyContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type RainfallFeature = {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    state: string;
    state_id: string;
    actual_rainfall: string;
    normal_rainfall: string;
    departure: string;
    category: string;
    color: string;
    data_source: string;
    last_updated: string;
  };
};

export type RainfallData = {
  type: string;
  features: RainfallFeature[];
  metadata: any;
};

type DailyContextType = {
  period: 'daily' | 'weekly' | 'monthly';
  setPeriod: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly'>>;
  rainfallData: RainfallData | null;
  loading: boolean;
  error: string | null;
};

export const DailyContext = createContext<DailyContextType | undefined>(undefined);

export const DailyProvider = ({ children }: { children: ReactNode }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'cummulative'>('daily');
  const [rainfallData, setRainfallData] = useState<RainfallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:9000/django/extract/state/rainfall/${period}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch rainfall data');
        return res.json();
      })
      .then((data: RainfallData) => {
        setRainfallData(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [period]);

  return (
    <DailyContext.Provider value={{ period, setPeriod, rainfallData, loading, error }}>
      {children}
    </DailyContext.Provider>
  );
};
