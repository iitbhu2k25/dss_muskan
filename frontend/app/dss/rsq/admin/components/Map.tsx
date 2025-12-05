'use client';

import React, { useRef, useEffect } from 'react';
import { useMapContext } from '@/contexts/rsq/admin/MapContext';
import { FaEye, FaEyeSlash, FaLayerGroup, FaMapMarkerAlt, FaGlobe, FaTractor, FaBuilding, FaTint, FaRegDotCircle } from 'react-icons/fa';
import 'ol/ol.css';

// Define a map for professional-looking icons
const layerIcons: Record<string, React.ReactElement> = {
  india: <FaGlobe className="text-red-500" />,
  state: <FaMapMarkerAlt className="text-blue-500" />,
  district: <FaRegDotCircle className="text-green-600" />,
  block: <FaBuilding className="text-yellow-600" />,
  village: <FaTractor className="text-gray-500" />, // Simple village boundary
  rsq: <FaTint className="text-teal-600" />, // RSQ data layer
};

const Map: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const {
    setMapContainer,
    error,
    isLoading,
    showLabels,
    toggleLabels,
    toggleLayerVisibility,
    layerVisibility = {},
    activeLayers = {}, // Use the new activeLayers state
  } = useMapContext();

  useEffect(() => {
    if (mapRef.current) {
      setMapContainer(mapRef.current);
    }
    return () => setMapContainer(null);
  }, [setMapContainer]);

  // Define all possible layers with proper labels
  const allLayers = [
    { key: 'india', label: 'India Boundary' },
    { key: 'state', label: 'State Boundary' },
    { key: 'district', label: 'District Boundaries' },
    { key: 'block', label: 'Block Boundaries' },
    { key: 'village', label: 'Village Boundaries (Base)' },
    { key: 'rsq', label: 'RSQ Groundwater Data' },
  ];

  // Filter layers based on which ones are active on the map AND sort them for logical display
  const visibleLayers = allLayers
    .filter(layer => activeLayers[layer.key])
    .sort((a, b) => {
      // Custom sort order to display layers from broadest to finest, 
      // and RSQ (data) on top of Village (base).
      const order = ['india', 'state', 'district', 'block', 'village', 'rsq'];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });


  if (error) {
    return (
      <div className="w-full h-screen bg-red-50 border-2 border-red-200 rounded-xl shadow-lg flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">Map Error</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg">
            Reload Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Layer Control Panel */}
     <div className="absolute top-3 right-3 bg-white rounded-lg shadow-xl p-2 z-10 w-56">
  {/* Header */}
  <div className="flex items-center gap-2 mb-2 pb-2 border-b">
    <FaLayerGroup className="text-blue-600 text-base" />
    <h3 className="font-semibold text-sm text-gray-800">Active Layers</h3>
  </div>

  {/* Layers List */}
  <div className="space-y-1">
    {visibleLayers.length > 0 ? (
      visibleLayers.map(({ key, label }) => (
        <div
          key={key}
          className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-100 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{layerIcons[key]}</span>
            <span className="text-xs font-medium text-gray-700">
              {label}
            </span>
          </div>

          <button
            onClick={() => toggleLayerVisibility(key)}
            className={`p-1 rounded-full transition-all text-xs ${
              layerVisibility[key] !== false
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-300 text-gray-600 hover:bg-gray-400"
            }`}
          >
            {layerVisibility[key] !== false ? <FaEye /> : <FaEyeSlash />}
          </button>
        </div>
      ))
    ) : (
      <p className="text-xs text-gray-500 text-center py-1">
        No layers loaded
      </p>
    )}
  </div>

  {/* Label Toggle */}
  <div className="mt-3 pt-2 border-t">
    <div className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer">
      <span className="text-xs font-medium text-gray-700">
        Show Labels
      </span>
      <button
        onClick={toggleLabels}
        className={`p-1 rounded-full transition-all text-xs ${
          showLabels
            ? "bg-green-500 text-white hover:bg-green-600"
            : "bg-gray-300 text-gray-600 hover:bg-gray-400"
        }`}
      >
        {showLabels ? <FaEye /> : <FaEyeSlash />}
      </button>
    </div>
  </div>
</div>


      {/* Loading */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg">
          <span className="text-sm font-medium">Loading layers...</span>
        </div>
      )}
    </div>
  );
};

export default Map;