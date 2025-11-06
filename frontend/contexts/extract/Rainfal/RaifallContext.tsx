// frontend/contexts/extract/Rainfal/RainfallContext.tsx
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';

export type RainfallFeature = {
  type: string;
  geometry: { type: string; coordinates: any };
  properties: {
    // District fields
    DISTRICT?: string;
    rainfall_balloonText?: string;
    rainfall_title?: string;
    rainfall_color?: string;
    rainfall_info?: string;
    
    // State fields
    state?: string;
    state_id?: string;
    district?: string;
    district_id?: string;
    actual_rainfall?: string;
    normal_rainfall?: string;
    departure?: string;
    category?: string;
    last_updated?: string;
    
    // River Basin fields
    OBJECTID?: number;
    Basin_1?: string;
    Subbasin_1?: string;
    FMO_1?: string;
    Shape_Area?: number;
    title?: string;
    basin_name?: string;
    fmo_precip?: string;
    precipitation?: string;
    date?: string;
    
    // Common fields
    color: string;
    data_source?: string;
  };
};

export type RainfallMetadata = {
  title: string;
  source: string;
  period: string;
  period_label?: string;
  date_range?: string;
  legend?: {
    [key: string]: {
      range: string;
      color: string;
    };
  };
};

export type RainfallData = {
  type: string;
  period?: string;
  period_label?: string;
  date_range?: string;
  features: RainfallFeature[];
  metadata?: RainfallMetadata;
};

type DailyContextType = {
  period: 'daily' | 'weekly' | 'monthly' | 'cumulative';
  setPeriod: React.Dispatch<React.SetStateAction<'daily' | 'weekly' | 'monthly' | 'cumulative'>>;
  category: 'state' | 'district' | 'riverbasin';
  setCategory: React.Dispatch<React.SetStateAction<'state' | 'district' | 'riverbasin'>>;
  riverBasinDay: 'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7' | 'aap';
  setRiverBasinDay: React.Dispatch<React.SetStateAction<'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7' | 'aap'>>;
  rainfallData: RainfallData | null;
  loading: boolean;
  error: string | null;
};

export const DailyContext = createContext<DailyContextType | undefined>(undefined);

export const DailyProvider = ({ children }: { children: ReactNode }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'cumulative'>('daily');
  const [category, setCategory] = useState<'state' | 'district' | 'riverbasin'>('state');
  const [riverBasinDay, setRiverBasinDay] = useState<'day1' | 'day2' | 'day3' | 'day4' | 'day5' | 'day6' | 'day7' | 'aap'>('day1');
  const [rainfallData, setRainfallData] = useState<RainfallData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    let endpoint = '';
    if (category === 'riverbasin') {
      endpoint = `http://localhost:9000/django/extract/rainfall/riverbasin/${riverBasinDay}`;
    } else {
      endpoint = `http://localhost:9000/django/extract/${category}/rainfall/${period}`;
    }
    
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
  }, [period, category, riverBasinDay]);

  return (
    <DailyContext.Provider value={{ 
      period, 
      setPeriod, 
      category, 
      setCategory, 
      riverBasinDay, 
      setRiverBasinDay, 
      rainfallData, 
      loading, 
      error 
    }}>
      {children}
    </DailyContext.Provider>
  );
};