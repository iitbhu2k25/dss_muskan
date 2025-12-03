/// frontend/app/dss/rsq/admin/components/Map.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import { useMapContext } from '@/contexts/rsq/admin/MapContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import 'ol/ol.css';

const baseMapNames: Record<string, { name: string; icon: string }> = {
  osm: { name: 'OpenStreetMap', icon: '🗺️' },
  terrain: { name: 'Stamen Terrain', icon: '🌄' },
  cartoLight: { name: 'Carto Light', icon: '☀️' },
  satellite: { name: 'Satellite', icon: '🛰️' },
  topo: { name: 'Topographic', icon: '⛰️' },
};

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const {
    setMapContainer,
    selectedBaseMap,
    changeBaseMap,
    error,
    isLoading,
    showLabels,
    toggleLabels,
  } = useMapContext();

  useEffect(() => {
    if (mapRef.current) {
      console.log('Setting map container');
      setMapContainer(mapRef.current);
    }
    return () => setMapContainer(null);
  }, [setMapContainer]);

  if (error) {
    return (
      <div className="w-full h-[600px] bg-red-50 border-2 border-red-200 rounded-xl shadow-lg flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Map Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-all"
          >
            Reload Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="relative">
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-[600px] bg-gray-100"
          style={{ minHeight: '600px' }}
        />

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2 z-50">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-700">Loading layers...</span>
          </div>
        )}

      
        {/* Global Styles */}
        <style jsx global>{`
          .ol-control button {
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 6px;
            border: 1px solid rgba(209, 213, 219, 0.8);
          }

          .ol-hover-popup {
            background: rgba(255, 255, 255, 0.98) !important;
            border: 2px solid #3b82f6 !important;
            border-radius: 12px !important;
            padding: 10px 16px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #1f2937 !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25) !important;
            pointer-events: none !important;
            white-space: nowrap !important;
            max-width: 350px !important;
            z-index: 1000 !important;
          }

          /* Zoom controls styling */
          .ol-zoom {
            top: auto !important;
            bottom: 520px !important;
            left: 14px !important;
            right: auto !important;
          }

          .ol-zoom button {
            width: 32px !important;
            height: 32px !important;
            font-size: 18px !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Map;