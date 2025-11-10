"use client";

import React, { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import { useMap } from "@/contexts/extract/Waterlevel/MapContext";

const WaterLevelMap = () => {
  const {
    map,
    toggleBaseMap,
    isSatellite,
    popupOverlay,
    popupData,
    isPopupVisible,
    isLoading,
    closePopup,
    handleZoomIn,
    handleZoomOut,
  } = useMap();

  const mapElement = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Set map target once ref is ready
  useEffect(() => {
    if (map && mapElement.current && !map.getTarget()) {
      map.setTarget(mapElement.current);
    }
  }, [map]);

  // Set popup overlay element once ref is ready
  useEffect(() => {
    if (popupOverlay && popupRef.current) {
      popupOverlay.setElement(popupRef.current);
    }
  }, [popupOverlay]);

  // Track fullscreen state
  useEffect(() => {
    const onFsChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange as any);
    document.addEventListener("mozfullscreenchange", onFsChange as any);
    document.addEventListener("MSFullscreenChange", onFsChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange as any);
      document.removeEventListener("mozfullscreenchange", onFsChange as any);
      document.removeEventListener("MSFullscreenChange", onFsChange as any);
    };
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const el = wrapRef.current;
    if (!el) return;
    try {
      const isFull =
        !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
      if (!isFull) {
        const req =
          (el as any).requestFullscreen ||
          (el as any).webkitRequestFullscreen ||
          (el as any).mozRequestFullScreen ||
          (el as any).msRequestFullscreen;
        await req.call(el);
      } else {
        const exit =
          (document as any).exitFullscreen ||
          (document as any).webkitExitFullscreen ||
          (document as any).mozCancelFullScreen ||
          (document as any).msExitFullscreen;
        await exit.call(document);
      }
    } catch {
      // no-op
    }
  };

  return (
    <div ref={wrapRef} className={`${isFullScreen ? "fixed inset-0 z-50" : "h-screen w-full"} bg-gray-100 p-15`}>
      <div className="h-full w-full relative flex flex-col">
        {/* Map container */}
        <div className="flex-1 w-full relative rounded-lg overflow-hidden shadow-2xl border-4 border-gray-300">
          <div ref={mapElement} className="w-full h-full" style={{ minHeight: "400px" }} />

          {/* Popup - Always rendered but positioned by OpenLayers */}
          <div
            ref={popupRef}
            className="ol-popup"
            style={{
              position: "absolute",
              backgroundColor: "white",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              padding: "0",
              borderRadius: "12px",
              border: "2px solid #e5e7eb",
              bottom: "12px",
              left: "-200px",
              minWidth: "350px",
              maxWidth: "450px",
              maxHeight: "500px",
              overflowY: "auto",
              display: isPopupVisible ? "block" : "none",
            }}
          >
            <div className="p-5">
              <button
                onClick={closePopup}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close popup"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : popupData ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg text-gray-800 border-b-2 border-blue-500 pb-2">
                    {popupData.stationName}
                  </h3>
                  
                  {/* Basic Info */}
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between">
                      <span className="font-semibold text-gray-600">Station Code:</span>
                      <span className="text-gray-800">{popupData.stationCode}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-gray-600">Water Level:</span>
                      <span className={`font-bold ${popupData.waterLevel !== null ? "text-blue-600" : "text-gray-400"}`}>
                        {popupData.waterLevel !== null ? `${popupData.waterLevel} m` : "No data"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-gray-600">Date/Time:</span>
                      <span className="text-gray-800 text-xs">{popupData.dateTime}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="font-semibold text-gray-600">Flood Status:</span>
                      <span
                        className={`font-semibold ${
                          popupData.floodStatus === "Normal" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {popupData.floodStatus}
                      </span>
                    </p>
                    {popupData.status && (
                      <p className="flex justify-between">
                        <span className="font-semibold text-gray-600">API Status:</span>
                        <span className={`text-xs ${popupData.status === "Success" ? "text-green-600" : "text-orange-600"}`}>
                          {popupData.status}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Metadata Section */}
                  {popupData.metadata && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Station Details</h4>
                      <div className="space-y-1 text-xs">
                        {popupData.metadata.stationName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">Full Name:</span>
                            <span className="text-gray-800 truncate ml-2" title={popupData.metadata.stationName}>
                              {popupData.metadata.stationName}
                            </span>
                          </p>
                        )}
                        {popupData.metadata.riverName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">River:</span>
                            <span className="text-gray-800">{popupData.metadata.riverName}</span>
                          </p>
                        )}
                        {popupData.metadata.basinName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">Basin:</span>
                            <span className="text-gray-800">{popupData.metadata.basinName}</span>
                          </p>
                        )}
                        {popupData.metadata.subBasinName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">Sub-Basin:</span>
                            <span className="text-gray-800">{popupData.metadata.subBasinName}</span>
                          </p>
                        )}
                        {popupData.metadata.stateName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">State:</span>
                            <span className="text-gray-800">{popupData.metadata.stateName}</span>
                          </p>
                        )}
                        {popupData.metadata.districtName && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">District:</span>
                            <span className="text-gray-800">{popupData.metadata.districtName}</span>
                          </p>
                        )}
                        {(popupData.metadata.latitude && popupData.metadata.longitude) && (
                          <p className="flex justify-between">
                            <span className="text-gray-600">Coordinates:</span>
                            <span className="text-gray-800 text-xs">
                              {popupData.metadata.latitude.toFixed(4)}, {popupData.metadata.longitude.toFixed(4)}
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Water Level Details if available */}
                      {popupData.metadata.dangerLevel && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <h5 className="font-semibold text-xs text-gray-700 mb-1">Threshold Levels (m)</h5>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {popupData.metadata.dangerLevel && (
                              <p>
                                <span className="text-gray-600">Danger: </span>
                                <span className="text-red-600 font-semibold">{popupData.metadata.dangerLevel}</span>
                              </p>
                            )}
                            {popupData.metadata.warningLevel && (
                              <p>
                                <span className="text-gray-600">Warning: </span>
                                <span className="text-orange-600 font-semibold">{popupData.metadata.warningLevel}</span>
                              </p>
                            )}
                            {popupData.metadata.highFloodLevel && (
                              <p>
                                <span className="text-gray-600">HFL: </span>
                                <span className="text-purple-600 font-semibold">{popupData.metadata.highFloodLevel}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title="Zoom In"
              disabled={!map}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title="Zoom Out"
              disabled={!map}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>

          {/* Compass */}
          <div className="absolute top-4 left-20 z-20 bg-white rounded-full shadow-lg p-2 border border-gray-200">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>

          {/* Base Map Toggle */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={toggleBaseMap}
              className="px-4 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200 flex items-center gap-2"
              title="Toggle Base Map"
              disabled={!map}
            >
              {isSatellite ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
              )}
              <span className="text-sm font-medium">{isSatellite ? "Street Map" : "Satellite"}</span>
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <div className="absolute bottom-16 right-4 z-20">
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-lg border border-gray-200"
              title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullScreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9H5V5M15 9h4V5M9 15H5v4M15 15h4v4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h4V3M17 7h-4V3M7 17h4v4M17 17h-4v4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterLevelMap;