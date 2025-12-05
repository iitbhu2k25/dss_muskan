// components/weather/components/map.tsx - Updated controls only
"use client";
import { useWeatherMap } from "@/contexts/extract/Weather/MapContext";

const WeatherMap = () => {
  const { mapRef, isLoading, isSatellite, toggleBaseMap } = useWeatherMap();

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapRef} 
        className="w-full h-full"
        style={{ display: isLoading ? 'block' : 'block' }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Loading</span>
          </div>
        </div>
      )}

      {/* Simple dropdown-style base map toggle */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 w-32">
          <button
            onClick={toggleBaseMap}
            className="w-full px-3 py-2 text-sm text-gray-700 text-left hover:bg-gray-50 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            {isSatellite ? 'Street Map' : 'Satellite'}
          </button>
        </div>
      </div>

      
    </div>
  );
};

export default WeatherMap;
