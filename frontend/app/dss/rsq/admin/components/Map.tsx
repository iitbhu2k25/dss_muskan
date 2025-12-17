'use client';

import React, { useRef, useEffect } from 'react';
import { useMapContext } from '@/contexts/rsq/admin/MapContext';
import { FaEye, FaEyeSlash, FaLayerGroup, FaMapMarkerAlt, FaGlobe, FaTractor, FaBuilding, FaRegDotCircle, FaTint } from 'react-icons/fa';
import 'ol/ol.css';

// Define a map for professional-looking icons
const layerIcons: Record<string, React.ReactElement> = {
  india: <FaGlobe className="text-red-500" />,
  state: <FaMapMarkerAlt className="text-blue-500" />,
  district: <FaRegDotCircle className="text-green-600" />,
  block: <FaBuilding className="text-yellow-600" />,
  village: <FaTractor className="text-gray-500" />,
  groundwater: <FaTint className="text-blue-600" />,
};

// RSQ Legend data based on CGWB classification
const RSQ_LEGEND = [
  { label: 'Safe', color: '#27ae60', range: '≤ 70%' },
  { label: 'Semi-Critical', color: '#f39c12', range: '70-90%' },
  { label: 'Critical', color: '#e74c3c', range: '90-100%' },
  { label: 'Over-Exploited', color: '#c0392b', range: '> 100%' },
  { label: 'No Data', color: '#95a5a6', range: 'N/A' },
];

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
    activeLayers = {},
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
    { key: 'village', label: 'Village Boundaries' },
    { key: 'groundwater', label: 'RSQ Analysis' },
  ];

  // Filter layers based on which ones are active on the map AND sort them for logical display
  const visibleLayers = allLayers
    .filter(layer => activeLayers[layer.key])
    .sort((a, b) => {
      const order = ['india', 'state', 'district', 'block', 'village', 'groundwater'];
      return order.indexOf(a.key) - order.indexOf(b.key);
    });

  if (error) {
    return (
      <div className="w-full h-screen bg-red-50 border-2 border-red-200 rounded-xl shadow-lg flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️ Map Error</div>
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
      <div className="absolute top-3 right-3 bg-white rounded-lg shadow-xl p-2 z-10 w-64">
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
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm">{layerIcons[key]}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {label}
                  </span>
                </div>

                <button
                  onClick={() => toggleLayerVisibility(key)}
                  className={`p-1 rounded-full transition-all text-xs ${layerVisibility[key] !== false
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    }`}
                  title={layerVisibility[key] !== false ? "Hide layer" : "Show layer"}
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
      </div>

      {/* RSQ Legend - Show only when groundwater layer is active and visible */}
      {activeLayers.groundwater && layerVisibility.groundwater !== false && (
        <div className="absolute bottom-6 right-3 bg-white rounded-lg shadow-xl p-3 z-10 w-56">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <FaTint className="text-blue-600 text-sm" />
            <h3 className="font-semibold text-xs text-gray-800">RSQ Classification</h3>
          </div>
          <div className="space-y-1.5">
            {RSQ_LEGEND.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.range}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t">
            <p className="text-xs text-gray-500 italic">Stage of Ground Water Extraction</p>
          </div>
        </div>
      )}

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