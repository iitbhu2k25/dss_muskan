'use client';
import React, { useEffect } from 'react';
import { useMap } from '@/contexts/datahub/MapContext';
import { useShapefile } from '@/contexts/datahub/Section1Context';

const MapComponent = () => {
  const { mapInstance, mapContainerRef, popupRef, isLoading, error, featureInfo, setFeatureInfo } = useMap();
  const { selectedShapefile } = useShapefile();

  // Ensure map updates its size when component mounts or resizes
  useEffect(() => {
    if (mapInstance) {
      const timer = setTimeout(() => {
        mapInstance.updateSize();
        console.log('✓ Map size updated');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [mapInstance]);

  // Close popup handler
  const closePopup = () => {
    setFeatureInfo(null);
  };

  return (
    <div className="h-full relative bg-gray-50">
      {/* Map Container with Border */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full absolute inset-0 border-4 border-blue-500 rounded-lg shadow-xl"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Feature Info Popup */}
      <div
        ref={popupRef}
        className={`bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-4 min-w-[250px] max-w-[400px] ${
          featureInfo ? 'block' : 'hidden'
        }`}
      >
        {featureInfo && (
          <>
            {/* Popup Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-base">
                {featureInfo.layerName}
              </h3>
              <button
                onClick={closePopup}
                className="text-gray-500 hover:text-gray-700 font-bold text-xl leading-none"
                title="Close"
              >
                ×
              </button>
            </div>

            {/* Feature Attributes */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Object.entries(featureInfo.properties).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {key}
                  </span>
                  <span className="text-sm text-gray-800 break-words">
                    {value !== null && value !== undefined ? String(value) : 'N/A'}
                  </span>
                </div>
              ))}
            </div>

            {/* Popup Arrow */}
            <div className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px] border-transparent border-t-gray-300"></div>
          </>
        )}
      </div>

      {/* Loading State */}
      {!mapInstance && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold text-lg">Loading Map...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-100 border-2 border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-xl max-w-md">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Layer Info Display */}
      {selectedShapefile && mapInstance && (
        <div className="absolute bottom-4 left-4 z-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-lg shadow-xl border-2 border-blue-700">
          <p className="text-sm font-semibold flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            Active Layer: {selectedShapefile.shapefile_name}
          </p>
        </div>
      )}

      {/* Map Controls */}
      {mapInstance && (
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-xl p-1 border-2 border-gray-300">
          <button
            onClick={() => {
              const view = mapInstance.getView();
              view.animate({
                center: view.getCenter(),
                zoom: view.getZoom()! + 1,
                duration: 250,
              });
            }}
            className="block w-10 h-10 bg-white hover:bg-blue-500 hover:text-white rounded-t-md mb-[2px] flex items-center justify-center font-bold text-xl transition-colors border-b border-gray-200"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => {
              const view = mapInstance.getView();
              view.animate({
                center: view.getCenter(),
                zoom: view.getZoom()! - 1,
                duration: 250,
              });
            }}
            className="block w-10 h-10 bg-white hover:bg-blue-500 hover:text-white rounded-b-md flex items-center justify-center font-bold text-xl transition-colors"
            title="Zoom Out"
          >
            −
          </button>
        </div>
      )}

      {/* Instruction Text */}
      {selectedShapefile && mapInstance && !featureInfo && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-50 border-2 border-blue-300 text-blue-700 px-4 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">
            💡 Click on the map to view feature attributes
          </p>
        </div>
      )}

      {/* Basemap Selector */}
      {mapInstance && (
        <div className="absolute bottom-4 right-4 z-10 flex gap-2">
          <button
            onClick={() => {
              // You can implement basemap switching here
              console.log('Switch to OSM');
            }}
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-lg border-2 border-gray-300 transition-colors text-sm"
            title="OpenStreetMap"
          >
            🗺️ Street
          </button>
          <button
            onClick={() => {
              // You can implement basemap switching here
              console.log('Switch to Satellite');
            }}
            className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-lg border-2 border-gray-300 transition-colors text-sm"
            title="Satellite View"
          >
            🛰️ Satellite
          </button>
        </div>
      )}
    </div>
  );
};

export default MapComponent;