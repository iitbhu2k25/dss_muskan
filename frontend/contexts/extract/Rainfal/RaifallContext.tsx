// frontend/contexts/extract/Rainfal/RaifallContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type RainfallFeature = {
  type: string;
  geometry: { type: string; coordinates: [number, number] };
  properties: {
    DISTRICT: string | undefined;
    rainfall_color: string;
    rainfall_info: string;
    rainfall_title: string;
    rainfall_balloonText(rainfall_balloonText: (rainfall_balloonText: any, arg1: string) => unknown, arg1: string): unknown;
    rainfall_balloonText(rainfall_balloonText: any, arg1: string): unknown;
    state: string;
    state_id?: string;
    district?: string;
    district_id?: string;
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
  period: 'daily' | 'weekly' | 'monthly' | 'cumulative';
  setPeriod: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly' | 'cumulative'>>;
  category: 'state' | 'district';
  setCategory: React.Dispatch<React.SetStateAction<'state' | 'district'>>;
  rainfallData: RainfallData | null;
  loading: boolean;
  error: string | null;
};

export const DailyContext = createContext<DailyContextType | undefined>(undefined);

export const DailyProvider = ({ children }: { children: ReactNode }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'cumulative'>('daily');
  const [category, setCategory] = useState<'state' | 'district'>('state');
  const [rainfallData, setRainfallData] = useState<RainfallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const endpoint = `http://localhost:9000/django/extract/${category}/rainfall/${period}`;
    
    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch ${category} rainfall data`);
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
  }, [period, category]);

  return (
    <DailyContext.Provider value={{ period, setPeriod, category, setCategory, rainfallData, loading, error }}>
      {children}
    </DailyContext.Provider>
  );
};