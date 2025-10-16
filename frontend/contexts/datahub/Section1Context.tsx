'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Shapefile {
  fid: number;
  shapefile_name: string;
  shapefile_path: string;
}

interface ShapefileContextType {
  shapefiles: Shapefile[];
  selectedShapefile: Shapefile | null;
  setSelectedShapefile: (file: Shapefile | null) => void;
  fetchShapefiles: () => Promise<void>;
}

const ShapefileContext = createContext<ShapefileContextType | undefined>(undefined);

export const ShapefileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shapefiles, setShapefiles] = useState<Shapefile[]>([]);
  const [selectedShapefile, setSelectedShapefile] = useState<Shapefile | null>(null);

  const fetchShapefiles = async () => {
    try {
      const response = await fetch('/django/datahub/shapefiles');
      if (!response.ok) throw new Error('Failed to fetch shapefiles');
      const data = await response.json();
      setShapefiles(data);
    } catch (error) {
      console.error('Error fetching shapefiles:', error);
    }
  };

  useEffect(() => {
    fetchShapefiles();
  }, []);

  return (
    <ShapefileContext.Provider value={{ shapefiles, selectedShapefile, setSelectedShapefile, fetchShapefiles }}>
      {children}
    </ShapefileContext.Provider>
  );
};

export const useShapefile = () => {
  const context = useContext(ShapefileContext);
  if (!context) throw new Error('useShapefile must be used within a ShapefileProvider');
  return context;
};
