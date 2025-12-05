// contexts/extract/Weather/MapContext.tsx
import { createContext, useContext, ReactNode, useRef } from "react";
import React from "react";
interface WeatherMapContextType {
  mapRef: React.RefObject<HTMLDivElement>;
}

const WeatherMapContext = createContext<WeatherMapContextType | undefined>(
  undefined
);

export const WeatherMapProvider = ({ children }: { children: ReactNode }) => {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <WeatherMapContext.Provider value={{ mapRef }}>
      {children}
    </WeatherMapContext.Provider>
  );
};

export const useWeatherMap = () => {
  const context = useContext(WeatherMapContext);
  if (!context) {
    throw new Error("useWeatherMap must be used within WeatherMapProvider");
  }
  return context;
};